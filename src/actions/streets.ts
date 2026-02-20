"use server";

import { fetchStreetNames } from "@/lib/hdb-api";
import { HDB_TOWNS, FLAT_TYPES } from "@/lib/constants";

/**
 * Server action to get street names for a given town + flat type.
 * Used by the form for autocomplete.
 */
export async function getStreetNames(
  town: string,
  flatType: string,
): Promise<string[]> {
  if (!HDB_TOWNS.includes(town as (typeof HDB_TOWNS)[number])) {
    return [];
  }
  if (!FLAT_TYPES.includes(flatType as (typeof FLAT_TYPES)[number])) {
    return [];
  }

  return fetchStreetNames(town, flatType);
}
