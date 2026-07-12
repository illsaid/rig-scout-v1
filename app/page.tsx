import type { Metadata } from "next";
import RigScoutSearch from "./RigScoutSearch";
import { loadCatalog } from "@/lib/catalog-source";
import {
  criteriaFromSearchParams,
  type SearchParamsRecord,
} from "@/lib/search-criteria";

type HomeProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const isSharedBrief = Object.keys(params).length > 0;

  return {
    alternates: { canonical: "/" },
    robots: isSharedBrief
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const initialCriteria = criteriaFromSearchParams(
    searchParams ? await searchParams : {},
  );
  const inventory = await loadCatalog();

  return (
    <RigScoutSearch
      initialCriteria={initialCriteria}
      initialCatalog={inventory.listings}
      inventorySource={inventory.source}
    />
  );
}
