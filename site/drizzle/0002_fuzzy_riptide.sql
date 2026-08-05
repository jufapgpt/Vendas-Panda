ALTER TABLE `sales_batches` ADD `period_key` text;--> statement-breakpoint
ALTER TABLE `sales_batches` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `sales_batches` ADD `source_modified_at` text;--> statement-breakpoint
ALTER TABLE `sales_batches` ADD `source_kind` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_batches` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `stock_batches` ADD `source_id` text;--> statement-breakpoint
ALTER TABLE `stock_batches` ADD `source_modified_at` text;--> statement-breakpoint
ALTER TABLE `stock_batches` ADD `source_kind` text DEFAULT 'manual' NOT NULL;