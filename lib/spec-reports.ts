import { databaseBinding } from "./database-binding.ts";
import {
  isSpecReportField,
  type SpecReportField,
} from "./spec-report-fields.ts";

const MAX_REPORTS_PER_LISTING_PER_HOUR = 20;

export type ValidSpecReport = {
  listingId: string;
  field: SpecReportField;
  suggestedValue: string | null;
  details: string | null;
};

export type StoredSpecReport = ValidSpecReport & {
  retailer: string;
  listingName: string;
  displayedValue: string | null;
};

type ValidationResult =
  | { ok: true; report: ValidSpecReport }
  | { ok: false; error: string };

type PersistResult =
  | { status: "stored"; id: string }
  | { status: "rate-limited" };

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length > maxLength) return undefined;
  return normalized || null;
}

export function validateSpecReportPayload(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid report." };
  }

  const input = value as Record<string, unknown>;
  const listingId = optionalText(input.listingId, 128);
  const suggestedValue = optionalText(input.suggestedValue, 160);
  const details = optionalText(input.details, 600);

  if (!listingId) {
    return { ok: false, error: "A listing is required." };
  }
  if (!isSpecReportField(input.field)) {
    return { ok: false, error: "Choose the specification that looks wrong." };
  }
  if (suggestedValue === undefined || details === undefined) {
    return { ok: false, error: "The correction or note is too long." };
  }
  if (!suggestedValue && !details) {
    return { ok: false, error: "Add a correction or a short note." };
  }

  return {
    ok: true,
    report: {
      listingId,
      field: input.field,
      suggestedValue,
      details,
    },
  };
}

export async function persistSpecReport(
  db: D1Database,
  report: StoredSpecReport,
  now = Date.now(),
): Promise<PersistResult> {
  const recent = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM spec_reports
    WHERE listing_id = ? AND created_at >= ?
  `).bind(
    report.listingId,
    now - 60 * 60 * 1000,
  ).first<{ count: number }>();

  if ((recent?.count ?? 0) >= MAX_REPORTS_PER_LISTING_PER_HOUR) {
    return { status: "rate-limited" };
  }

  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO spec_reports (
      id, listing_id, retailer, listing_name, field, displayed_value,
      suggested_value, details, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    id,
    report.listingId,
    report.retailer,
    report.listingName,
    report.field,
    report.displayedValue,
    report.suggestedValue,
    report.details,
    now,
  ).run();

  return { status: "stored", id };
}

export async function recordSpecReport(report: StoredSpecReport) {
  try {
    const db = await databaseBinding();
    if (!db) return { status: "database-unavailable" } as const;
    return await persistSpecReport(db, report);
  } catch (error) {
    console.error("Unable to record specification report.", error);
    return { status: "storage-error" } as const;
  }
}
