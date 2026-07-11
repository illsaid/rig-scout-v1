import type { PcListing } from "./catalog";

export type SearchCriteria = {
  cpu: string;
  gpu: string;
  ramGb: number;
  storageTb: number;
  motherboard: string;
  maxPrice: number;
  includeUnclear: boolean;
};

export type RankedListing = {
  listing: PcListing;
  score: number;
  reasons: string[];
  differences: string[];
};

export function rankListings(listings: PcListing[], criteria: SearchCriteria): RankedListing[] {
  return listings
    .filter((listing) => listing.price <= criteria.maxPrice)
    .filter((listing) => criteria.includeUnclear || listing.confidence.motherboard >= .8)
    .map((listing) => scoreListing(listing, criteria))
    .sort((a, b) => b.score - a.score || a.listing.price - b.listing.price);
}

function scoreListing(listing: PcListing, criteria: SearchCriteria): RankedListing {
  let points = 100;
  const reasons: string[] = [];
  const differences: string[] = [];

  if (criteria.cpu !== "Any" && listing.cpu !== criteria.cpu) {
    points -= 15;
    differences.push(`CPU is ${listing.cpu}, not ${criteria.cpu}`);
  }
  if (criteria.gpu !== "Any" && listing.gpu !== criteria.gpu) {
    points -= 25;
    differences.push(`GPU is ${listing.gpu}, not ${criteria.gpu}`);
  }
  if (listing.ramGb < criteria.ramGb) {
    points -= 10;
    differences.push(`${listing.ramGb} GB memory is below your ${criteria.ramGb} GB minimum`);
  }
  if (listing.storageTb < criteria.storageTb) {
    points -= 8;
    differences.push(`${listing.storageTb} TB storage is below your ${criteria.storageTb} TB minimum`);
  }
  if (criteria.motherboard !== "Any" && listing.motherboard !== criteria.motherboard) {
    points -= listing.motherboard ? 10 : 6;
    differences.push(listing.motherboard ? `Chipset is ${listing.motherboard}, not ${criteria.motherboard}` : "Motherboard chipset is not published");
  }
  if (listing.confidence.motherboard < .8) {
    points -= 3;
    differences.push("exact motherboard details are unclear");
  }

  if (!differences.length) reasons.push("Every requested specification matches");
  else if (listing.gpu === criteria.gpu) reasons.push("The most important GPU requirement matches");
  else reasons.push("The price is within budget with some component tradeoffs");

  return { listing, score: Math.max(50, points), reasons, differences };
}
