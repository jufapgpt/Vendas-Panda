CREATE TABLE `stock_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store` text NOT NULL,
	`file_name` text NOT NULL,
	`object_key` text NOT NULL,
	`row_count` integer NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_rows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`store` text NOT NULL,
	`product_code` text NOT NULL,
	`product` text NOT NULL,
	`quantity` real NOT NULL,
	`cost` real NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
