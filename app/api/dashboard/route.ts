import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, salesRows } from "../../../db/schema";

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
    });
  } catch {
    return Response.json({ rows: null });
  }
}
