import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, salesRows, stockBatches, stockRows } from "../../../db/schema";
import type { StockRow } from "../../../lib/stock";

export async function GET() {
  try {
    const db = getDb();
    const activeBatches = await db
      .select()
      .from(salesBatches)
      .where(eq(salesBatches.isActive, true))
      .orderBy(desc(salesBatches.uploadedAt), desc(salesBatches.id))
    const batch = activeBatches[0];

    if (!batch) {
      return Response.json({ rows: null });
    }

    const storedRows: Array<typeof salesRows.$inferSelect> = [];
    const batchIds = activeBatches.map((item) => item.id);
    for (let index = 0; index < batchIds.length; index += 80) {
      storedRows.push(
        ...(await db
          .select()
          .from(salesRows)
          .where(inArray(salesRows.batchId, batchIds.slice(index, index + 80)))),
      );
    }

    const stock: StockRow[] = [];
    const stockSourceFiles: string[] = [];
    let stockUploadedAt = "";
    for (const store of ["PANDA SHOPPING LIGHT", "PANDA BOA VISTA"]) {
      const [latestStock] = await db
        .select({ batch: stockBatches })
        .from(stockBatches)
        .innerJoin(stockRows, eq(stockRows.batchId, stockBatches.id))
        .where(eq(stockBatches.store, store))
        .orderBy(desc(stockBatches.uploadedAt), desc(stockBatches.id))
        .limit(1);
      if (!latestStock?.batch) continue;
      stockSourceFiles.push(latestStock.batch.fileName);
      if (latestStock.batch.uploadedAt > stockUploadedAt) {
        stockUploadedAt = latestStock.batch.uploadedAt;
      }
      const latestRows = await db
        .select()
        .from(stockRows)
        .where(eq(stockRows.batchId, latestStock.batch.id));
      stock.push(
        ...latestRows.map((row) => ({
          store: row.store,
          code: row.productCode,
          product: row.product,
          quantity: row.quantity,
          cost: row.cost,
        })),
      );
    }

    return Response.json({
      sourceFile: activeBatches.map((item) => item.fileName).join(", "),
      sourceFiles: activeBatches.map((item) => item.fileName),
      uploadedAt: activeBatches.reduce(
        (latest, item) => (item.uploadedAt > latest ? item.uploadedAt : latest),
        batch.uploadedAt,
      ),
      rows: storedRows.map((row) => ({
        store: row.store,
        date: row.saleDate,
        order: row.orderCode,
        code: row.productCode,
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
      stockRows: stock,
      stockSourceFiles,
      stockUploadedAt,
    });
  } catch {
    return Response.json({ rows: null });
  }
}
