import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, salesRows } from "../../../db/schema";
import { parseWorkbook } from "../../../lib/sales";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
// D1 accepts at most 100 bound parameters per query. Each sales row binds
// 15 values, so five rows keep every insert safely below that limit.
const D1_INSERT_CHUNK_SIZE = 5;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Selecione uma planilha." }, { status: 400 });
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return Response.json(
        { error: "Use um arquivo .xlsx, .xls ou .csv." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "A planilha deve ter no máximo 15 MB." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const rows = parseWorkbook(buffer);
    if (!rows.length) {
      return Response.json(
        { error: "Não encontrei linhas de vendas no formato esperado." },
        { status: 400 },
      );
    }

    const runtime = env as unknown as { UPLOADS: R2Bucket };
    const objectKey = `sales/${new Date().toISOString()}-${crypto.randomUUID()}-${file.name}`;
    await runtime.UPLOADS.put(objectKey, buffer, {
      httpMetadata: {
        contentType:
          file.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      customMetadata: { originalName: file.name },
    });

    const db = getDb();
    const [batch] = await db
      .insert(salesBatches)
      .values({
        fileName: file.name,
        objectKey,
        rowCount: rows.length,
      })
      .returning();

    try {
      for (let index = 0; index < rows.length; index += D1_INSERT_CHUNK_SIZE) {
        const chunk = rows.slice(index, index + D1_INSERT_CHUNK_SIZE);
        await db.insert(salesRows).values(
          chunk.map((row) => ({
            batchId: batch.id,
            store: row.store,
            saleDate: row.date,
            orderCode: row.order,
            productCode: row.code,
            product: row.product,
            category: row.category,
            type: row.type,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            total: row.total,
            cost: row.cost,
            seller: row.seller,
            payment: row.payment,
            priceType: row.priceType,
          })),
        );
      }
    } catch (error) {
      await db.delete(salesBatches).where(eq(salesBatches.id, batch.id));
      await runtime.UPLOADS.delete(objectKey);
      throw error;
    }

    return Response.json({
      sourceFile: file.name,
      uploadedAt: new Date().toISOString(),
      rows,
    });
  } catch (error) {
    console.error("Sales spreadsheet import failed", error);
    return Response.json(
      {
        error:
          "Não foi possível atualizar os dados agora. Tente novamente em alguns instantes.",
      },
      { status: 500 },
    );
  }
}
