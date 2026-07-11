import RigScoutSearch from "./RigScoutSearch";
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

  return <RigScoutSearch initialCriteria={initialCriteria} />;
}
