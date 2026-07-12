const knownTrackingKeys = new Set([
  "tag",
  "affid",
  "affiliate",
  "affiliate_id",
  "ascsubtag",
  "irclickid",
]);

export type AffiliateIdentifiers = {
  amazonAssociatesTag?: string;
};

type MerchantTransformer = (
  url: URL,
  identifiers: AffiliateIdentifiers,
) => void;

const merchantTransformers: Record<string, MerchantTransformer> = {
  amazon(url, identifiers) {
    if (identifiers.amazonAssociatesTag) {
      url.searchParams.set("tag", identifiers.amazonAssociatesTag);
    }
  },
};

export function affiliateUrl(
  canonicalUrl: string,
  retailer: string,
  identifiers: AffiliateIdentifiers = {},
): string {
  const url = new URL(canonicalUrl);

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      knownTrackingKeys.has(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  merchantTransformers[retailer.toLowerCase()]?.(url, identifiers);

  url.searchParams.set("utm_source", "prebuilts.co");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set(
    "utm_campaign",
    retailer.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  );

  return url.toString();
}

export async function runtimeAffiliateIdentifiers(): Promise<AffiliateIdentifiers> {
  try {
    const runtime = await import("cloudflare:workers");
    return {
      amazonAssociatesTag: runtime.env.AMAZON_ASSOCIATES_TAG,
    };
  } catch {
    return {};
  }
}
