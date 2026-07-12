import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const nowMs = sql`(unixepoch() * 1000)`;

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  retailer: text("retailer").notNull(),
  retailerSku: text("retailer_sku").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  modelNumber: text("model_number"),
  category: text("category"),
  cpu: text("cpu").notNull(),
  gpu: text("gpu").notNull(),
  gpuVramGb: integer("gpu_vram_gb").notNull().default(0),
  quickSync: integer("quick_sync", { mode: "boolean" }).notNull().default(false),
  ramGb: integer("ram_gb").notNull().default(0),
  ramConfig: text("ram_config").notNull().default("Unknown"),
  storageTb: real("storage_tb").notNull().default(0),
  motherboard: text("motherboard"),
  caseStandard: text("case_standard").notNull().default("Unknown"),
  psuWattage: integer("psu_wattage"),
  psuTier: text("psu_tier").notNull().default("Unknown"),
  cooling: text("cooling").notNull().default("Unknown"),
  upgradeabilityConfidence: real("upgradeability_confidence").notNull().default(0),
  cpuConfidence: real("cpu_confidence").notNull().default(0),
  gpuConfidence: real("gpu_confidence").notNull().default(0),
  ramConfidence: real("ram_confidence").notNull().default(0),
  storageConfidence: real("storage_confidence").notNull().default(0),
  motherboardConfidence: real("motherboard_confidence").notNull().default(0),
  psuConfidence: real("psu_confidence").notNull().default(0),
  coolingConfidence: real("cooling_confidence").notNull().default(0),
  caseStandardConfidence: real("case_standard_confidence").notNull().default(0),
  ramConfigConfidence: real("ram_config_confidence").notNull().default(0),
  priceCents: integer("price_cents").notNull(),
  regularPriceCents: integer("regular_price_cents"),
  currency: text("currency").notNull().default("USD"),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  canonicalUrl: text("canonical_url").notNull(),
  imageUrl: text("image_url"),
  imageSource: text("image_source"),
  imageAttribution: text("image_attribution"),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
}, (table) => [
  uniqueIndex("listings_retailer_sku_uq").on(table.retailer, table.retailerSku),
  index("listings_expires_at_idx").on(table.expiresAt),
  index("listings_available_price_idx").on(table.available, table.priceCents),
]);

export const rawSnapshots = sqliteTable("raw_snapshots", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  retailer: text("retailer").notNull(),
  retailerSku: text("retailer_sku").notNull(),
  payloadJson: text("payload_json").notNull(),
  payloadHash: text("payload_hash").notNull(),
  sourceUrl: text("source_url"),
  normalizationVersion: text("normalization_version").notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("raw_snapshots_payload_uq").on(table.retailer, table.retailerSku, table.payloadHash),
  index("raw_snapshots_expires_at_idx").on(table.expiresAt),
  index("raw_snapshots_listing_id_idx").on(table.listingId),
]);

export const componentCatalog = sqliteTable("component_catalog", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["cpu", "gpu"] }).notNull(),
  canonicalName: text("canonical_name").notNull(),
  vendor: text("vendor").notNull(),
  family: text("family"),
  modelNumber: text("model_number"),
  performanceTier: real("performance_tier"),
  aliasesJson: text("aliases_json").notNull().default("[]"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
}, (table) => [
  uniqueIndex("component_catalog_type_name_uq").on(table.type, table.canonicalName),
  index("component_catalog_type_tier_idx").on(table.type, table.performanceTier),
]);

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: text("id").primaryKey(),
  retailer: text("retailer").notNull(),
  status: text("status", { enum: ["running", "succeeded", "failed"] }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  fetchedCount: integer("fetched_count").notNull().default(0),
  changedCount: integer("changed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  errorSummaryJson: text("error_summary_json").notNull().default("[]"),
}, (table) => [
  index("ingestion_runs_retailer_started_idx").on(table.retailer, table.startedAt),
]);

export const outboundClicks = sqliteTable("outbound_clicks", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  retailer: text("retailer").notNull(),
  destinationHost: text("destination_host").notNull(),
  referrerHost: text("referrer_host"),
  clickedAt: integer("clicked_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("outbound_clicks_listing_clicked_idx").on(table.listingId, table.clickedAt),
  index("outbound_clicks_retailer_clicked_idx").on(table.retailer, table.clickedAt),
]);
