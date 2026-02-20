// ----- HDB Towns -----
export const HDB_TOWNS = [
  "ANG MO KIO",
  "BEDOK",
  "BISHAN",
  "BUKIT BATOK",
  "BUKIT MERAH",
  "BUKIT PANJANG",
  "BUKIT TIMAH",
  "CENTRAL AREA",
  "CHOA CHU KANG",
  "CLEMENTI",
  "GEYLANG",
  "HOUGANG",
  "JURONG EAST",
  "JURONG WEST",
  "KALLANG/WHAMPOA",
  "MARINE PARADE",
  "PASIR RIS",
  "PUNGGOL",
  "QUEENSTOWN",
  "SEMBAWANG",
  "SENGKANG",
  "SERANGOON",
  "TAMPINES",
  "TENGAH",
  "TOA PAYOH",
  "WOODLANDS",
  "YISHUN",
] as const;

export type HdbTown = (typeof HDB_TOWNS)[number];

// ----- Flat Types -----
export const FLAT_TYPES = [
  "2 ROOM",
  "3 ROOM",
  "4 ROOM",
  "5 ROOM",
  "EXECUTIVE",
] as const;

export type FlatType = (typeof FLAT_TYPES)[number];

// ----- Storey Ranges (3-floor bands as they appear in data.gov.sg) -----
export const STOREY_RANGES = [
  "01 TO 03",
  "04 TO 06",
  "07 TO 09",
  "10 TO 12",
  "13 TO 15",
  "16 TO 18",
  "19 TO 21",
  "22 TO 24",
  "25 TO 27",
  "28 TO 30",
  "31 TO 33",
  "34 TO 36",
  "37 TO 39",
  "40 TO 42",
  "43 TO 45",
  "46 TO 48",
  "49 TO 51",
] as const;

// ----- BSD Brackets (from 15 Feb 2023) -----
export const BSD_BRACKETS = [
  { threshold: 180_000, rate: 0.01 },
  { threshold: 180_000, rate: 0.02 },
  { threshold: 640_000, rate: 0.03 },
  { threshold: 500_000, rate: 0.04 },
  { threshold: 1_500_000, rate: 0.05 },
  { threshold: Infinity, rate: 0.06 },
] as const;

// ----- Adjustment Factors -----

/** Storey premium: +1.5% per 3-floor band above "01 TO 03" */
export const STOREY_PREMIUM_PER_BAND = 0.015;

/** Lease discount: -1% per year below 70 years remaining */
export const LEASE_DISCOUNT_PER_YEAR_BELOW_70 = 0.01;

/** Lease thresholds */
export const LEASE_FULL_ELIGIBILITY_YEARS = 70;
export const LEASE_WARNING_YEARS = 60;
export const LEASE_CRITICAL_YEARS = 50;

/** Size tolerance for Tier 2 comps: ±10% */
export const SIZE_TOLERANCE_PERCENT = 0.1;

/** Storey band proximity for Tier 2 comps: within 2 bands (6 floors) */
export const STOREY_BAND_PROXIMITY = 2;

/** Time windows for comp selection */
export const TIER_1_2_MONTHS = 12;
export const TIER_3_MONTHS = 24;

/** Minimum Tier 1 comps before falling back to Tier 2 */
export const MIN_TIER1_COMPS = 3;

// ----- Cost Estimates -----

/** Legal/conveyancing fees (SGD) */
export const LEGAL_FEES = { low: 2_000, high: 3_500 };

/**
 * Renovation estimates by flat type (SGD, resale flats, 2025-2026 data).
 * Sources: renovationcontractorsingapore.com, renomoji.com, MoneySmart.
 * These represent total renovation cost including condition + preference work.
 */
export const RENOVATION_ESTIMATES: Record<string, { low: number; high: number }> = {
  "2 ROOM": { low: 20_000, high: 40_000 },
  "3 ROOM": { low: 40_000, high: 70_000 },
  "4 ROOM": { low: 45_000, high: 80_000 },
  "5 ROOM": { low: 55_000, high: 100_000 },
  EXECUTIVE: { low: 65_000, high: 120_000 },
};

/** Buyer's agent commission rate */
export const AGENT_COMMISSION_RATE = 0.01;

// ----- Conversion -----
export const SQM_TO_SQFT = 10.764;

// ----- data.gov.sg API -----
export const DATA_GOV_SG = {
  baseUrl: "https://data.gov.sg/api/action/datastore_search",
  resourceId: "d_8b84c4ee58e3cfc0ece0d773c8ca6abc",
  maxLimit: 1000,
  cacheTtlSeconds: 86_400, // 24 hours
} as const;

// ----- BTO Heavy Supply Towns (2025-2027) -----
export const BTO_HEAVY_TOWNS: readonly string[] = [
  "TENGAH",
  "WOODLANDS",
  "SEMBAWANG",
  "PUNGGOL",
  "SENGKANG",
  "YISHUN",
];
