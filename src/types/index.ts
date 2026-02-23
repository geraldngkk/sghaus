import type { DataSourceInfo } from "@/types/fallback";

/** Raw record from data.gov.sg HDB Resale Flat Prices API */
export interface HdbResaleRecord {
  _id: number;
  month: string; // "2026-02"
  town: string; // "TAMPINES"
  flat_type: string; // "4 ROOM"
  block: string; // "119"
  street_name: string; // "SIMEI ST 1"
  storey_range: string; // "04 TO 06"
  floor_area_sqm: string; // "104" (string in API)
  flat_model: string; // "Model A"
  lease_commence_date: string; // "1988"
  remaining_lease: string; // "61 years 04 months"
  resale_price: string; // "718000" (string in API)
}

export interface DataGovResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ type: string; id: string }>;
    records: HdbResaleRecord[];
    _links: { start: string; next: string };
    total: number;
    limit: number;
    offset?: number;
  };
}

/** Parsed and enriched transaction record */
export interface ParsedTransaction {
  id: number;
  month: string;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  storeyMidpoint: number;
  floorAreaSqm: number;
  floorAreaSqft: number;
  flatModel: string;
  leaseCommenceDate: number;
  remainingLeaseYears: number;
  resalePrice: number;
  pricePsf: number;
}

/** User input from the property form */
export interface PropertyInput {
  town: string;
  flatType: string;
  streetName: string;
  block: string;
  storeyRange: string;
  floorAreaSqm: number;
  leaseCommenceDate: number; // auto-resolved by backend if not provided by form
}

/** Comparable tier assignment */
export type CompTier = 1 | 2 | 3;

/** A comparable transaction with tier and adjusted price */
export interface TieredComparable extends ParsedTransaction {
  tier: CompTier;
  adjustedPricePsf: number;
}

/** The three-tier offer strategy output */
export interface OfferStrategy {
  low: number;
  mid: number;
  max: number;
  lowPsf: number;
  midPsf: number;
  maxPsf: number;
  lowRationale: string;
  midRationale: string;
  maxRationale: string;
  walkAwayTriggers: string[];
}

/** Cost breakdown at a specific price point */
export interface CostBreakdown {
  purchasePrice: number;
  bsd: number;
  legalFees: { low: number; high: number };
  renovationEstimate: { low: number; high: number };
  agentCommission: number;
  totalLow: number;
  totalHigh: number;
}

/** Risk flag with severity */
export interface RiskFlag {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detail: string;
}

/** Buy/don't-buy checklist item */
export interface ChecklistItem {
  category: string;
  question: string;
  assessment: "positive" | "neutral" | "negative";
  detail: string;
}

/** Market context for trend analysis */
export interface MarketContext {
  medianPsf: number;
  medianPrice: number;
  transactionCount12m: number;
  trendDirection: "up" | "flat" | "down";
  trendPercentage: number;
}

/** Renovation condition assessment result */
export interface RenovationResult {
  overallScore: number;
  condition: "move-in ready" | "light refresh" | "partial renovation" | "full renovation";
  estimatedCost: { low: number; high: number };
  estimatedCostBeforeScaling: { low: number; high: number };
  flatTypeUsed: string;
  costScaleFactor: number;
  priceAdjustmentPercent: number;
  priceAdjustmentDollar: number;
  breakdown: {
    category: string;
    score: number;
    costLow: number;
    costHigh: number;
  }[];
}

/** Complete analysis result returned by the server action */
export interface AnalysisResult {
  input: PropertyInput;
  generatedAt: string;
  comps: {
    tier1: TieredComparable[];
    tier2: TieredComparable[];
    tier3: TieredComparable[];
    totalRecordsFetched: number;
  };
  offer: OfferStrategy;
  offerWithReno?: OfferStrategy; // adjusted for renovation condition
  renovation?: RenovationResult;
  costs: {
    atLow: CostBreakdown;
    atMid: CostBreakdown;
    atMax: CostBreakdown;
  };
  risks: RiskFlag[];
  checklist: ChecklistItem[];
  marketContext: MarketContext;
  dataSource?: DataSourceInfo;
}
