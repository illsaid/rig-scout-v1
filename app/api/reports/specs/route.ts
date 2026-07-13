import { NextResponse } from "next/server";
import type { PcListing } from "@/lib/catalog";
import { getListingById } from "@/lib/catalog-source";
import type { SpecReportField } from "@/lib/spec-report-fields";
import {
  recordSpecReport,
  validateSpecReportPayload,
} from "@/lib/spec-reports";

const MAX_BODY_BYTES = 4_096;

function response(body: Record<string, unknown>, status: number) {
  const result = NextResponse.json(body, { status });
  result.headers.set("X-Robots-Tag", "noindex, nofollow");
  return result;
}

function displayedValue(listing: PcListing, field: SpecReportField) {
  const values: Record<SpecReportField, string | null> = {
    cpu: listing.cpu,
    gpu: listing.gpu,
    memory: `${listing.ramGb} GB`,
    storage: `${listing.storageTb} TB`,
    motherboard: listing.motherboard ?? "Unknown",
    case: listing.caseStandard,
    psu: listing.psuWattage
      ? `${listing.psuWattage} W / ${listing.psuTier}`
      : listing.psuTier,
    "ram-config": listing.ramConfig,
    cooling: listing.cooling,
    "price-availability": `$${listing.price.toLocaleString()} / listed`,
    other: null,
  };
  return values[field];
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return response({ error: "Send the report as JSON." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return response({ error: "The report is too large." }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return response({ error: "The report is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return response({ error: "Invalid report." }, 400);
  }

  if (
    body
    && typeof body === "object"
    && !Array.isArray(body)
    && typeof (body as Record<string, unknown>).website === "string"
    && (body as Record<string, unknown>).website
  ) {
    return response({ ok: true }, 202);
  }

  const validation = validateSpecReportPayload(body);
  if (!validation.ok) {
    return response({ error: validation.error }, 400);
  }

  const listing = await getListingById(validation.report.listingId);
  if (!listing) {
    return response({ error: "Listing not found." }, 404);
  }

  const result = await recordSpecReport({
    ...validation.report,
    retailer: listing.retailer,
    listingName: listing.name,
    displayedValue: displayedValue(listing, validation.report.field),
  });

  if (result.status === "rate-limited") {
    return response({ error: "This listing has received enough reports for now." }, 429);
  }
  if (result.status !== "stored") {
    return response({ error: "Reporting is temporarily unavailable." }, 503);
  }

  return response({ ok: true, id: result.id }, 201);
}
