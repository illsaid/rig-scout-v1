export function affiliateUrl(canonicalUrl: string, retailer: string): string {
  const url = new URL(canonicalUrl);
  url.search = "";
  url.searchParams.set("utm_source", "rigscout");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", retailer.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return url.toString();
}
