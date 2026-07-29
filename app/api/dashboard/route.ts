import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, salesRows, stockBatches, stockRows } from "../../../db/schema";
import type { StockRow } from "../../../lib/stock";

export async function GET() {
  try {
    const db = getDb();
    const [latest] = await db
      .select({ batch: salesBatches })
      .from(salesBatches)
      .innerJoin(salesRows, eq(salesRows.batchId, salesBatches.id))
      .orderBy(desc(salesBatches.uploadedAt), desc(salesBatches.id))
      .limit(1);
    const batch = latest?.batch;

    if (!batch) {
      return Response.json({ rows: null });
    }

    const storedRows = await db
      .select()
      .from(salesRows)
      .where(eq(salesRows.batchId, batch.id));

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
      sourceFile: batch.fileName,
      uploadedAt: batch.uploadedAt,
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
