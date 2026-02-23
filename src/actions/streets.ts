"use server";

import { fetchStreetNamesWithFallback } from "@/lib/hdb-api";
import { HDB_TOWNS, FLAT_TYPES } from "@/lib/constants";
import type { DataSourceInfo } from "@/types/fallback";

export interface StreetNamesResult {
  streets: string[];
  error?: string;
  dataSource?: DataSourceInfo;
}

/**
 * Server action to get street names for a given town + flat type.
 * Returns a result object with streets and an optional error message.
 * Falls back to pre-generated data if data.gov.sg is unavailable.
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
    const { data: streets, dataSource } = await fetchStreetNamesWithFallback(town, flatType);
    if (streets.length === 0) {
      return {
        streets: [],
        error: `No streets found for ${flatType} flats in ${town}. This town may not have this flat type.`,
      };
    }
    return { streets, dataSource };
  } catch (err) {
    console.error("[streets] Failed to fetch street names:", err);
    return {
      streets: [],
      error: "Could not load streets — data.gov.sg may be temporarily unavailable. Please try again.",
    };
  }
}
