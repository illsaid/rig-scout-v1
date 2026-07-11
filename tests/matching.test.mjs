import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../lib/catalog.ts";
import {
  getGpuPerformanceTier,
  rankListings,
  scoreListing,
} from "../lib/matching.ts";

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
  const result = rankListings(catalog, base).find(
    (item) => item.listing.id === "demo-001",
  );
  assert.equal(result?.tier, "exact");
  assert.equal(result?.score, 100);
});

test("surfaces Quick Sync as a workload-aware alternative", () => {
  const result = rankListings(catalog, base).find(
    (item) => item.listing.id === "demo-004",
  );
  assert.equal(result?.tier, "worth");
  assert.match(result?.overrideBadge ?? "", /Quick Sync/);
});

test("Gaming with Any GPU does not turn every result into an override", () => {
  const results = rankListings(catalog, {
    ...base,
    useCase: "Gaming",
    cpu: "Any",
    gpu: "Any",
  });

  assert.ok(results.some((result) => result.tier === "exact"));
  assert.equal(results.some((result) => result.tier === "worth"), false);
  assert.equal(results.some((result) => result.overrideBadge), false);
});

test("higher gaming GPU is not double-rewarded to a 100% match", () => {
  const listing = catalog.find((item) => item.id === "demo-006");
  assert.ok(listing);
  const result = scoreListing(listing, {
    ...base,
    useCase: "Gaming",
    cpu: "Any",
  });

  assert.equal(result.tier, "worth");
  assert.equal(result.score, 96);
  assert.match(result.overrideBadge ?? "", /Higher GPU/);
});

test("explains the AI compatibility penalty for non-NVIDIA GPUs", () => {
  const listing = {
    ...catalog[0],
    id: "radeon-test",
    gpu: "Radeon RX 9070 XT",
  };
  const result = scoreListing(listing, {
    ...base,
    useCase: "AI/ML",
    gpu: "Any",
  });

  assert.equal(result.score, 96);
  assert.ok(
    result.differences.some(
      (difference) => difference.code === "ai-ecosystem" && !difference.hard,
    ),
  );
});

test("uses structured hard flags rather than parsing prose", () => {
  const result = scoreListing(catalog[2], {
    ...base,
    motherboard: "Z890",
  });
  const boardDifference = result.differences.find(
    (difference) => difference.code === "motherboard-chipset",
  );

  assert.equal(boardDifference?.hard, true);
  assert.equal(boardDifference?.uncertain, true);
  assert.equal(result.tier, "close");
});

test("unclear toggle considers motherboard and upgradeability fields", () => {
  const results = rankListings(catalog, { ...base, includeUnclear: false });
  assert.equal(results.some((item) => item.listing.id === "demo-002"), false);
  assert.equal(results.some((item) => item.listing.id === "demo-003"), false);
});

test("future GPU names receive a parsed tier instead of defaulting to zero", () => {
  assert.ok((getGpuPerformanceTier("RTX 6080") ?? 0) > 4);
  assert.equal(getGpuPerformanceTier("Quantum GPU X1"), undefined);
});
