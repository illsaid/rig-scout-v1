import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the RigScout product experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>RigScout/);
  assert.match(html, /Pick the parts/);
  assert.match(html, /Primary use/);
  assert.match(html, /Exact Matches/);
  assert.match(html, /Worth Considering/);
  assert.match(html, /View at/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps workload scoring and upgradeability visible in source", async () => {
  const [page, matching, catalog] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/matching.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Hide matches below 60%/);
  assert.match(page, /Share this brief/);
  assert.match(matching, /Quick Sync/);
  assert.match(matching, /More VRAM/);
  assert.match(catalog, /upgradeabilityConfidence/);
  assert.match(catalog, /caseStandard/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
