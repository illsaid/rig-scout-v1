import assert from "node:assert/strict";
import test from "node:test";
import { BestBuyProductsAdapter } from "../lib/ingestion/best-buy-api.ts";

test("fetches every Best Buy page", async () => {
  const requests = [];
  const fetchImpl = async (input) => {
    const url = new URL(input);
    requests.push(url);
    const page = Number(url.searchParams.get("page"));
    return Response.json({
      currentPage: page,
      totalPages: 2,
      products: [{
        sku: page,
        name: `Synthetic PC ${page} with RTX 5080`,
        salePrice: 2000 + page,
        url: `https://www.bestbuy.com/site/synthetic/${page}.p`,
      }],
    });
  };
  const fetchedAt = new Date("2026-07-11T12:00:00.000Z");
  const adapter = new BestBuyProductsAdapter("secret-test-key", fetchImpl, () => fetchedAt);
  const batch = await adapter.fetch();
  assert.equal(batch.products.length, 2);
  assert.equal(batch.fetchedAt, fetchedAt);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].searchParams.get("apiKey"), "secret-test-key");
  assert.equal(requests[0].searchParams.get("pageSize"), "100");
  assert.match(decodeURIComponent(requests[0].pathname), /Gaming Desktops/);
});

test("does not expose the key in API errors", async () => {
  const adapter = new BestBuyProductsAdapter(
    "do-not-leak-me",
    async () => new Response("Rejected", { status: 403 }),
  );
  await assert.rejects(
    adapter.fetch(),
    (error) => error.message === "Best Buy Products API request failed with status 403"
      && !error.message.includes("do-not-leak-me"),
  );
});
