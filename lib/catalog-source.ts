import { catalog, type PcListing } from "./catalog";

type ListingRow = {
  id: string;
  retailer: string;
  name: string;
  cpu: string;
  gpu: string;
  gpu_vram_gb: number;
  quick_sync: number;
  ram_gb: number;
  ram_config: PcListing["ramConfig"];
  storage_tb: number;
  motherboard: string | null;
  case_standard: PcListing["caseStandard"];
  psu_wattage: number | null;
  psu_tier: PcListing["psuTier"];
  cooling: PcListing["cooling"];
  upgradeability_confidence: number;
  price_cents: number;
  regular_price_cents: number | null;
  canonical_url: string;
  image_url: string | null;
  image_attribution: string | null;
  cpu_confidence: number;
  gpu_confidence: number;
  ram_confidence: number;
  storage_confidence: number;
  motherboard_confidence: number;
  psu_confidence: number;
  cooling_confidence: number;
  case_standard_confidence: number;
  ram_config_confidence: number;
};

const SELECT_FIELDS = `
  id, retailer, name, cpu, gpu, gpu_vram_gb, quick_sync, ram_gb, ram_config,
  storage_tb, motherboard, case_standard, psu_wattage, psu_tier, cooling,
  upgradeability_confidence, price_cents, regular_price_cents, canonical_url,
  image_url, image_attribution, cpu_confidence, gpu_confidence, ram_confidence,
  storage_confidence, motherboard_confidence, psu_confidence, cooling_confidence,
  case_standard_confidence, ram_config_confidence
`;

function fromRow(row: ListingRow): PcListing {
  return {
    id: row.id,
    retailer: row.retailer,
    name: row.name,
    cpu: row.cpu,
    gpu: row.gpu,
    gpuVramGb: row.gpu_vram_gb,
    quickSync: Boolean(row.quick_sync),
    ramGb: row.ram_gb,
    ramConfig: row.ram_config,
    storageTb: row.storage_tb,
    motherboard: row.motherboard,
    caseStandard: row.case_standard,
    psuWattage: row.psu_wattage,
    psuTier: row.psu_tier,
    cooling: row.cooling,
    upgradeabilityConfidence: row.upgradeability_confidence,
    price: row.price_cents / 100,
    wasPrice: row.regular_price_cents ? row.regular_price_cents / 100 : undefined,
    canonicalUrl: row.canonical_url,
    imageUrl: row.image_url,
    imageAttribution: row.image_attribution,
    confidence: {
      cpu: row.cpu_confidence,
      gpu: row.gpu_confidence,
      ram: row.ram_confidence,
      storage: row.storage_confidence,
      motherboard: row.motherboard_confidence,
      psu: row.psu_confidence,
      cooling: row.cooling_confidence,
      caseStandard: row.case_standard_confidence,
      ramConfig: row.ram_config_confidence,
    },
  };
}

async function databaseBinding(): Promise<D1Database | null> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env.DB ?? null;
  } catch {
    return null;
  }
}

export async function loadCatalog(): Promise<{
  listings: PcListing[];
  source: "live" | "sample";
}> {
  try {
    const db = await databaseBinding();
    if (!db) return { listings: catalog, source: "sample" };
    const result = await db.prepare(`
      SELECT ${SELECT_FIELDS}
      FROM listings
      WHERE available = 1 AND expires_at > ?
      ORDER BY price_cents ASC
      LIMIT 250
    `).bind(Date.now()).all<ListingRow>();
    if (!result.results.length) return { listings: catalog, source: "sample" };
    return { listings: result.results.map(fromRow), source: "live" };
  } catch (error) {
    console.error("Unable to load the live catalog; using sample inventory.", error);
    return { listings: catalog, source: "sample" };
  }
}

export async function getListingById(id: string): Promise<PcListing | null> {
  const sample = catalog.find((listing) => listing.id === id);
  if (sample) return sample;
  try {
    const db = await databaseBinding();
    if (!db) return null;
    const row = await db.prepare(`
      SELECT ${SELECT_FIELDS}
      FROM listings
      WHERE id = ? AND available = 1 AND expires_at > ?
      LIMIT 1
    `).bind(id, Date.now()).first<ListingRow>();
    return row ? fromRow(row) : null;
  } catch (error) {
    console.error("Unable to load the requested live listing.", error);
    return null;
  }
}
