CREATE TABLE `sync_control` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_requested_at` text DEFAULT '1970-01-01 00:00:00' NOT NULL,
	`last_completed_at` text,
	`last_status` text DEFAULT 'idle' NOT NULL
);
--> statement-breakpoint
INSERT INTO `sync_control` (`id`) VALUES (1);
