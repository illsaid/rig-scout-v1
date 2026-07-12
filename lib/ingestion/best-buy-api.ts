import { normalizeBestBuyProduct, type BestBuyProduct } from "./best-buy.ts";
import type { RetailerAdapter, RetailerBatch } from "./types.ts";

const PRODUCT_FIELDS = [
  "sku", "name", "manufacturer", "modelNumber", "type", "regularPrice",
  "salePrice", "onlineAvailability", "url", "image", "largeFrontImage",
  "shortDescription", "longDescription", "details",
].join(",");

type BestBuyProductsResponse = {
  currentPage: number;
  totalPages: number;
  products: BestBuyProduct[];
};

export class BestBuyProductsAdapter implements RetailerAdapter<BestBuyProduct> {
  readonly retailer = "Best Buy";
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;

  constructor(
    apiKey: string,
    fetchImpl: typeof fetch = fetch,
    now: () => Date = () => new Date(),
  ) {
    if (!apiKey) throw new Error("BEST_BUY_API_KEY is required");
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.now = now;
  }

  private requestUrl(page: number) {
    const url = new URL(
      'https://api.bestbuy.com/v1/products(categoryPath.name="Gaming Desktops"&active=true)',
    );
    url.searchParams.set("apiKey", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("show", PRODUCT_FIELDS);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("page", String(page));
    return url;
  }

  async fetch(): Promise<RetailerBatch<BestBuyProduct>> {
    const fetchedAt = this.now();
    const products: BestBuyProduct[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await this.fetchImpl(this.requestUrl(page), {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Best Buy Products API request failed with status ${response.status}`);
      }
      const payload = (await response.json()) as BestBuyProductsResponse;
      products.push(...(payload.products ?? []));
      totalPages = Math.min(Math.max(payload.totalPages ?? 1, 1), 50);
      page += 1;
    } while (page <= totalPages);
    return { retailer: this.retailer, fetchedAt, products };
  }

  normalize(product: BestBuyProduct, fetchedAt: Date) {
    return normalizeBestBuyProduct(product, fetchedAt);
  }
}
