import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  cleanupExpiredRetailerContent,
  persistBestBuyBatch,
} from "../lib/ingestion/store.ts";

class FakeStatement {
  constructor(sql) {
    this.sql = sql;
  }

  bind(...values) {
    const placeholders = (this.sql.match(/\?/g) ?? []).length;
    assert.equal(values.length, placeholders, "SQL placeholder count must match bound values");
    this.values = values;
    return this;
  }
}

class FakeDatabase {
  prepared = [];
  batches = [];

  prepare(sql) {
    const statement = new FakeStatement(sql);
    this.prepared.push(statement);
    return statement;
  }

  async batch(statements) {
    this.batches.push(statements);
    return statements.map(() => ({ success: true }));
  }
}

const fixture = JSON.parse(await readFile(
  new URL("./fixtures/best-buy-gaming-desktop.synthetic.json", import.meta.url),
  "utf8",
));

test("binds complete listing and snapshot upserts", async () => {
  const db = new FakeDatabase();
  const count = await persistBestBuyBatch(db, {
    retailer: "Best Buy",
    fetchedAt: new Date("2026-07-11T12:00:00.000Z"),
    products: [fixture],
  });
  assert.equal(count, 1);
  assert.equal(db.prepared.length, 2);
  assert.equal(db.batches.length, 1);
  assert.equal(db.batches[0].length, 2);
});

test("cleans both expired snapshots and listings", async () => {
  const db = new FakeDatabase();
  await cleanupExpiredRetailerContent(db, new Date("2026-07-14T12:00:00.000Z"));
  assert.equal(db.prepared.length, 2);
  assert.equal(db.batches[0].length, 2);
  assert.match(db.prepared[0].sql, /DELETE FROM raw_snapshots/);
  assert.match(db.prepared[1].sql, /DELETE FROM listings/);
});
