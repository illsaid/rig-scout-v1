import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";
import { affiliateUrl } from "@/lib/affiliate";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listing = catalog.find((item) => item.id === id);
  if (!listing) return NextResponse.redirect(new URL("https://example.com"));
  return NextResponse.redirect(affiliateUrl(listing.canonicalUrl, listing.retailer));
}
