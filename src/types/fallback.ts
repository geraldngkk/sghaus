import type { ParsedTransaction } from "@/types";

/** Compact per-block attributes derived from all-time data */
export interface BlockAttributes {
  storeyRanges: string[];
  lease: number; // lease commence date (mode)
  area: number; // floor area sqm (mode)
}

/** Per-town index: flatType → street → block → attributes */
export interface TownIndex {
  [flatType: string]: {
    streets: {
      [street: string]: {
        blocks: {
          [block: string]: BlockAttributes;
        };
      };
    };
  };
}

/** Per-town pricing: flatType → ParsedTransaction[] (24-month window) */
export interface TownPricing {
  [flatType: string]: ParsedTransaction[];
}

/** Metadata written alongside fallback data */
export interface FallbackMeta {
  generatedAt: string;
  townCount: number;
  totalRecords: number;
}

/** Tells the UI whether data came from live API or fallback */
export interface DataSourceInfo {
  type: "live" | "fallback";
  asOf: string; // ISO date string
}
