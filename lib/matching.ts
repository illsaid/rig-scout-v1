import type { PcListing } from "./catalog";

export type UseCase =
  | "Gaming"
  | "Video Editing"
  | "3D Rendering"
  | "AI/ML"
  | "General Use";

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

export type MatchDifference = {
  code: string;
  message: string;
  hard: boolean;
  uncertain?: boolean;
};

export type RankedListing = {
  listing: PcListing;
  score: number;
  tier: ResultTier;
  reasons: string[];
  differences: MatchDifference[];
  overrideBadge?: string;
  judgmentConfidence: JudgmentConfidence;
};

type GpuComparison = "equal" | "higher" | "lower" | "unknown";

const knownGpuTiers: Record<string, number> = {
  "RTX 5090": 5,
  "RTX 5080": 4,
  "RTX 5070 Ti": 3.25,
  "Radeon RX 9070 XT": 3.1,
  "RTX 5070": 3,
};

export function rankListings(
  listings: PcListing[],
  criteria: SearchCriteria,
): RankedListing[] {
  return listings
    .filter((listing) => listing.price <= criteria.maxPrice)
    .filter(
      (listing) => criteria.includeUnclear || !hasUnclearSecondarySpecs(listing),
    )
    .map((listing) => scoreListing(listing, criteria))
    .filter((result) => !criteria.hideWeakMatches || result.score >= 60)
    .sort((a, b) => b.score - a.score || a.listing.price - b.listing.price);
}

export function scoreListing(
  listing: PcListing,
  criteria: SearchCriteria,
): RankedListing {
  let points = 100;
  const reasons: string[] = [];
  const differences: MatchDifference[] = [];
  let gpuComparison: GpuComparison = "equal";

  if (criteria.cpu !== "Any" && listing.cpu !== criteria.cpu) {
    points -= 14;
    differences.push({
      code: "cpu-model",
      message: `CPU is ${listing.cpu}, not ${criteria.cpu}`,
      hard: true,
    });
  }

  if (criteria.gpu !== "Any" && listing.gpu !== criteria.gpu) {
    gpuComparison = compareGpu(listing.gpu, criteria.gpu);

    if (gpuComparison === "higher") {
      points -= 4;
      differences.push({
        code: "gpu-upgrade",
        message: `GPU is the higher-tier ${listing.gpu}, not the requested ${criteria.gpu}`,
        hard: true,
      });
    } else if (gpuComparison === "lower") {
      points -= 24;
      differences.push({
        code: "gpu-model",
        message: `GPU is ${listing.gpu}, not ${criteria.gpu}`,
        hard: true,
      });
    } else {
      points -= 12;
      differences.push({
        code: "gpu-unclassified",
        message: `GPU is ${listing.gpu}; its tier relative to ${criteria.gpu} is not classified yet`,
        hard: true,
        uncertain: true,
      });
    }
  }

  if (listing.ramGb < criteria.ramGb) {
    points -= 10;
    differences.push({
      code: "ram-capacity",
      message: `${listing.ramGb} GB memory is below your ${criteria.ramGb} GB minimum`,
      hard: true,
    });
  }

  if (listing.storageTb < criteria.storageTb) {
    points -= 8;
    differences.push({
      code: "storage-capacity",
      message: `${listing.storageTb} TB storage is below your ${criteria.storageTb} TB minimum`,
      hard: true,
    });
  }

  if (
    criteria.motherboard !== "Any" &&
    listing.motherboard !== criteria.motherboard
  ) {
    points -= listing.motherboard ? 10 : 6;
    differences.push({
      code: "motherboard-chipset",
      message: listing.motherboard
        ? `Chipset is ${listing.motherboard}, not ${criteria.motherboard}`
        : "Motherboard chipset is not published",
      hard: true,
      uncertain: !listing.motherboard,
    });
  }

  if (hasUnclearSecondarySpecs(listing)) {
    points -= 3;
    differences.push({
      code: "secondary-spec-confidence",
      message: "Some motherboard or upgradeability details are unclear",
      hard: false,
      uncertain: true,
    });
  }

  const workload = workloadAdjustment(listing, criteria, gpuComparison);
  points += workload.scoreDelta;

  if (workload.reason) {
    reasons.push(workload.reason);
  }
  if (workload.difference) {
    differences.push(workload.difference);
  }

  if (!differences.some((difference) => difference.hard)) {
    reasons.push("Every requested specification is satisfied");
  } else if (criteria.gpu !== "Any" && listing.gpu === criteria.gpu) {
    reasons.push("The requested GPU matches");
  } else {
    reasons.push("The price is within budget with documented tradeoffs");
  }

  const score = Math.max(0, Math.min(100, Math.round(points)));
  const hardRequirementsMet = differences.every(
    (difference) => !difference.hard,
  );
  const tier: ResultTier =
    workload.overrideBadge && !hardRequirementsMet
      ? "worth"
      : hardRequirementsMet
        ? "exact"
        : "close";

  return {
    listing,
    score,
    tier,
    reasons,
    differences,
    overrideBadge:
      tier === "worth" ? workload.overrideBadge : undefined,
    judgmentConfidence: confidenceFor(listing),
  };
}

