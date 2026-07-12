import type { PcListing } from "../catalog";

export const RETAILER_CONTENT_TTL_MS = 72 * 60 * 60 * 1000;

export type NormalizedRetailerListing = PcListing & {
  retailerSku: string;
  brand: string | null;
  modelNumber: string | null;
  category: string | null;
  available: boolean;
  imageUrl: string | null;
  imageSource: string | null;
  imageAttribution: string | null;
  fetchedAt: Date;
  expiresAt: Date;
};

export type RetailerBatch<TSource> = {
  retailer: string;
  fetchedAt: Date;
  products: TSource[];
};

export interface RetailerAdapter<TSource> {
  readonly retailer: string;
  fetch(): Promise<RetailerBatch<TSource>>;
  normalize(product: TSource, fetchedAt: Date): NormalizedRetailerListing;
}

export function expiresAtFor(fetchedAt: Date) {
  return new Date(fetchedAt.getTime() + RETAILER_CONTENT_TTL_MS);
}

export function isFresh(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime();
}
