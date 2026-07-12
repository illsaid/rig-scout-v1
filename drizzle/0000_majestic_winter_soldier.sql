CREATE TABLE `component_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`canonical_name` text NOT NULL,
	`vendor` text NOT NULL,
	`family` text,
	`model_number` text,
	`performance_tier` real,
	`aliases_json` text DEFAULT '[]' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `component_catalog_type_name_uq` ON `component_catalog` (`type`,`canonical_name`);--> statement-breakpoint
CREATE INDEX `component_catalog_type_tier_idx` ON `component_catalog` (`type`,`performance_tier`);--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`retailer` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`fetched_count` integer DEFAULT 0 NOT NULL,
	`changed_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`error_summary_json` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ingestion_runs_retailer_started_idx` ON `ingestion_runs` (`retailer`,`started_at`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`retailer` text NOT NULL,
	`retailer_sku` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`model_number` text,
	`category` text,
	`cpu` text NOT NULL,
	`gpu` text NOT NULL,
	`gpu_vram_gb` integer DEFAULT 0 NOT NULL,
	`quick_sync` integer DEFAULT false NOT NULL,
	`ram_gb` integer DEFAULT 0 NOT NULL,
	`ram_config` text DEFAULT 'Unknown' NOT NULL,
	`storage_tb` real DEFAULT 0 NOT NULL,
	`motherboard` text,
	`case_standard` text DEFAULT 'Unknown' NOT NULL,
	`psu_wattage` integer,
	`psu_tier` text DEFAULT 'Unknown' NOT NULL,
	`cooling` text DEFAULT 'Unknown' NOT NULL,
	`upgradeability_confidence` real DEFAULT 0 NOT NULL,
	`cpu_confidence` real DEFAULT 0 NOT NULL,
	`gpu_confidence` real DEFAULT 0 NOT NULL,
	`ram_confidence` real DEFAULT 0 NOT NULL,
	`storage_confidence` real DEFAULT 0 NOT NULL,
	`motherboard_confidence` real DEFAULT 0 NOT NULL,
	`psu_confidence` real DEFAULT 0 NOT NULL,
	`cooling_confidence` real DEFAULT 0 NOT NULL,
	`case_standard_confidence` real DEFAULT 0 NOT NULL,
	`ram_config_confidence` real DEFAULT 0 NOT NULL,
	`price_cents` integer NOT NULL,
	`regular_price_cents` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`canonical_url` text NOT NULL,
	`image_url` text,
	`image_source` text,
	`image_attribution` text,
	`fetched_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_retailer_sku_uq` ON `listings` (`retailer`,`retailer_sku`);--> statement-breakpoint
CREATE INDEX `listings_expires_at_idx` ON `listings` (`expires_at`);--> statement-breakpoint
CREATE INDEX `listings_available_price_idx` ON `listings` (`available`,`price_cents`);--> statement-breakpoint
CREATE TABLE `raw_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`retailer` text NOT NULL,
	`retailer_sku` text NOT NULL,
	`payload_json` text NOT NULL,
	`payload_hash` text NOT NULL,
	`source_url` text,
	`normalization_version` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `raw_snapshots_payload_uq` ON `raw_snapshots` (`retailer`,`retailer_sku`,`payload_hash`);--> statement-breakpoint
CREATE INDEX `raw_snapshots_expires_at_idx` ON `raw_snapshots` (`expires_at`);--> statement-breakpoint
CREATE INDEX `raw_snapshots_listing_id_idx` ON `raw_snapshots` (`listing_id`);