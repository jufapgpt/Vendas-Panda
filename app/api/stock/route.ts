import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { stockBatches, stockRows } from "../../../db/schema";
import { parseStockWorkbook, type StockRow } from "../../../lib/stock";

const STORES = ["PANDA SHOPPING LIGHT", "PANDA BOA VISTA"] as const;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const D1_INSERT_CHUNK_SIZE = 10;

function storeFromFileName(fileName: string) {
  if (/boa[\s_-]*vista/i.test(fileName)) return "PANDA BOA VISTA";
  if (/light|shopping/i.test(fileName)) return "PANDA SHOPPING LIGHT";
  return null;
}

export async function GET() {
  try {
    const db = getDb();
    const rows: StockRow[] = [];
    const sourceFiles: string[] = [];
    let uploadedAt = "";

    for (const store of STORES) {
      const [latest] = await db
        .select({ batch: stockBatches })
        .from(stockBatches)
        .innerJoin(stockRows, eq(stockRows.batchId, stockBatches.id))
        .where(eq(stockBatches.store, store))
        .orderBy(desc(stockBatches.uploadedAt), desc(stockBatches.id))
        .limit(1);
      if (!latest?.batch) continue;

      sourceFiles.push(latest.batch.fileName);
      if (latest.batch.uploadedAt > uploadedAt) uploadedAt = latest.batch.uploadedAt;
      const storedRows = await db
        .select()
        .from(stockRows)
        .where(eq(stockRows.batchId, latest.batch.id));
      rows.push(
        ...storedRows.map((row) => ({
          store: row.store,
          code: row.productCode,
          product: row.product,
          quantity: row.quantity,
          cost: row.cost,
        })),
      );
    }

    return Response.json({ sourceFiles, uploadedAt, rows });
  } catch {
    return Response.json({ rows: null });
  }
}

export async function POST(request: Request) {
  const runtime = env as unknown as { UPLOADS: R2Bucket };
  const savedObjects: string[] = [];
  const savedBatchIds: number[] = [];

  try {
    const files = (await request.formData())
      .getAll("files")
      .filter((item): item is File => item instanceof File);
    if (files.length !== 2) {
      return Response.json(
        { error: "Selecione as duas planilhas: Shopping Light e Boa Vista." },
        { status: 400 },
      );
    }

    const parsed = [];
    for (const file of files) {
      const store = storeFromFileName(file.name);
      if (!store) {
        return Response.json(
          { error: "Use arquivos com “Light” e “Boa Vista” no nome." },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `A planilha ${file.name} deve ter no máximo 15 MB.` },
          { status: 400 },
        );
      }

      const buffer = await file.arrayBuffer();
      const rows = parseStockWorkbook(buffer, store);
      if (!rows.length) {
        return Response.json(
          { error: `Não encontrei estoque de celulares em ${file.name}.` },
          { status: 400 },
        );
      }
      parsed.push({ file, store, buffer, rows });
    }

    if (new Set(parsed.map((item) => item.store)).size !== 2) {
      return Response.json(
        { error: "Selecione uma planilha de cada loja." },
        { status: 400 },
      );
    }

    const db = getDb();
    for (const item of parsed) {
      const objectKey = `stock/${new Date().toISOString()}-${crypto.randomUUID()}-${item.file.name}`;
      await runtime.UPLOADS.put(objectKey, item.buffer, {
        httpMetadata: {
          contentType:
            item.file.type ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        customMetadata: { originalName: item.file.name, store: item.store },
      });
      savedObjects.push(objectKey);

      const [batch] = await db
        .insert(stockBatches)
        .values({
          store: item.store,
          fileName: item.file.name,
          objectKey,
          rowCount: item.rows.length,
        })
        .returning();
      savedBatchIds.push(batch.id);

      for (let index = 0; index < item.rows.length; index += D1_INSERT_CHUNK_SIZE) {
        const chunk = item.rows.slice(index, index + D1_INSERT_CHUNK_SIZE);
        await db.insert(stockRows).values(
          chunk.map((row) => ({
            batchId: batch.id,
            store: row.store,
            productCode: row.code,
            product: row.product,
            quantity: row.quantity,
            cost: row.cost,
          })),
        );
      }
    }

    return Response.json({
      sourceFiles: parsed.map((item) => item.file.name),
      uploadedAt: new Date().toISOString(),
      rows: parsed.flatMap((item) => item.rows),
    });
  } catch (error) {
    console.error("Stock spreadsheet import failed", error);
    const db = getDb();
    for (const batchId of savedBatchIds) {
      await db.delete(stockBatches).where(eq(stockBatches.id, batchId));
    }
    for (const objectKey of savedObjects) {
      await runtime.UPLOADS.delete(objectKey);
    }
    return Response.json(
      { error: "Não foi possível atualizar os estoques agora. Tente novamente." },
      { status: 500 },
    );
  }
}
