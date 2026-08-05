import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const salesBatches = sqliteTable(
  "sales_batches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fileName: text("file_name").notNull(),
    objectKey: text("object_key").notNull(),
    rowCount: integer("row_count").notNull(),
    periodKey: text("period_key"),
    sourceId: text("source_id"),
    sourceModifiedAt: text("source_modified_at"),
    sourceKind: text("source_kind").notNull().default("manual"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_sales_batches_active_period").on(table.isActive, table.periodKey),
    index("idx_sales_batches_source_version").on(
      table.sourceId,
      table.sourceModifiedAt,
    ),
  ],
);

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

export const stockBatches = sqliteTable(
  "stock_batches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    store: text("store").notNull(),
    fileName: text("file_name").notNull(),
    objectKey: text("object_key").notNull(),
    rowCount: integer("row_count").notNull(),
    sourceId: text("source_id"),
    sourceModifiedAt: text("source_modified_at"),
    sourceKind: text("source_kind").notNull().default("manual"),
    uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_stock_batches_store_uploaded").on(table.store, table.uploadedAt),
    index("idx_stock_batches_source_version").on(
      table.sourceId,
      table.sourceModifiedAt,
    ),
  ],
);

export const stockRows = sqliteTable("stock_rows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: integer("batch_id")
    .notNull()
    .references(() => stockBatches.id, { onDelete: "cascade" }),
  store: text("store").notNull(),
  productCode: text("product_code").notNull(),
  product: text("product").notNull(),
  quantity: real("quantity").notNull(),
  cost: real("cost").notNull(),
});

export const syncControl = sqliteTable("sync_control", {
  id: integer("id").primaryKey(),
  lastRequestedAt: text("last_requested_at")
    .notNull()
    .default("1970-01-01 00:00:00"),
  lastCompletedAt: text("last_completed_at"),
  lastStatus: text("last_status").notNull().default("idle"),
});
