CREATE TABLE `outbound_clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`retailer` text NOT NULL,
	`destination_host` text NOT NULL,
	`referrer_host` text,
	`clicked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbound_clicks_listing_clicked_idx` ON `outbound_clicks` (`listing_id`,`clicked_at`);--> statement-breakpoint
CREATE INDEX `outbound_clicks_retailer_clicked_idx` ON `outbound_clicks` (`retailer`,`clicked_at`);