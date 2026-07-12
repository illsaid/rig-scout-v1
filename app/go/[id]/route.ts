import { NextResponse } from "next/server";
import { affiliateUrl } from "@/lib/affiliate";
import { getListingById } from "@/lib/catalog-source";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const listing = await getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.redirect(
    affiliateUrl(listing.canonicalUrl, listing.retailer),
  );
}
