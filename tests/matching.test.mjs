import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../lib/catalog.ts";
import { rankListings } from "../lib/matching.ts";

const base = {
  useCase: "Video Editing",
  cpu: "Ryzen 9 9950X",
  gpu: "RTX 5080",
  ramGb: 32,
  storageTb: 1,
  motherboard: "Any",
  maxPrice: 3500,
  includeUnclear: true,
  hideWeakMatches: true,
};

test("groups an exact specification match", () => {
  const result = rankListings(catalog, base).find((item) => item.listing.id === "demo-001");
  assert.equal(result?.tier, "exact");
  assert.equal(result?.score, 100);
});

test("surfaces Quick Sync as a workload-aware alternative", () => {
  const result = rankListings(catalog, base).find((item) => item.listing.id === "demo-004");
  assert.equal(result?.tier, "worth");
  assert.match(result?.overrideBadge ?? "", /Quick Sync/);
});

test("rewards higher VRAM for AI workloads", () => {
  const results = rankListings(catalog, { ...base, useCase: "AI/ML" });
  const result = results.find((item) => item.listing.id === "demo-006");
  assert.equal(result?.tier, "worth");
  assert.match(result?.overrideBadge ?? "", /VRAM/);
});

test("filters low-confidence upgradeability when unclear specs are disabled", () => {
  const results = rankListings(catalog, { ...base, includeUnclear: false });
  assert.equal(results.some((item) => item.listing.id === "demo-003"), false);
});
