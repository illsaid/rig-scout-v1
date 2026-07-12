export type ConfidenceMap = {
  cpu: number;
  gpu: number;
  ram: number;
  storage: number;
  motherboard: number;
  psu: number;
  cooling: number;
  caseStandard: number;
  ramConfig: number;
};

export type PsuTier = "Name-brand Gold" | "Generic" | "Unknown";
export type RamConfig = "Dual-channel" | "Single-channel" | "Unknown";
export type CaseStandard = "ATX" | "Micro-ATX" | "Proprietary" | "Unknown";
export type CoolingType = "Air" | "Liquid" | "Unknown";

export type PcListing = {
  id: string;
  retailer: string;
  name: string;
  cpu: string;
  gpu: string;
  gpuVramGb: number;
  quickSync: boolean;
  ramGb: number;
  ramConfig: RamConfig;
  storageTb: number;
  motherboard: string | null;
  caseStandard: CaseStandard;
  psuWattage: number | null;
  psuTier: PsuTier;
  cooling: CoolingType;
  upgradeabilityConfidence: number;
  price: number;
  wasPrice?: number;
  canonicalUrl: string;
  imageUrl?: string | null;
  imageAttribution?: string | null;
  confidence: ConfidenceMap;
};

export const catalog: PcListing[] = [
  {
    id: "demo-001", retailer: "Newegg", name: "ABS Eurus Ruby Gaming PC", cpu: "Ryzen 9 9950X", gpu: "RTX 5080", gpuVramGb: 16, quickSync: false, ramGb: 64, ramConfig: "Dual-channel", storageTb: 2, motherboard: "X870E", caseStandard: "ATX", psuWattage: 1000, psuTier: "Name-brand Gold", cooling: "Liquid", upgradeabilityConfidence: .94, price: 3199, wasPrice: 3499,
    canonicalUrl: "https://example.com/retailer/newegg/demo-001", confidence: { cpu: .99, gpu: .99, ram: .98, storage: .98, motherboard: .91, psu: .94, cooling: .92, caseStandard: .96, ramConfig: .94 },
  },
  {
    id: "demo-002", retailer: "Best Buy", name: "CyberPowerPC Gamer Supreme", cpu: "Ryzen 9 9900X", gpu: "RTX 5080", gpuVramGb: 16, quickSync: false, ramGb: 32, ramConfig: "Dual-channel", storageTb: 2, motherboard: "X870", caseStandard: "ATX", psuWattage: 850, psuTier: "Generic", cooling: "Liquid", upgradeabilityConfidence: .78, price: 2799, wasPrice: 2999,
    canonicalUrl: "https://example.com/retailer/best-buy/demo-002", confidence: { cpu: .99, gpu: .99, ram: .99, storage: .99, motherboard: .72, psu: .61, cooling: .88, caseStandard: .86, ramConfig: .84 },
  },
  {
    id: "demo-003", retailer: "B&H", name: "MSI Aegis ZS2 Performance Desktop", cpu: "Ryzen 9 9950X", gpu: "RTX 5080", gpuVramGb: 16, quickSync: false, ramGb: 32, ramConfig: "Unknown", storageTb: 1, motherboard: null, caseStandard: "Unknown", psuWattage: null, psuTier: "Unknown", cooling: "Liquid", upgradeabilityConfidence: .42, price: 3099,
    canonicalUrl: "https://example.com/retailer/bh/demo-003", confidence: { cpu: .99, gpu: .98, ram: .96, storage: .97, motherboard: .25, psu: .18, cooling: .73, caseStandard: .35, ramConfig: .28 },
  },
  {
    id: "demo-004", retailer: "Amazon", name: "Skytech Legacy Gaming Desktop", cpu: "Core Ultra 9 285K", gpu: "RTX 5080", gpuVramGb: 16, quickSync: true, ramGb: 64, ramConfig: "Dual-channel", storageTb: 2, motherboard: "Z890", caseStandard: "ATX", psuWattage: 1000, psuTier: "Name-brand Gold", cooling: "Liquid", upgradeabilityConfidence: .81, price: 3399, wasPrice: 3599,
    canonicalUrl: "https://example.com/retailer/amazon/demo-004", confidence: { cpu: .97, gpu: .98, ram: .91, storage: .94, motherboard: .68, psu: .76, cooling: .82, caseStandard: .86, ramConfig: .83 },
  },
  {
    id: "demo-005", retailer: "Newegg", name: "Cobratype Venom Workstation", cpu: "Core i9-14900KF", gpu: "RTX 5070 Ti", gpuVramGb: 16, quickSync: false, ramGb: 64, ramConfig: "Dual-channel", storageTb: 2, motherboard: "Z790", caseStandard: "ATX", psuWattage: 850, psuTier: "Name-brand Gold", cooling: "Liquid", upgradeabilityConfidence: .88, price: 2399, wasPrice: 2699,
    canonicalUrl: "https://example.com/retailer/newegg/demo-005", confidence: { cpu: .98, gpu: .99, ram: .96, storage: .96, motherboard: .84, psu: .85, cooling: .86, caseStandard: .93, ramConfig: .91 },
  },
  {
    id: "demo-006", retailer: "Best Buy", name: "Alienware Aurora Performance Desktop", cpu: "Core Ultra 9 285K", gpu: "RTX 5090", gpuVramGb: 32, quickSync: true, ramGb: 64, ramConfig: "Dual-channel", storageTb: 2, motherboard: "Z890", caseStandard: "Proprietary", psuWattage: 1500, psuTier: "Name-brand Gold", cooling: "Liquid", upgradeabilityConfidence: .96, price: 3499, wasPrice: 3999,
    canonicalUrl: "https://example.com/retailer/best-buy/demo-006", confidence: { cpu: .99, gpu: .99, ram: .98, storage: .98, motherboard: .87, psu: .91, cooling: .94, caseStandard: .98, ramConfig: .92 },
  },
];
