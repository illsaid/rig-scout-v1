import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { BEST_BUY_NORMALIZATION_VERSION, normalizeBestBuyProduct } from "../lib/ingestion/best-buy.ts";
import { RETAILER_CONTENT_TTL_MS, isFresh } from "../lib/ingestion/types.ts";

const fixture = JSON.parse(await readFile(
  new URL("./fixtures/best-buy-gaming-desktop.synthetic.json", import.meta.url),
  "utf8",
));

test("normalizes a structured Best Buy gaming desktop", () => {
  const fetchedAt = new Date("2026-07-11T12:00:00.000Z");
  const listing = normalizeBestBuyProduct(fixture, fetchedAt);
  assert.equal(BEST_BUY_NORMALIZATION_VERSION, "best-buy-code-v1");
  assert.equal(listing.id, "best-buy:1000001");
  assert.equal(listing.cpu, "Ryzen 9 9950X");
  assert.equal(listing.gpu, "RTX 5080");
  assert.equal(listing.gpuVramGb, 16);
  assert.equal(listing.ramGb, 64);
  assert.equal(listing.ramConfig, "Dual-channel");
  assert.equal(listing.storageTb, 2);
  assert.equal(listing.motherboard, "X870E");
  assert.equal(listing.psuWattage, 1000);
  assert.equal(listing.psuTier, "Name-brand Gold");
  assert.equal(listing.cooling, "Liquid");
  assert.equal(listing.caseStandard, "ATX");
  assert.equal(listing.price, 2999.99);
  assert.equal(listing.wasPrice, 3299.99);
  assert.equal(listing.imageAttribution, "Best Buy");
  assert.equal(listing.confidence.cpu, 0.98);
  assert.equal(listing.expiresAt.getTime() - listing.fetchedAt.getTime(), RETAILER_CONTENT_TTL_MS);
});

test("expires retailer content after 72 hours", () => {
  const fetchedAt = new Date("2026-07-11T12:00:00.000Z");
  const listing = normalizeBestBuyProduct(fixture, fetchedAt);
  assert.equal(isFresh(listing.expiresAt, new Date("2026-07-14T11:59:59.999Z")), true);
  assert.equal(isFresh(listing.expiresAt, new Date("2026-07-14T12:00:00.000Z")), false);
});

test("uses honest low confidence for missing secondary specifications", () => {
  const listing = normalizeBestBuyProduct({
    sku: "sparse-1",
    name: "Example Desktop with Ryzen 9 9950X and RTX 5080",
    salePrice: 2499,
    onlineAvailability: true,
    url: "https://www.bestbuy.com/site/example/sparse-1.p",
  });
  assert.equal(listing.cpu, "Ryzen 9 9950X");
  assert.equal(listing.gpu, "RTX 5080");
  assert.equal(listing.motherboard, null);
  assert.equal(listing.caseStandard, "Unknown");
  assert.equal(listing.confidence.cpu, 0.72);
  assert.equal(listing.confidence.motherboard, 0.2);
  assert.ok(listing.upgradeabilityConfidence < 0.5);
});
