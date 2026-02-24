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

/** Storey premium per LEVEL (not per band).
 *  Low-rise (≤15 storeys): $5,000/level
 *  High-rise (≥16 storeys): $4,000/level
 *  Top-tier bonus: extra $5k (low-rise) or $4k (high-rise) for the highest band
 */
export const STOREY_PREMIUM_PER_LEVEL_LOW_RISE = 5_000; // buildings ≤15 storeys
export const STOREY_PREMIUM_PER_LEVEL_HIGH_RISE = 4_000; // buildings ≥16 storeys
export const STOREY_LOW_RISE_CUTOFF = 15; // ≤ this = low-rise rate
export const STOREY_TOP_TIER_BONUS_LOW_RISE = 5_000;
export const STOREY_TOP_TIER_BONUS_HIGH_RISE = 4_000;

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

/** Legal/conveyancing fees (SGD) by loan type.
 *  HDB loan: HDB handles conveyancing in-house → ~$1,000
 *  Bank loan: requires external solicitor → ~$2,000
 */
export const LEGAL_FEES = {
  hdbLoan: 1_000,
  bankLoan: 2_000,
};

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

// ----- BTO Supply Pressure by Town (2025-2027) -----
// Source: research/BTO.md — updated 2026-02-22
// Update after each BTO exercise announcement (next: June 2026)

export type BtoSupplyPressure = "high" | "moderate" | "low";

export interface BtoTownData {
  pressure: BtoSupplyPressure;
  btoActivity: string;
  mopWaveRisk: "high" | "moderate" | "low";
  riskTitle: string;
  riskDescription: string;
  riskDetail: string;
  checklistDetail: string;
}

