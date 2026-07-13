import assert from "node:assert/strict";
import test from "node:test";

async function request(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "text/html");

  return worker.fetch(
    new Request(`http://localhost${path}`, { ...init, headers }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Prebuilts.co product experience", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prebuilts\.co/);
  assert.match(html, /Primary use/);
  assert.match(html, /Exact Matches/);
  assert.match(html, /Include listings with unclear secondary specs/);
  assert.match(html, /Hide matches below 60%/);
  assert.match(html, /Report incorrect specs/);
  assert.doesNotMatch(
    html,
    /codex-preview|Your site is taking shape|react-loading-skeleton/i,
  );
});

test("server-renders validated shared brief parameters", async () => {
  const validResponse = await request(
    "/?use=Gaming&cpu=Core%20Ultra%209%20285K&gpu=Any&board=Z890",
  );
  const validHtml = await validResponse.text();

  assert.match(validHtml, /<meta name="robots" content="noindex, follow"/);
  assert.match(validHtml, /<link rel="canonical" href="https:\/\/prebuilts\.co\/"/);
  assert.match(validHtml, /<option selected="">Gaming<\/option>/);
  assert.match(
    validHtml,
    /<option selected="">Core Ultra 9 285K<\/option>/,
  );
  assert.match(validHtml, /MATCHED FOR[\s\S]{0,40}GAMING/);

  const invalidResponse = await request(
    "/?cpu=not-a-cpu&gpu=not-a-gpu&board=not-a-board",
  );
  const invalidHtml = await invalidResponse.text();

  assert.match(invalidHtml, /<option selected="">Any<\/option>/);
  assert.match(invalidHtml, /<option selected="">RTX 5080<\/option>/);
});

test("publishes a constrained robots file and core-page sitemap", async () => {
  const robotsResponse = await request("/robots.txt");
  const robots = await robotsResponse.text();
  assert.equal(robotsResponse.status, 200);
  assert.match(robots, /Disallow: \/go\//);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap: https:\/\/prebuilts\.co\/sitemap\.xml/);

  const sitemapResponse = await request("/sitemap.xml");
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemap, /<loc>https:\/\/prebuilts\.co<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>[^<]*\?/);
});

test("exposes non-indexable ingestion health without requiring the retailer key", async () => {
  const response = await request("/api/health/ingestion");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.deepEqual(await response.json(), { status: "database-unavailable" });
});

test("validates incorrect-spec report submissions", async () => {
  const invalidResponse = await request("/api/reports/specs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ listingId: "demo-002", field: "gpu" }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidResponse.headers.get("x-robots-tag"), "noindex, nofollow");

  const unavailableResponse = await request("/api/reports/specs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      listingId: "demo-002",
      field: "gpu",
      suggestedValue: "RTX 5070 Ti",
    }),
  });
  assert.equal(unavailableResponse.status, 503);
  assert.deepEqual(await unavailableResponse.json(), {
    error: "Reporting is temporarily unavailable.",
  });
});

test("returns 404 for an unknown outbound listing", async () => {
  const response = await request("/go/not-a-listing");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Listing not found" });
});

test("redirects known listings even when click storage is unavailable", async () => {
  const response = await request("/go/demo-002");
  assert.equal(response.status, 307);
  const destination = new URL(response.headers.get("location"));
  assert.equal(destination.searchParams.get("utm_source"), "prebuilts.co");
  assert.equal(destination.searchParams.get("utm_campaign"), "best-buy");
});
