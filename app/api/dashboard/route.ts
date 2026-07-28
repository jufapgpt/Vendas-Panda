import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, salesRows } from "../../../db/schema";

export async function GET() {
  try {
    const db = getDb();
    const [batch] = await db
      .select()
      .from(salesBatches)
      .orderBy(desc(salesBatches.uploadedAt), desc(salesBatches.id))
      .limit(1);

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