export const BTO_SUPPLY_MAP: Record<string, BtoTownData> = {
  "ANG MO KIO": {
    pressure: "high",
    btoActivity: "Oct 2025, Jun 2026 (~1,050 units)",
    mopWaveRisk: "moderate",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Ang Mo Kio has back-to-back BTO launches in 2025-2026 adding ~1,050 new units.",
    riskDetail:
      "Two BTO exercises (Oct 2025, Jun 2026) are adding significant new supply near Mayflower MRT. " +
      "These Plus-classified flats will divert first-time buyers from the resale market, moderating demand. " +
      "However, Plus restrictions (10-year MOP, subsidy clawback) mean these units won't enter resale supply until 2035+.",
    checklistDetail: "Back-to-back BTO launches in 2025-2026. New supply may moderate resale demand, but Plus restrictions delay resale competition.",
  },
  "BEDOK": {
    pressure: "moderate",
    btoActivity: "Oct 2025 (SWT, 862 units)",
    mopWaveRisk: "high",
    riskTitle: "MOP Wave Supply Pressure",
    riskDescription: "~1,250 BTO flats reaching MOP in Bedok in 2026, increasing resale supply.",
    riskDetail:
      "A single SWT BTO exercise in Oct 2025 adds modest new supply, but the bigger factor is ~1,250 flats reaching MOP in 2026. " +
      "These will enter the resale market as competing supply. Watch for increased listing volume in your street.",
    checklistDetail: "Moderate supply pressure — ~1,250 MOP flats entering resale market in 2026. One BTO exercise in 2025.",
  },
  "BISHAN": {
    pressure: "high",
    btoActivity: "Oct 2025, Jun 2026 (~1,200 units)",
    mopWaveRisk: "low",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Bishan has two BTO exercises in 2025-2026, including the landmark Lakeview project.",
    riskDetail:
      "The Jun 2026 Lakeview project (~1,200 units) is the first BTO in Upper Thomson in 40+ years — a headline launch. " +
      "Plus a Bishan Terraces project in Oct 2025. Both are Prime/Plus classified with 10-year MOP and subsidy clawback, " +
      "which actually pushes some demand toward unrestricted resale flats in the area.",
    checklistDetail: "Two BTO exercises in 2025-2026. Prime/Plus restrictions may actually support resale demand for unrestricted flats.",
  },
  "BUKIT BATOK": {
    pressure: "moderate",
    btoActivity: "None in 2025-2026",
    mopWaveRisk: "high",
    riskTitle: "MOP Wave Supply Pressure",
    riskDescription: "~1,440 BTO flats reaching MOP in Bukit Batok in 2026 — no new BTO but significant resale supply incoming.",
    riskDetail:
      "No new BTO launches, but ~1,440 flats from 2016-2017 BTO exercises are reaching MOP in 2026. " +
      "These will enter the resale market and increase supply. This is the third-largest MOP wave by town.",
    checklistDetail: "No new BTO supply, but ~1,440 MOP flats entering resale market in 2026. May create short-term price softness.",
  },
  "BUKIT MERAH": {
    pressure: "high",
    btoActivity: "Jul 2025, Oct 2025, Feb 2026, Jun 2026 (~4,000+ units)",
    mopWaveRisk: "low",
    riskTitle: "Very High BTO Supply Pressure",
    riskDescription: "Bukit Merah has the heaviest BTO pipeline — 4 consecutive exercises across 2025-2026.",
    riskDetail:
      "Four BTO exercises (Alexandra Peaks/Vista Jul 2025, Berlayar Oct 2025, Redhill Peaks Feb 2026, Berlayar Jun 2026) " +
      "are adding 4,000+ units. However, most are Prime-classified with 12-14% subsidy clawback and 10-year MOP. " +
      "These restrictions actually push some buyers toward unrestricted resale flats in the area. " +
      "Net effect: demand diversion from resale is partially offset by the Prime liquidity premium.",
    checklistDetail: "Heaviest BTO pipeline in Singapore (4 exercises). Prime restrictions may support demand for unrestricted resale flats.",
  },
  "BUKIT PANJANG": {
    pressure: "moderate",
    btoActivity: "Jul 2025 (643 units)",
    mopWaveRisk: "moderate",
    riskTitle: "Moderate BTO Supply Pressure",
    riskDescription: "Single BTO exercise in Jul 2025 plus moderate MOP wave in Bukit Panjang.",
    riskDetail:
      "One Standard-classified BTO (Bangkit Breeze, 643 units) in Jul 2025 plus moderate MOP wave. " +
      "Supply pressure is manageable but present. Standard classification means these units reach resale in 5 years.",
    checklistDetail: "Moderate supply pressure — one BTO exercise plus moderate MOP wave. Manageable.",
  },
  "BUKIT TIMAH": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Bukit Timah — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "CENTRAL AREA": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Central Area — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "CHOA CHU KANG": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Choa Chu Kang — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "CLEMENTI": {
    pressure: "moderate",
    btoActivity: "Jul 2025 (753 units)",
    mopWaveRisk: "low",
    riskTitle: "Moderate BTO Supply Pressure",
    riskDescription: "Single BTO exercise in Clementi (Jul 2025) — Plus-classified, 753 units.",
    riskDetail:
      "Clementi Emerald (753 units, Plus classification) launched Jul 2025. Plus restrictions (10-year MOP, subsidy clawback) " +
      "mean these units won't compete in resale until 2035+. Short-term impact is demand diversion only.",
    checklistDetail: "One Plus-classified BTO (2025). Plus restrictions delay resale competition — limited near-term impact.",
  },
  "GEYLANG": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Geylang — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "HOUGANG": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "moderate",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No BTO launches in Hougang, minor MOP wave only.",
    riskDetail:
      "No new BTO supply, with only a moderate MOP wave. Overall supply pressure is low.",
    checklistDetail: "No BTO supply pressure. Minor MOP wave — low overall impact.",
  },
  "JURONG EAST": {
    pressure: "moderate",
    btoActivity: "Oct 2025 (620 units)",
    mopWaveRisk: "low",
    riskTitle: "Moderate BTO Supply Pressure",
    riskDescription: "Single BTO exercise in Jurong East (Oct 2025) — 620 units.",
    riskDetail:
      "Teban Heights (620 units, Standard) launched Oct 2025. Moderate demand diversion from resale market. " +
      "Jurong East is undergoing transformation with the Jurong Lake District — long-term fundamentals are positive.",
    checklistDetail: "One BTO exercise in 2025 (620 units). Moderate near-term impact, positive long-term outlook with JLD transformation.",
  },
  "JURONG WEST": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Jurong West — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "KALLANG/WHAMPOA": {
    pressure: "moderate",
    btoActivity: "Feb 2025 (812 units, Prime)",
    mopWaveRisk: "low",
    riskTitle: "Moderate BTO Supply Pressure",
    riskDescription: "Single Prime BTO in Kallang/Whampoa (Feb 2025) — 812 units at Tanjong Rhu.",
    riskDetail:
      "Tanjong Rhu Parc Front (812 units, Prime) launched Feb 2025. Prime classification with 10-year MOP and subsidy clawback " +
      "means these units won't compete in resale until 2035+. May actually push demand toward unrestricted resale flats.",
    checklistDetail: "One Prime BTO (2025). Prime restrictions delay resale competition and may support demand for unrestricted resale flats.",
  },
  "MARINE PARADE": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Marine Parade — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "PASIR RIS": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Pasir Ris — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "PUNGGOL": {
    pressure: "high",
    btoActivity: "None in 2025-2026",
    mopWaveRisk: "high",
    riskTitle: "Major MOP Wave — Resale Supply Surge",
    riskDescription: "~3,222 BTO flats reaching MOP in Punggol in 2026 — the largest MOP wave of any town.",
    riskDetail:
      "Punggol has the largest 2026 MOP wave: ~3,222 flats (Northshore StraitsView, Waterway Sunrise I, Northshore Trio). " +
      "These will flood the resale market. Expect increased listings and buyer leverage. " +
      "No new BTO launches in Punggol, so the pressure is entirely from MOP supply entering resale.",
    checklistDetail: "Largest MOP wave in 2026 (~3,222 units). Significant resale supply increase — strong buyer leverage expected.",
  },
  "QUEENSTOWN": {
    pressure: "high",
    btoActivity: "Feb 2025 (1,110 units, Plus)",
    mopWaveRisk: "high",
    riskTitle: "Major MOP Wave — Dawson Estate",
    riskDescription: "~2,405 MOP flats (SkyResidence + SkyOasis @ Dawson) entering resale in 2026, plus a 2025 BTO.",
    riskDetail:
      "The Dawson estate MOP wave (~2,405 units from SkyResidence and SkyOasis) is the second-largest by town. " +
      "Plus Stirling Horizon BTO (1,110 units, Plus) from Feb 2025. However, Queenstown is a mature estate with " +
      "strong location fundamentals — MOP flats here are expected to be in high demand and may transact at premium PSF.",
    checklistDetail: "Major MOP wave (~2,405 Dawson units) + one Plus BTO. Mature estate location may buffer price impact.",
  },
  "SEMBAWANG": {
    pressure: "high",
    btoActivity: "Feb 2026, Jun 2026 (~3,950 units)",
    mopWaveRisk: "moderate",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Sembawang has the heaviest non-mature estate BTO pipeline — ~3,950 units across 4 projects in 2026.",
    riskDetail:
      "Four BTO projects across two 2026 exercises (Sembawang Deck, Sembawang Voyage in Feb; two more in Jun) " +
      "are adding ~3,950 units. All Standard-classified with 5-year MOP — these will enter resale by 2031. " +
      "Plus moderate MOP wave from earlier projects. Sustained high supply will moderate price growth.",
    checklistDetail: "Heaviest non-mature BTO pipeline (~3,950 units in 2026). Standard classification means 5-year MOP resale competition.",
  },
  "SENGKANG": {
    pressure: "high",
    btoActivity: "Oct 2025 (SWT, 207 units)",
    mopWaveRisk: "high",
    riskTitle: "MOP Wave + BTO Supply Pressure",
    riskDescription: "High MOP wave from 2019-2020 BTO cohort plus a 2025 BTO exercise in Sengkang.",
    riskDetail:
      "Sengkang faces dual supply pressure: a high MOP wave from the large 2019-2020 BTO cohort entering resale, " +
      "plus Fernvale Plains BTO (207 units, Oct 2025). The MOP wave is the dominant factor — " +
      "expect increased resale listings and buyer negotiation leverage.",
    checklistDetail: "High MOP wave + one BTO exercise. Dual supply pressure — expect increased buyer leverage.",
  },
  "SERANGOON": {
    pressure: "low",
    btoActivity: "None",
    mopWaveRisk: "low",
    riskTitle: "Low BTO Supply Pressure",
    riskDescription: "No major BTO supply pressure in Serangoon — limited new supply supports resale values.",
    riskDetail:
      "No BTO launches planned and minimal MOP wave. Resale supply is constrained, supporting price stability.",
    checklistDetail: "No BTO supply pressure — limited new supply supports resale values.",
  },
  "TAMPINES": {
    pressure: "high",
    btoActivity: "Feb 2026 (539 units), Oct 2026 likely",
    mopWaveRisk: "high",
    riskTitle: "BTO + MOP Wave Supply Pressure",
    riskDescription: "Tampines faces BTO launches in 2026 plus ~2,133 MOP flats — the third-largest MOP wave.",
    riskDetail:
      "Dual supply pressure: BTO launches (Tampines Nova + Tampines Bliss in Feb 2026, likely more in Oct 2026) " +
      "plus ~2,133 MOP flats (mainly Tampines GreenVerge in Tampines North). " +
      "Mature estate location provides some buffer, but watch for increased competition in Tampines North specifically.",
    checklistDetail: "BTO launches + major MOP wave (~2,133 units). Mature estate, but expect increased supply in Tampines North.",
  },
  "TENGAH": {
    pressure: "moderate",
    btoActivity: "None in 2025-2026",
    mopWaveRisk: "low",
    riskTitle: "Moderate Future Supply Pressure",
    riskDescription: "No current BTO launches, but early Tengah BTO projects will begin reaching MOP from 2027.",
    riskDetail:
      "Tengah is Singapore's newest town with large BTO cohorts from 2018-2020. While no new launches are planned " +
      "in 2025-2026, the first MOP wave is expected 2027-2028 and will be significant. " +
      "Factor in future supply when considering holding period.",
    checklistDetail: "No current pressure, but large MOP wave expected 2027-2028 as early Tengah BTOs mature.",
  },
  "TOA PAYOH": {
    pressure: "high",
    btoActivity: "Jul 2025, Oct 2025, Feb 2026 (~2,870+ units)",
    mopWaveRisk: "moderate",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Toa Payoh has 3 BTO exercises across 2025-2026 plus ~1,594 MOP flats at Bidadari.",
    riskDetail:
      "Three BTO exercises (Jul 2025, Oct 2025 Mount Pleasant Crest, Feb 2026 Kim Keat Crest) adding 2,870+ units. " +
      "Plus ~1,594 Alkaff Oasis flats at Bidadari reaching MOP. Most new BTO supply is Prime/Plus classified " +
      "with 10-year MOP — these won't compete in resale until 2035+. The Bidadari MOP wave is the more immediate factor.",
    checklistDetail: "3 BTO exercises (mostly Prime/Plus) + Bidadari MOP wave (~1,594 units). Prime restrictions delay resale competition.",
  },
  "WOODLANDS": {
    pressure: "high",
    btoActivity: "Feb 2025, Jul 2025, Jun 2026 (~3,330+ units)",
    mopWaveRisk: "moderate",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Woodlands has 3 BTO exercises across 2025-2026 adding 3,330+ units.",
    riskDetail:
      "Three BTO exercises across two years (Woodlands North Verge Feb 2025, Woodlands North Jul 2025, Woodlands Jun 2026) " +
      "are adding 3,330+ Standard-classified units. All with 5-year MOP — resale competition from 2030+. " +
      "Plus moderate MOP wave from earlier projects. Sustained high supply will moderate price growth.",
    checklistDetail: "3 BTO exercises (3,330+ units, all Standard). Sustained high supply pipeline through 2026.",
  },
  "YISHUN": {
    pressure: "high",
    btoActivity: "Feb 2025, Oct 2025 (~2,350+ units)",
    mopWaveRisk: "moderate",
    riskTitle: "High BTO Supply Pressure",
    riskDescription: "Yishun has 2 BTO exercises in 2025 adding 2,350+ units plus moderate MOP wave.",
    riskDetail:
      "Two BTO exercises (Chencharu Green/Vines Feb 2025, Yishun Glade/Chencharu Grove Oct 2025) " +
      "adding 2,350+ Standard-classified units to Yishun. All with 5-year MOP. " +
      "Plus moderate MOP wave. Chencharu precinct is developing into a distinct sub-market.",
    checklistDetail: "2 BTO exercises (2,350+ units) + moderate MOP wave. Chencharu precinct adds significant new supply.",
  },
};

// Convenience: backward-compatible list of high-pressure towns
export const BTO_HEAVY_TOWNS: readonly string[] = Object.entries(BTO_SUPPLY_MAP)
  .filter(([, data]) => data.pressure === "high")
  .map(([town]) => town);
