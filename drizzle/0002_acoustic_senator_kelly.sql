CREATE TABLE `spec_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`retailer` text NOT NULL,
	`listing_name` text NOT NULL,
	`field` text NOT NULL,
	`displayed_value` text,
	`suggested_value` text,
	`details` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX `spec_reports_listing_created_idx` ON `spec_reports` (`listing_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `spec_reports_status_created_idx` ON `spec_reports` (`status`,`created_at`);