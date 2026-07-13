import assert from "node:assert/strict";
import test from "node:test";

import {
  persistSpecReport,
  validateSpecReportPayload,
} from "../lib/spec-reports.ts";

class FakeStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    if (/COUNT\(\*\)/.test(this.sql)) {
      return { count: this.database.recentCount };
    }
    return null;
  }

  async run() {
    this.database.runs.push({ sql: this.sql, values: this.values });
    return { success: true };
  }
}

class FakeDatabase {
  recentCount = 0;
  runs = [];

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

const report = {
  listingId: "demo-002",
  field: "gpu",
  suggestedValue: "RTX 5070 Ti",
  details: "Retailer specifications disagree with the card.",
};

test("validates and trims a useful specification report", () => {
  assert.deepEqual(validateSpecReportPayload({
    ...report,
    suggestedValue: "  RTX 5070 Ti  ",
  }), {
    ok: true,
    report,
  });
});

test("rejects unknown fields, empty reports, and oversized notes", () => {
  assert.equal(validateSpecReportPayload({ ...report, field: "address" }).ok, false);
  assert.equal(validateSpecReportPayload({
    listingId: report.listingId,
    field: report.field,
    suggestedValue: " ",
    details: " ",
  }).ok, false);
  assert.equal(validateSpecReportPayload({
    ...report,
    details: "x".repeat(601),
  }).ok, false);
});

test("persists a pending report without personal identifiers", async () => {
  const db = new FakeDatabase();
  const result = await persistSpecReport(db, {
    ...report,
    retailer: "Best Buy",
    listingName: "CyberPowerPC Gamer Supreme",
    displayedValue: "RTX 5080",
  }, 1_783_968_000_000);

  assert.equal(result.status, "stored");
  assert.equal(db.runs.length, 1);
  assert.match(db.runs[0].sql, /INSERT INTO spec_reports/);
  assert.deepEqual(db.runs[0].values.slice(1), [
    "demo-002",
    "Best Buy",
    "CyberPowerPC Gamer Supreme",
    "gpu",
    "RTX 5080",
    "RTX 5070 Ti",
    "Retailer specifications disagree with the card.",
    1_783_968_000_000,
  ]);
  assert.doesNotMatch(db.runs[0].sql, /email|ip_address|user_agent/i);
});

test("limits bursts of reports for the same listing", async () => {
  const db = new FakeDatabase();
  db.recentCount = 20;
  const result = await persistSpecReport(db, {
    ...report,
    retailer: "Best Buy",
    listingName: "CyberPowerPC Gamer Supreme",
    displayedValue: "RTX 5080",
  });

  assert.deepEqual(result, { status: "rate-limited" });
  assert.equal(db.runs.length, 0);
});
