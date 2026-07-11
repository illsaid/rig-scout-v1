import type { SearchCriteria, UseCase } from "./matching";

export const USE_CASES: readonly UseCase[] = [
  "Gaming",
  "Video Editing",
  "3D Rendering",
  "AI/ML",
  "General Use",
];

export const CPU_OPTIONS = [
  "Any",
  "Ryzen 9 9950X",
  "Ryzen 9 9900X",
  "Core Ultra 9 285K",
  "Core i9-14900KF",
] as const;

export const GPU_OPTIONS = [
  "Any",
  "RTX 5090",
  "RTX 5080",
  "RTX 5070 Ti",
  "RTX 5070",
  "Radeon RX 9070 XT",
] as const;

export const BOARD_OPTIONS = [
  "Any",
  "X870E",
  "X870",
  "B850",
  "Z890",
  "Z790",
] as const;

export const DEFAULT_CRITERIA: SearchCriteria = {
  useCase: "Video Editing",
  cpu: "Any",
  gpu: "RTX 5080",
  ramGb: 32,
  storageTb: 1,
  motherboard: "Any",
  maxPrice: 3500,
  includeUnclear: true,
  hideWeakMatches: true,
};

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export function criteriaFromSearchParams(
  params: SearchParamsRecord = {},
): SearchCriteria {
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  return {
    useCase: allowed(value("use"), USE_CASES, DEFAULT_CRITERIA.useCase),
    cpu: allowed(value("cpu"), CPU_OPTIONS, DEFAULT_CRITERIA.cpu),
    gpu: allowed(value("gpu"), GPU_OPTIONS, DEFAULT_CRITERIA.gpu),
    ramGb: positiveNumber(value("ram"), DEFAULT_CRITERIA.ramGb),
    storageTb: positiveNumber(
      value("storage"),
      DEFAULT_CRITERIA.storageTb,
    ),
    motherboard: allowed(
      value("board"),
      BOARD_OPTIONS,
      DEFAULT_CRITERIA.motherboard,
    ),
    maxPrice: positiveNumber(value("max"), DEFAULT_CRITERIA.maxPrice),
    includeUnclear: value("unclear") !== "0",
    hideWeakMatches: value("weak") !== "0",
  };
}

export function criteriaToParams(criteria: SearchCriteria): string {
  return new URLSearchParams({
    use: criteria.useCase,
    cpu: criteria.cpu,
    gpu: criteria.gpu,
    ram: String(criteria.ramGb),
    storage: String(criteria.storageTb),
    board: criteria.motherboard,
    max: String(criteria.maxPrice),
    unclear: criteria.includeUnclear ? "1" : "0",
    weak: criteria.hideWeakMatches ? "1" : "0",
  }).toString();
}

function allowed<T extends string>(
  value: string | undefined,
  options: readonly T[],
  fallback: T,
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function positiveNumber(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
