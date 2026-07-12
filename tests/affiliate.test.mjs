import assert from "node:assert/strict";
import test from "node:test";
import { affiliateUrl } from "../lib/affiliate.ts";

test("preserves product parameters while replacing tracking parameters", () => {
  const result = new URL(
    affiliateUrl(
      "https://retailer.example/pc?sku=123&color=black&utm_source=old&tag=old",
      "Best Buy",
    ),
  );

  assert.equal(result.searchParams.get("sku"), "123");
  assert.equal(result.searchParams.get("color"), "black");
  assert.equal(result.searchParams.get("tag"), null);
  assert.equal(result.searchParams.get("utm_source"), "prebuilts.co");
  assert.equal(result.searchParams.get("utm_medium"), "affiliate");
  assert.equal(result.searchParams.get("utm_campaign"), "best-buy");
});

test("applies a configured merchant transformer after removing stale tracking", () => {
  const result = new URL(
    affiliateUrl(
      "https://www.amazon.com/dp/example?tag=old-tag&th=1",
      "Amazon",
      { amazonAssociatesTag: "prebuilts-20" },
    ),
  );

  assert.equal(result.searchParams.get("tag"), "prebuilts-20");
  assert.equal(result.searchParams.get("th"), "1");
});
