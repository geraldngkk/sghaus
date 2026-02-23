"use server";

import { fetchStreetNames } from "@/lib/hdb-api";
import { HDB_TOWNS, FLAT_TYPES } from "@/lib/constants";

export interface StreetNamesResult {
  streets: string[];
  error?: string;
}

/**
 * Server action to get street names for a given town + flat type.
 * Returns a result object with streets and an optional error message.
 */
export async function getStreetNames(
  town: string,
  flatType: string,
): Promise<StreetNamesResult> {
  if (!HDB_TOWNS.includes(town as (typeof HDB_TOWNS)[number])) {
    return { streets: [], error: "Invalid town selected" };
  }
  if (!FLAT_TYPES.includes(flatType as (typeof FLAT_TYPES)[number])) {
    return { streets: [], error: "Invalid flat type selected" };
  }

  try {
    const streets = await fetchStreetNames(town, flatType);
    if (streets.length === 0) {
      return {
        streets: [],
        error: `No streets found for ${flatType} flats in ${town}. This town may not have this flat type.`,
      };
    }
    return { streets };
  } catch (err) {
    console.error("[streets] Failed to fetch street names:", err);
    return {
      streets: [],
      error: "Could not load streets — data.gov.sg may be temporarily unavailable. Please try again.",
    };
  }
}
