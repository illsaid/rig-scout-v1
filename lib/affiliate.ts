const knownTrackingKeys = new Set([
  "tag",
  "affid",
  "affiliate",
  "affiliate_id",
  "ascsubtag",
  "irclickid",
]);

export function affiliateUrl(canonicalUrl: string, retailer: string): string {
  const url = new URL(canonicalUrl);

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      knownTrackingKeys.has(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.set("utm_source", "prebuilts.co");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set(
    "utm_campaign",
    retailer.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  );

  return url.toString();
}
