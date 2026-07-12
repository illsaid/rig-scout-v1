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
  snapshotHashes = new Set();

  prepare(sql) {
    const statement = new FakeStatement(sql);
    this.prepared.push(statement);
    return statement;
  }

  async batch(statements) {
    this.batches.push(statements);
    return statements.map((statement) => {
      if (/SELECT 1 AS found/.test(statement.sql)) {
        return {
          success: true,
          results: this.snapshotHashes.has(statement.values[2]) ? [{ found: 1 }] : [],
        };
      }
      if (/INSERT INTO raw_snapshots/.test(statement.sql)) {
        this.snapshotHashes.add(statement.values[5]);
      }
      return { success: true, results: [] };
    });
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
  assert.equal(db.prepared.length, 3);
  assert.equal(db.batches.length, 2);
  assert.equal(db.batches[1].length, 2);

  const unchangedCount = await persistBestBuyBatch(db, {
    retailer: "Best Buy",
    fetchedAt: new Date("2026-07-12T12:00:00.000Z"),
    products: [fixture],
  });
  assert.equal(unchangedCount, 0);
});

test("skips unpriced products and products with no identifiable CPU or GPU", async () => {
  const db = new FakeDatabase();
  const count = await persistBestBuyBatch(db, {
    retailer: "Best Buy",
    fetchedAt: new Date("2026-07-11T12:00:00.000Z"),
    products: [
      { sku: "no-price", name: "Ryzen 9 9950X RTX 5080 PC", url: "https://example.com/no-price" },
      { sku: "no-core", name: "Mystery desktop", salePrice: 999, url: "https://example.com/no-core" },
    ],
  });
  assert.equal(count, 0);
  assert.equal(db.prepared.length, 0);
  assert.equal(db.batches.length, 0);
});

test("cleans both expired snapshots and listings", async () => {
  const db = new FakeDatabase();
  await cleanupExpiredRetailerContent(db, new Date("2026-07-14T12:00:00.000Z"));
  assert.equal(db.prepared.length, 2);
  assert.equal(db.batches[0].length, 2);
  assert.match(db.prepared[0].sql, /DELETE FROM raw_snapshots/);
  assert.match(db.prepared[1].sql, /DELETE FROM listings/);
});
