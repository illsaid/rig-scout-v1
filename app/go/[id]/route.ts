import { NextResponse } from "next/server";
import { affiliateUrl, runtimeAffiliateIdentifiers } from "@/lib/affiliate";
import { getListingById } from "@/lib/catalog-source";
import { recordOutboundClick } from "@/lib/clicks";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const listing = await getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const identifiers = await runtimeAffiliateIdentifiers();
  const destinationUrl = affiliateUrl(
    listing.canonicalUrl,
    listing.retailer,
    identifiers,
  );
  await recordOutboundClick({
    listingId: listing.id,
    retailer: listing.retailer,
    destinationUrl,
    referrer: request.headers.get("referer"),
  });

  return NextResponse.redirect(destinationUrl);
}