export function hasUnclearSecondarySpecs(listing: PcListing): boolean {
  const secondaryConfidence = [
    listing.confidence.motherboard,
    listing.confidence.psu,
    listing.confidence.cooling,
    listing.confidence.caseStandard,
    listing.confidence.ramConfig,
    listing.upgradeabilityConfidence,
  ];

  return (
    secondaryConfidence.some((value) => value < .7) ||
    !listing.motherboard ||
    listing.caseStandard === "Unknown" ||
    listing.psuTier === "Unknown" ||
    listing.ramConfig === "Unknown" ||
    listing.cooling === "Unknown"
  );
}

export function getGpuPerformanceTier(model: string): number | undefined {
  if (knownGpuTiers[model] !== undefined) {
    return knownGpuTiers[model];
  }

  const rtx = model.match(/\bRTX\s*(\d{2})(\d{2})(?:\s*(Ti|Super))?/i);
  if (rtx) {
    const generation = Number(rtx[1]);
    const productClass = Number(rtx[2]);
    const classScore = gpuClassScore(productClass);
    if (classScore === undefined) return undefined;
    return classScore + (generation - 50) * .1 + (rtx[3] ? .2 : 0);
  }

  const radeon = model.match(/\bRX\s*(\d{2})(\d{2})(?:\s*(XT|XTX))?/i);
  if (radeon) {
    const generation = Number(radeon[1]);
    const productClass = Number(radeon[2]);
    const classScore = gpuClassScore(productClass);
    if (classScore === undefined) return undefined;
    return classScore + (generation - 90) * .05 + (radeon[3] ? .15 : 0);
  }

  return undefined;
}

function compareGpu(candidate: string, requested: string): GpuComparison {
  if (candidate === requested) return "equal";

  const candidateTier = getGpuPerformanceTier(candidate);
  const requestedTier = getGpuPerformanceTier(requested);
  if (candidateTier === undefined || requestedTier === undefined) return "unknown";
  return candidateTier > requestedTier ? "higher" : "lower";
}

function gpuClassScore(productClass: number): number | undefined {
  if (productClass >= 90) return 5;
  if (productClass >= 80) return 4;
  if (productClass >= 70) return 3;
  if (productClass >= 60) return 2;
  if (productClass >= 50) return 1;
  return undefined;
}

function workloadAdjustment(
  listing: PcListing,
  criteria: SearchCriteria,
  gpuComparison: GpuComparison,
): {
  scoreDelta: number;
  reason?: string;
  overrideBadge?: string;
  difference?: MatchDifference;
} {
  switch (criteria.useCase) {
    case "Video Editing":
      if (listing.quickSync) {
        return {
          scoreDelta: 0,
          reason: "Quick Sync strengthens Premiere and media workflows",
          overrideBadge:
            criteria.cpu !== "Any" && criteria.cpu !== listing.cpu
              ? "Better for Premiere - Intel Quick Sync"
              : undefined,
        };
      }
      return {
        scoreDelta: 0,
        reason:
          listing.ramGb >= 64
            ? "64 GB memory suits heavier editing timelines"
            : undefined,
      };

    case "Gaming":
      if (criteria.gpu === "Any") {
        return {
          scoreDelta: 0,
          reason: "GPU preference is open, so requested specifications drive the match",
        };
      }
      if (gpuComparison === "higher") {
        return {
          scoreDelta: 0,
          reason: "The stronger GPU materially improves gaming performance",
          overrideBadge: "Higher GPU tier for gaming",
        };
      }
      return {
        scoreDelta: 0,
        reason:
          getGpuPerformanceTier(listing.gpu) !== undefined &&
          (getGpuPerformanceTier(listing.gpu) ?? 0) >= 4
            ? "High-end GPU is the strongest gaming fit"
            : undefined,
      };

    case "3D Rendering":
      return {
        scoreDelta: 0,
        reason:
          (getGpuPerformanceTier(listing.gpu) ?? 0) >= 4 &&
          listing.ramGb >= 64
            ? "GPU tier and 64 GB memory support larger scenes"
            : undefined,
        overrideBadge:
          gpuComparison === "higher"
            ? "Higher GPU tier for rendering"
            : undefined,
      };

    case "AI/ML":
      if (listing.gpu.startsWith("RTX") && listing.gpuVramGb >= 24) {
        return {
          scoreDelta: 0,
          reason: `${listing.gpuVramGb} GB VRAM is the strongest local AI option`,
          overrideBadge:
            gpuComparison === "higher"
              ? "More VRAM - worth the upgrade for AI"
              : undefined,
        };
      }
      if (!listing.gpu.startsWith("RTX")) {
        return {
          scoreDelta: -4,
          difference: {
            code: "ai-ecosystem",
            message: "Non-NVIDIA GPU may require additional compatibility work for local AI tools",
            hard: false,
          },
        };
      }
      return {
        scoreDelta: 0,
        reason: "NVIDIA compatibility is a practical advantage for local AI",
      };

    case "General Use":
      return {
        scoreDelta: 0,
        reason:
          listing.price <= criteria.maxPrice * .75
            ? "Well below budget with balanced specifications"
            : undefined,
      };
  }
}

function confidenceFor(listing: PcListing): JudgmentConfidence {
  const values = Object.values(listing.confidence);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average >= .88) return "High";
  if (average >= .68) return "Medium";
  return "Low";
}
