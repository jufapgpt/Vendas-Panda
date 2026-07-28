import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const salesBatches = sqliteTable("sales_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  objectKey: text("object_key").notNull(),
  rowCount: integer("row_count").notNull(),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const salesRows = sqliteTable("sales_rows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: integer("batch_id")
    .notNull()
    .references(() => salesBatches.id, { onDelete: "cascade" }),
  store: text("store").notNull(),
  saleDate: text("sale_date").notNull(),
  orderCode: text("order_code").notNull(),
  productCode: text("product_code").notNull(),
  product: text("product").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  cost: real("cost").notNull(),
  seller: text("seller").notNull(),
  payment: text("payment").notNull(),
  priceType: text("price_type").notNull(),
});
