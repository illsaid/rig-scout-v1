import type { BestBuyProduct } from "./best-buy.ts";
import {
  BEST_BUY_NORMALIZATION_VERSION,
  isUsableBestBuyListing,
  normalizeBestBuyProduct,
} from "./best-buy.ts";
import type { RetailerBatch } from "./types.ts";

const UPSERT_LISTING = `
INSERT INTO listings (
  id, retailer, retailer_sku, name, brand, model_number, category, cpu, gpu,
  gpu_vram_gb, quick_sync, ram_gb, ram_config, storage_tb, motherboard,
  case_standard, psu_wattage, psu_tier, cooling, upgradeability_confidence,
  cpu_confidence, gpu_confidence, ram_confidence, storage_confidence,
  motherboard_confidence, psu_confidence, cooling_confidence,
  case_standard_confidence, ram_config_confidence, price_cents,
  regular_price_cents, currency, available, canonical_url, image_url,
  image_source, image_attribution, fetched_at, expires_at, updated_at
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
ON CONFLICT(retailer, retailer_sku) DO UPDATE SET
  name=excluded.name, brand=excluded.brand, model_number=excluded.model_number,
  category=excluded.category, cpu=excluded.cpu, gpu=excluded.gpu,
  gpu_vram_gb=excluded.gpu_vram_gb, quick_sync=excluded.quick_sync,
  ram_gb=excluded.ram_gb, ram_config=excluded.ram_config,
  storage_tb=excluded.storage_tb, motherboard=excluded.motherboard,
  case_standard=excluded.case_standard, psu_wattage=excluded.psu_wattage,
  psu_tier=excluded.psu_tier, cooling=excluded.cooling,
  upgradeability_confidence=excluded.upgradeability_confidence,
  cpu_confidence=excluded.cpu_confidence, gpu_confidence=excluded.gpu_confidence,
  ram_confidence=excluded.ram_confidence, storage_confidence=excluded.storage_confidence,
  motherboard_confidence=excluded.motherboard_confidence,
  psu_confidence=excluded.psu_confidence, cooling_confidence=excluded.cooling_confidence,
  case_standard_confidence=excluded.case_standard_confidence,
  ram_config_confidence=excluded.ram_config_confidence,
  price_cents=excluded.price_cents, regular_price_cents=excluded.regular_price_cents,
  currency=excluded.currency, available=excluded.available,
  canonical_url=excluded.canonical_url, image_url=excluded.image_url,
  image_source=excluded.image_source, image_attribution=excluded.image_attribution,
  fetched_at=excluded.fetched_at, expires_at=excluded.expires_at,
  updated_at=excluded.updated_at
`;

const UPSERT_SNAPSHOT = `
INSERT INTO raw_snapshots (
  id, listing_id, retailer, retailer_sku, payload_json, payload_hash,
  source_url, normalization_version, fetched_at, expires_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(retailer, retailer_sku, payload_hash) DO UPDATE SET
  payload_json=excluded.payload_json, source_url=excluded.source_url,
  normalization_version=excluded.normalization_version,
  fetched_at=excluded.fetched_at, expires_at=excluded.expires_at
`;

function cents(value?: number) {
  return value === undefined ? null : Math.round(value * 100);
}

async function payloadHash(payloadJson: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payloadJson));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export async function persistBestBuyBatch(
  db: D1Database,
  batch: RetailerBatch<BestBuyProduct>,
) {
  const candidates = [];
  for (const product of batch.products) {
    const listing = normalizeBestBuyProduct(product, batch.fetchedAt);
    if (!isUsableBestBuyListing(listing)) continue;
    const payloadJson = JSON.stringify(product);
    candidates.push({
      listing,
      payloadJson,
      hash: await payloadHash(payloadJson),
    });
  }

  let changedCount = 0;
  const changeChecks = candidates.map(({ listing, hash }) => db.prepare(`
    SELECT 1 AS found
    FROM raw_snapshots
    WHERE retailer = ? AND retailer_sku = ? AND payload_hash = ?
    LIMIT 1
  `).bind(listing.retailer, listing.retailerSku, hash));
  for (const group of chunks(changeChecks, 50)) {
    const results = await db.batch(group);
    changedCount += results.filter((result) => !result.results?.length).length;
  }

  const statements: D1PreparedStatement[] = [];
  for (const { listing, payloadJson, hash } of candidates) {
    const fetchedAt = listing.fetchedAt.getTime();
    const expiresAt = listing.expiresAt.getTime();
    statements.push(db.prepare(UPSERT_LISTING).bind(
      listing.id, listing.retailer, listing.retailerSku, listing.name,
      listing.brand, listing.modelNumber, listing.category, listing.cpu, listing.gpu,
      listing.gpuVramGb, listing.quickSync ? 1 : 0, listing.ramGb, listing.ramConfig,
      listing.storageTb, listing.motherboard, listing.caseStandard, listing.psuWattage,
      listing.psuTier, listing.cooling, listing.upgradeabilityConfidence,
      listing.confidence.cpu, listing.confidence.gpu, listing.confidence.ram,
      listing.confidence.storage, listing.confidence.motherboard, listing.confidence.psu,
      listing.confidence.cooling, listing.confidence.caseStandard,
      listing.confidence.ramConfig, cents(listing.price), cents(listing.wasPrice),
      "USD", listing.available ? 1 : 0, listing.canonicalUrl, listing.imageUrl,
      listing.imageSource, listing.imageAttribution, fetchedAt, expiresAt, fetchedAt,
    ));
    statements.push(db.prepare(UPSERT_SNAPSHOT).bind(
      `${listing.id}:${hash.slice(0, 20)}`, listing.id, listing.retailer,
      listing.retailerSku, payloadJson, hash, listing.canonicalUrl,
      BEST_BUY_NORMALIZATION_VERSION, fetchedAt, expiresAt,
    ));
  }
  for (const group of chunks(statements, 50)) {
    await db.batch(group);
  }
  return changedCount;
}

export async function cleanupExpiredRetailerContent(db: D1Database, now = new Date()) {
  const expiresAt = now.getTime();
  await db.batch([
    db.prepare("DELETE FROM raw_snapshots WHERE expires_at <= ?").bind(expiresAt),
    db.prepare("DELETE FROM listings WHERE expires_at <= ?").bind(expiresAt),
  ]);
}
