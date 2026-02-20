"use server";

import { unstable_cache } from "next/cache";
import { fetchResaleData } from "@/lib/hdb-api";
import { DATA_GOV_SG } from "@/lib/constants";

interface BlockInfo {
  blocks: string[];
  storeyRanges: string[];
  leaseCommenceDate: number | null;
  floorAreaSqm: number | null;
}

const CACHE_TTL = DATA_GOV_SG.cacheTtlSeconds;

/**
 * Get available blocks for a street.
 * Called when user selects a street name — populates block dropdown.
 * Derives from cached transaction data (no separate API call).
 */
export const getBlocks = unstable_cache(
  async (town: string, flatType: string, streetName: string): Promise<string[]> => {
    try {
      const transactions = await fetchResaleData(town, flatType);
      const blocks = new Set<string>();

      for (const t of transactions) {
        if (t.streetName === streetName) {
          blocks.add(t.block);
        }
      }

      // Sort numerically where possible, then alphabetically
      return Array.from(blocks).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    } catch (err) {
      console.log("[block-info] Failed to fetch blocks:", err);
      return [];
    }
  },
  ["hdb-blocks"],
  { revalidate: CACHE_TTL, tags: ["hdb-data"] },
);

/**
 * Get block-level details: available storey ranges, lease commence year, typical floor area.
 * Called when user selects a block — filters storey dropdown and provides lease year.
 *
 * Block is required — returns exact data for the specific block.
 */
export const getBlockDetails = unstable_cache(
  async (
    town: string,
    flatType: string,
    streetName: string,
    block?: string,
  ): Promise<Omit<BlockInfo, "blocks">> => {
    try {
      const transactions = await fetchResaleData(town, flatType);

      // Filter to matching records
      const matching = transactions.filter((t) => {
        if (t.streetName !== streetName) return false;
        if (block && t.block !== block) return false;
        return true;
      });

      if (matching.length === 0) {
        return { storeyRanges: [], leaseCommenceDate: null, floorAreaSqm: null };
      }

      // Distinct storey ranges
      const storeySet = new Set(matching.map((t) => t.storeyRange));
      const storeyRanges = Array.from(storeySet).sort();

      // Lease commence date — mode (most common value)
      const leaseCounts = new Map<number, number>();
      for (const t of matching) {
        leaseCounts.set(t.leaseCommenceDate, (leaseCounts.get(t.leaseCommenceDate) ?? 0) + 1);
      }
      let leaseCommenceDate: number | null = null;
      let maxLeaseCount = 0;
      for (const [year, count] of leaseCounts) {
        if (count > maxLeaseCount) {
          maxLeaseCount = count;
          leaseCommenceDate = year;
        }
      }

      // Floor area — mode (most common value)
      const areaCounts = new Map<number, number>();
      for (const t of matching) {
        areaCounts.set(t.floorAreaSqm, (areaCounts.get(t.floorAreaSqm) ?? 0) + 1);
      }
      let floorAreaSqm: number | null = null;
      let maxAreaCount = 0;
      for (const [area, count] of areaCounts) {
        if (count > maxAreaCount) {
          maxAreaCount = count;
          floorAreaSqm = area;
        }
      }

      return { storeyRanges, leaseCommenceDate, floorAreaSqm };
    } catch (err) {
      console.log("[block-info] Failed to fetch block details:", err);
      return { storeyRanges: [], leaseCommenceDate: null, floorAreaSqm: null };
    }
  },
  ["hdb-block-details"],
  { revalidate: CACHE_TTL, tags: ["hdb-data"] },
);
