CREATE TABLE `sales_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`object_key` text NOT NULL,
	`row_count` integer NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales_rows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`store` text NOT NULL,
	`sale_date` text NOT NULL,
	`order_code` text NOT NULL,
	`product_code` text NOT NULL,
	`product` text NOT NULL,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`total` real NOT NULL,
	`cost` real NOT NULL,
	`seller` text NOT NULL,
	`payment` text NOT NULL,
	`price_type` text NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `sales_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
