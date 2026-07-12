import assert from "node:assert/strict";
import test from "node:test";

async function request(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
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

test("returns 404 for an unknown outbound listing", async () => {
  const response = await request("/go/not-a-listing");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Listing not found" });
});
