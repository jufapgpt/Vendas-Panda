CREATE INDEX `idx_sales_batches_active_period` ON `sales_batches` (`is_active`,`period_key`);--> statement-breakpoint
CREATE INDEX `idx_sales_batches_source_version` ON `sales_batches` (`source_id`,`source_modified_at`);--> statement-breakpoint
CREATE INDEX `idx_stock_batches_store_uploaded` ON `stock_batches` (`store`,`uploaded_at`);--> statement-breakpoint
CREATE INDEX `idx_stock_batches_source_version` ON `stock_batches` (`source_id`,`source_modified_at`);