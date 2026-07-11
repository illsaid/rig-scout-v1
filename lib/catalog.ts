export type ConfidenceMap = {
  cpu: number;
  gpu: number;
  ram: number;
  storage: number;
  motherboard: number;
};

export type PcListing = {
  id: string;
  retailer: string;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  storageTb: number;
  motherboard: string | null;
  price: number;
  wasPrice?: number;
  canonicalUrl: string;
  confidence: ConfidenceMap;
};

export const catalog: PcListing[] = [
  {
    id: "demo-001", retailer: "Newegg", name: "ABS Eurus Ruby Gaming PC", cpu: "Ryzen 9 9950X", gpu: "RTX 5080", ramGb: 64, storageTb: 2, motherboard: "X870E", price: 3199, wasPrice: 3499,
    canonicalUrl: "https://example.com/retailer/newegg/demo-001", confidence: { cpu: .99, gpu: .99, ram: .98, storage: .98, motherboard: .91 },
  },
  {
    id: "demo-002", retailer: "Best Buy", name: "CyberPowerPC Gamer Supreme", cpu: "Ryzen 9 9900X", gpu: "RTX 5080", ramGb: 32, storageTb: 2, motherboard: "X870", price: 2799, wasPrice: 2999,
    canonicalUrl: "https://example.com/retailer/best-buy/demo-002", confidence: { cpu: .99, gpu: .99, ram: .99, storage: .99, motherboard: .72 },
  },
  {
    id: "demo-003", retailer: "B&H", name: "MSI Aegis ZS2 Performance Desktop", cpu: "Ryzen 9 9950X", gpu: "RTX 5080", ramGb: 32, storageTb: 1, motherboard: null, price: 3099,
    canonicalUrl: "https://example.com/retailer/bh/demo-003", confidence: { cpu: .99, gpu: .98, ram: .96, storage: .97, motherboard: .25 },
  },
  {
    id: "demo-004", retailer: "Amazon", name: "Skytech Legacy Gaming Desktop", cpu: "Core Ultra 9 285K", gpu: "RTX 5080", ramGb: 64, storageTb: 2, motherboard: "Z890", price: 3399, wasPrice: 3599,
    canonicalUrl: "https://example.com/retailer/amazon/demo-004", confidence: { cpu: .97, gpu: .98, ram: .91, storage: .94, motherboard: .68 },
  },
  {
    id: "demo-005", retailer: "Newegg", name: "Cobratype Venom Workstation", cpu: "Core i9-14900KF", gpu: "RTX 5070 Ti", ramGb: 64, storageTb: 2, motherboard: "Z790", price: 2399, wasPrice: 2699,
    canonicalUrl: "https://example.com/retailer/newegg/demo-005", confidence: { cpu: .98, gpu: .99, ram: .96, storage: .96, motherboard: .84 },
  },
];
