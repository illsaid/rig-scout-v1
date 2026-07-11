import type { PcListing } from "./catalog";

export type UseCase = "Gaming" | "Video Editing" | "3D Rendering" | "AI/ML" | "General Use";
export type ResultTier = "exact" | "close" | "worth";
export type JudgmentConfidence = "High" | "Medium" | "Low";

export type SearchCriteria = {
  useCase: UseCase;
  cpu: string;
  gpu: string;
  ramGb: number;
  storageTb: number;
  motherboard: string;
  maxPrice: number;
  includeUnclear: boolean;
  hideWeakMatches: boolean;
};

export type RankedListing = {
  listing: PcListing;
  score: number;
  tier: ResultTier;
  reasons: string[];
  differences: string[];
  overrideBadge?: string;
  judgmentConfidence: JudgmentConfidence;
};

const gpuTier: Record<string, number> = {
  "RTX 5090": 5,
  "RTX 5080": 4,
  "RTX 5070 Ti": 3,
  "Radeon RX 9070 XT": 3,
  "RTX 5070": 2,
};

export function rankListings(listings: PcListing[], criteria: SearchCriteria): RankedListing[] {
  return listings
    .filter((listing) => listing.price <= criteria.maxPrice)
    .filter((listing) => criteria.includeUnclear || listing.upgradeabilityConfidence >= .7)
    .map((listing) => scoreListing(listing, criteria))
    .filter((result) => !criteria.hideWeakMatches || result.score >= 60)
    .sort((a, b) => b.score - a.score || a.listing.price - b.listing.price);
}

export function scoreListing(listing: PcListing, criteria: SearchCriteria): RankedListing {
  let points = 100;
  const reasons: string[] = [];
  const differences: string[] = [];
  let overrideBadge: string | undefined;

  if (criteria.cpu !== "Any" && listing.cpu !== criteria.cpu) {
    points -= 14;
    differences.push(`CPU is ${listing.cpu}, not ${criteria.cpu}`);
  }

  if (criteria.gpu !== "Any" && listing.gpu !== criteria.gpu) {
    const requestedTier = gpuTier[criteria.gpu] ?? 0;
    const listingTier = gpuTier[listing.gpu] ?? 0;
    if (listingTier > requestedTier) {
      points += 3;
      overrideBadge = "Better GPU than requested - worth the upgrade";
    } else {
      points -= 24;
      differences.push(`GPU is ${listing.gpu}, not ${criteria.gpu}`);
    }
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

  const workload = workloadAdjustment(listing, criteria);
  points += workload.points;
  if (workload.reason) reasons.push(workload.reason);
  if (workload.overrideBadge) overrideBadge = workload.overrideBadge;

  if (!differences.length) reasons.push("Every requested specification matches");
  else if (listing.gpu === criteria.gpu) reasons.push("The requested GPU matches");
  else reasons.push("The price is within budget with component tradeoffs");

  const score = Math.max(0, Math.min(100, Math.round(points)));
  const hardRequirementsMet = !differences.some((difference) => !difference.includes("unclear"));
  const tier: ResultTier = overrideBadge ? "worth" : hardRequirementsMet && score >= 95 ? "exact" : "close";

  return {
    listing,
    score,
    tier,
    reasons,
    differences,
    overrideBadge,
    judgmentConfidence: confidenceFor(listing),
  };
}

function workloadAdjustment(listing: PcListing, criteria: SearchCriteria): { points: number; reason?: string; overrideBadge?: string } {
  switch (criteria.useCase) {
    case "Video Editing":
      if (listing.quickSync) return { points: 8, reason: "Quick Sync strengthens Premiere and media workflows", overrideBadge: criteria.cpu !== listing.cpu ? "Better for Premiere - Intel Quick Sync" : undefined };
      return { points: listing.ramGb >= 64 ? 3 : 0, reason: listing.ramGb >= 64 ? "64 GB memory suits heavier editing timelines" : undefined };
    case "Gaming": {
      const requested = gpuTier[criteria.gpu] ?? 0;
      const actual = gpuTier[listing.gpu] ?? 0;
      if (actual > requested) return { points: 6, reason: "The stronger GPU materially improves gaming performance", overrideBadge: "Higher GPU tier for a small tradeoff" };
      return { points: actual >= 4 ? 3 : 0, reason: actual >= 4 ? "High-end GPU is the strongest gaming fit" : undefined };
    }
    case "3D Rendering":
      return { points: (gpuTier[listing.gpu] ?? 0) >= 4 && listing.ramGb >= 64 ? 6 : 1, reason: listing.ramGb >= 64 ? "GPU tier and 64 GB memory support larger scenes" : undefined };
    case "AI/ML":
      if (listing.gpu.startsWith("RTX") && listing.gpuVramGb >= 24) return { points: 8, reason: `${listing.gpuVramGb} GB VRAM is the strongest local AI option`, overrideBadge: "More VRAM - worth the upgrade for AI" };
      return { points: listing.gpu.startsWith("RTX") ? 3 : -4, reason: listing.gpu.startsWith("RTX") ? "NVIDIA compatibility is a practical advantage for local AI" : undefined };
    case "General Use":
      if (listing.price <= criteria.maxPrice * .75) return { points: 5, reason: "Well below budget with balanced specifications", overrideBadge: "Lower-cost balanced option" };
      return { points: 0 };
  }
}

function confidenceFor(listing: PcListing): JudgmentConfidence {
  const values = Object.values(listing.confidence);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average >= .88) return "High";
  if (average >= .68) return "Medium";
  return "Low";
}
