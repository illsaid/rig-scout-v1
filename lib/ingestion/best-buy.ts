import type { CaseStandard, ConfidenceMap, CoolingType, PsuTier, RamConfig } from "../catalog";
import { expiresAtFor, type NormalizedRetailerListing } from "./types.ts";

export const BEST_BUY_NORMALIZATION_VERSION = "best-buy-code-v1";

type BestBuyDetail = { name: string; value: string | number | boolean };
export type BestBuyProduct = {
  sku: number | string;
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  type?: string;
  regularPrice?: number;
  salePrice?: number;
  onlineAvailability?: boolean;
  url: string;
  image?: string;
  largeFrontImage?: string;
  shortDescription?: string;
  longDescription?: string;
  details?: BestBuyDetail[];
};

function detailReader(product: BestBuyProduct) {
  const details = new Map((product.details ?? []).map(({ name, value }) => [
    name.trim().toLowerCase(),
    String(value),
  ]));
  return (...names: string[]) => names
    .map((name) => details.get(name.toLowerCase()))
    .find(Boolean);
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function numberFrom(value?: string) {
  const match = value?.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function storageTbFrom(value?: string) {
  const amount = numberFrom(value);
  if (amount === null || !value) return null;
  return /(?:gb|gigabyte)/i.test(value) ? amount / 1000 : amount;
}

function fieldConfidence(found: unknown, structured: boolean) {
  return found === null || found === undefined ? 0.2 : structured ? 0.98 : 0.72;
}

export function normalizeBestBuyProduct(
  product: BestBuyProduct,
  fetchedAt = new Date(),
): NormalizedRetailerListing {
  const read = detailReader(product);
  const searchable = [product.name, product.shortDescription, product.longDescription]
    .filter(Boolean)
    .join(" ");
  const processorValue = read("Processor Model", "Processor Model Number", "Processor");
  const graphicsValue = read("Graphics", "Graphics Processing Unit/GPU", "GPU");
  const ramValue = read("System Memory (RAM)", "RAM", "Memory");
  const storageValue = read("Total Storage Capacity", "Storage Capacity", "Storage");
  const vramValue = read("GPU Video Memory (RAM)", "Video Memory", "Graphics Memory");
  const motherboardValue = read("Motherboard Model Number", "Motherboard Chipset", "Chipset");
  const psuValue = read("Power Supply Maximum Wattage", "Power Supply", "Power Supply Wattage");
  const coolingValue = read("CPU Cooling System", "Cooling System", "Cooling");
  const formFactorValue = read("Form Factor", "Case Type", "Motherboard Form Factor");
  const stickCount = numberFrom(read("Number of Memory Sticks Included", "Memory Stick Count"));
  const cpu = firstMatch(processorValue ?? searchable, [
    /\b((?:AMD\s+)?Ryzen\s+[3579]\s+\d{4,5}[A-Z0-9]*)\b/i,
    /\b((?:Intel\s+)?Core\s+Ultra\s+[579]\s+\d{3}[A-Z]*)\b/i,
    /\b((?:Intel\s+)?Core\s+i[3579]-?\d{4,5}[A-Z]*)\b/i,
  ]) ?? "Unknown";
  const gpu = firstMatch(graphicsValue ?? searchable, [
    /\b((?:NVIDIA\s+GeForce\s+)?RTX\s+\d{4}(?:\s+Ti|\s+SUPER)?)\b/i,
    /\b((?:AMD\s+)?Radeon\s+RX\s+\d{4}\s*(?:XT|XTX)?)\b/i,
  ]) ?? "Unknown";
  const ramGb = numberFrom(ramValue) ?? 0;
  const storageTb = storageTbFrom(storageValue) ?? 0;
  const gpuVramGb = numberFrom(vramValue) ?? 0;
  const motherboard = firstMatch(motherboardValue ?? "", [/\b((?:X|B|Z|H)\d{3}[A-Z]?)\b/i]);
  const psuWattage = numberFrom(psuValue);
  const cooling: CoolingType = coolingValue
    ? /liquid|water/i.test(coolingValue) ? "Liquid" : /air|fan/i.test(coolingValue) ? "Air" : "Unknown"
    : "Unknown";
  const caseStandard: CaseStandard = formFactorValue
    ? /micro.?atx/i.test(formFactorValue) ? "Micro-ATX"
      : /atx|tower/i.test(formFactorValue) ? "ATX"
        : /proprietary/i.test(formFactorValue) ? "Proprietary" : "Unknown"
    : "Unknown";
  const ramConfig: RamConfig = stickCount
    ? stickCount >= 2 ? "Dual-channel" : "Single-channel"
    : "Unknown";
  const psuTier: PsuTier = psuValue
    ? /gold|platinum|corsair|seasonic|evga|be quiet/i.test(psuValue) ? "Name-brand Gold" : "Generic"
    : "Unknown";
  const confidence: ConfidenceMap = {
    cpu: fieldConfidence(cpu === "Unknown" ? null : cpu, Boolean(processorValue)),
    gpu: fieldConfidence(gpu === "Unknown" ? null : gpu, Boolean(graphicsValue)),
    ram: fieldConfidence(ramGb || null, Boolean(ramValue)),
    storage: fieldConfidence(storageTb || null, Boolean(storageValue)),
    motherboard: fieldConfidence(motherboard, Boolean(motherboardValue)),
    psu: fieldConfidence(psuWattage, Boolean(psuValue)),
    cooling: fieldConfidence(cooling === "Unknown" ? null : cooling, Boolean(coolingValue)),
    caseStandard: fieldConfidence(caseStandard === "Unknown" ? null : caseStandard, Boolean(formFactorValue)),
    ramConfig: fieldConfidence(ramConfig === "Unknown" ? null : ramConfig, Boolean(stickCount)),
  };
  const secondary = [
    confidence.motherboard,
    confidence.psu,
    confidence.cooling,
    confidence.caseStandard,
    confidence.ramConfig,
  ];
  const price = product.salePrice ?? product.regularPrice ?? 0;
  const wasPrice = product.regularPrice && product.regularPrice > price
    ? product.regularPrice
    : undefined;
  const hasImage = Boolean(product.largeFrontImage || product.image);
  return {
    id: `best-buy:${product.sku}`,
    retailer: "Best Buy",
    retailerSku: String(product.sku),
    name: product.name,
    brand: product.manufacturer ?? null,
    modelNumber: product.modelNumber ?? null,
    category: product.type ?? null,
    cpu: cpu.replace(/^(?:AMD|Intel)\s+/i, ""),
    gpu: gpu.replace(/^(?:NVIDIA\s+GeForce|AMD)\s+/i, ""),
    gpuVramGb,
    quickSync: /\b(?:Core|Intel)\b/i.test(cpu) && !/F\b/i.test(cpu),
    ramGb,
    ramConfig,
    storageTb,
    motherboard,
    caseStandard,
    psuWattage,
    psuTier,
    cooling,
    upgradeabilityConfidence: secondary.reduce((sum, value) => sum + value, 0) / secondary.length,
    price,
    wasPrice,
    canonicalUrl: product.url,
    confidence,
    available: product.onlineAvailability !== false,
    imageUrl: product.largeFrontImage ?? product.image ?? null,
    imageSource: hasImage ? "best-buy-products-api" : null,
    imageAttribution: hasImage ? "Best Buy" : null,
    fetchedAt,
    expiresAt: expiresAtFor(fetchedAt),
  };
}

export function isUsableBestBuyListing(listing: NormalizedRetailerListing) {
  const hasValidPrice = Number.isFinite(listing.price) && listing.price > 0;
  const hasIdentifiableCoreHardware =
    listing.cpu !== "Unknown" || listing.gpu !== "Unknown";

  return hasValidPrice && hasIdentifiableCoreHardware;
}
