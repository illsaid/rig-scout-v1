import RigScoutSearch from "./RigScoutSearch";
import { loadCatalog } from "@/lib/catalog-source";
import {
  criteriaFromSearchParams,
  type SearchParamsRecord,
} from "@/lib/search-criteria";

type HomeProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

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
