import type {
  PropertyInput,
  TieredComparable,
  MarketContext,
  RiskFlag,
  ChecklistItem,
  MrtProximityResult,
  SchoolProximityResult,
} from "@/types";
import {
  LEASE_FULL_ELIGIBILITY_YEARS,
  LEASE_WARNING_YEARS,
  LEASE_CRITICAL_YEARS,
  BTO_SUPPLY_MAP,
} from "./constants";
import { calculateRemainingLease } from "./adjustments";
import { detectBtoProximity } from "./bto-estates";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

export function assessRisks(
  input: PropertyInput,
  comps: {
    tier1: TieredComparable[];
    tier2: TieredComparable[];
    tier3: TieredComparable[];
  },
  marketContext: MarketContext,
  userCoords?: { lat: number; lng: number } | null,
  subjectMrt?: MrtProximityResult | null,
  nearbySchools?: SchoolProximityResult[] | null,
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const remainingLease = calculateRemainingLease(input.leaseCommenceDate);

  // 1. Remaining lease risk
  if (remainingLease < LEASE_CRITICAL_YEARS) {
    flags.push({
      id: "lease-critical",
      title: "Very Short Remaining Lease",
      severity: "critical",
      description: `Only ~${Math.round(remainingLease)} years remaining on a 99-year lease.`,
      detail:
        "CPF usage will be severely restricted. HDB loan LTV will be significantly pro-rated. " +
        "Banks may refuse loans if the lease ends before the borrower turns 95. " +
        "Resale will be very difficult — your buyer pool shrinks drastically.",
    });
  } else if (remainingLease < LEASE_WARNING_YEARS) {
    flags.push({
      id: "lease-high",
      title: "Short Remaining Lease",
      severity: "high",
      description: `~${Math.round(remainingLease)} years remaining — below the 70-year full eligibility threshold.`,
      detail:
        "CPF usage and HDB loan quantum are pro-rated based on remaining lease vs. buyer's age. " +
        "Your future buyers will face the same restrictions, affecting resale value. " +
        "Factor in faster depreciation when considering holding period.",
    });
  } else if (remainingLease < LEASE_FULL_ELIGIBILITY_YEARS) {
    flags.push({
      id: "lease-medium",
      title: "Lease Approaching Threshold",
      severity: "medium",
      description: `~${Math.round(remainingLease)} years remaining.`,
      detail:
        "Currently eligible for full CPF usage and HDB loans, but approaching the 70-year threshold. " +
        "If you hold for 10+ years, your future buyers will face pro-rated financing. " +
        "Consider your planned holding period carefully.",
    });
  }

  // 2. Price trend risk
  if (
    marketContext.trendDirection === "down" &&
    marketContext.trendPercentage < -2
  ) {
    flags.push({
      id: "price-declining",
      title: "Declining Price Trend",
      severity: "medium",
      description: `Prices in ${input.town} are down ${Math.abs(marketContext.trendPercentage).toFixed(1)}% year-on-year.`,
      detail:
        "The market in this area is softening. You may be able to negotiate harder or wait for better pricing. " +
        "However, timing the market is inherently risky — if you need to buy now, negotiate accordingly.",
    });
  }

  // 3. BTO supply pressure (town-specific)
  const btoData = BTO_SUPPLY_MAP[input.town];
  if (btoData && btoData.pressure !== "low") {
    flags.push({
      id: "bto-supply",
      title: btoData.riskTitle,
      severity: btoData.pressure === "high" ? "high" : "medium",
      description: btoData.riskDescription,
      detail: btoData.riskDetail,
    });
  }

  // 3b. MOP estate proximity (distance-based)
  // userCoords is optionally passed in; falls back to block-number heuristic
  const proximity = detectBtoProximity(
    input.block, input.streetName, input.town, userCoords,
  );
  if (proximity.proximity !== "none" && proximity.estate) {
    const distLabel = proximity.distanceMeters != null && proximity.distanceMeters > 0
      ? proximity.distanceMeters < 1000
        ? `~${proximity.distanceMeters}m away`
        : `~${(proximity.distanceMeters / 1000).toFixed(1)}km away`
      : "";

    const severityByProximity =
      proximity.proximity === "same-estate" || proximity.proximity === "immediate"
        ? "high" as const
        : proximity.proximity === "nearby"
          ? "medium" as const
          : "low" as const;

    flags.push({
      id: "mop-proximity",
      title:
        proximity.proximity === "same-estate"
          ? "You Are in a MOP-ing Estate"
          : proximity.proximity === "immediate"
            ? "MOP Estate Within 500m"
            : proximity.proximity === "nearby"
              ? "MOP Estate Within 1km"
              : "MOP Estate in Your Area",
      severity: severityByProximity,
      description:
        proximity.proximity === "same-estate"
          ? `Your block is part of ${proximity.estate.name} (${proximity.estate.units} units reaching MOP ${proximity.estate.mopYear}).`
          : `${proximity.estate.name} (${proximity.estate.units} units) is ${distLabel}, reaching MOP ${proximity.estate.mopYear}.`,
      detail: proximity.message,
    });
  }

  // 4. Comp scarcity
  if (comps.tier1.length === 0) {
    flags.push({
      id: "no-street-comps",
      title: "No Direct Street Comparables",
      severity: "medium",
      description: `No recent transactions found on ${input.streetName}. Pricing is based on ${comps.tier2.length > 0 ? `${comps.tier2.length} town-wide` : "area-wide"} comparables.`,
      detail:
        "Without transactions on the same street, the offer calculation relies on broader area data. " +
        "This means wider pricing uncertainty — the actual market value for your specific block could be higher or lower " +
        "than the town-wide median suggests. Consider requesting recent transaction records from the seller's agent " +
        "or checking if similar blocks nearby have recent sales.",
    });
  } else if (comps.tier1.length < 3 && comps.tier2.length < 5) {
    flags.push({
      id: "comp-scarcity",
      title: "Limited Comparable Data",
      severity: "medium",
      description: `Only ${comps.tier1.length} direct comps and ${comps.tier2.length} area comps found.`,
      detail:
        "With few comparable transactions, the offer calculation has wider uncertainty. " +
        "Consider broadening your search, viewing more units, or consulting a property agent for local insight.",
    });
  }

  // 5. Above town median
  const compPsf =
    comps.tier1.length > 0
      ? median(comps.tier1.map((c) => c.adjustedPricePsf))
      : comps.tier2.length > 0
        ? median(comps.tier2.map((c) => c.adjustedPricePsf))
        : 0;

  if (compPsf > 0 && marketContext.medianPsf > 0 && compPsf > marketContext.medianPsf * 1.15) {
    flags.push({
      id: "above-median",
      title: "Above Town Median",
      severity: "low",
      description: `Estimated PSF is ${((compPsf / marketContext.medianPsf - 1) * 100).toFixed(0)}% above the ${input.town} median.`,
      detail:
        "This premium may be justified by floor level, remaining lease, flat model, or micro-location. " +
        "Verify the premium is warranted by checking the comparable details.",
    });
  }

  // 6. MRT proximity
  if (subjectMrt) {
    if (subjectMrt.distanceMeters > 1000) {
      flags.push({
        id: "mrt-far",
        title: "Far from MRT",
        severity: "medium",
        description: `Nearest MRT: ${subjectMrt.station.name} (${subjectMrt.station.codes.join("/")}) at ${(subjectMrt.distanceMeters / 1000).toFixed(1)}km (~${subjectMrt.walkingMinutes} min walk).`,
        detail:
          "Properties within 500m of MRT typically command 5-8% price premium. " +
          "This distance may limit resale value appreciation and reduce your buyer pool when selling.",
      });
    } else if (subjectMrt.distanceMeters > 500) {
      flags.push({
        id: "mrt-moderate",
        title: "Moderate MRT Distance",
        severity: "low",
        description: `Nearest MRT: ${subjectMrt.station.name} (${subjectMrt.station.codes.join("/")}) at ${subjectMrt.distanceMeters}m (~${subjectMrt.walkingMinutes} min walk).`,
        detail:
          "Walkable to MRT but not within the immediate 500m premium zone. " +
          "Expect a smaller location premium (2-5%) compared to properties right next to the station.",
      });
    }

    if (subjectMrt.station.status === "under-construction") {
      flags.push({
        id: "mrt-under-construction",
        title: "Nearest MRT Under Construction",
        severity: "low",
        description: `${subjectMrt.station.name} (${subjectMrt.station.codes.join("/")}) is under construction, expected ${subjectMrt.station.expectedYear ?? "TBC"}.`,
        detail:
          "The MRT premium is partially priced in but discounted for time to completion. " +
          "Property value may appreciate as the station opens. Factor construction timeline into your holding period.",
      });
    }
  }

  // 7. School proximity
  if (nearbySchools && nearbySchools.length > 0) {
    const within1km = nearbySchools.filter((s) => s.distanceBand === "within1km");
    const eliteWithin1km = within1km.filter((s) => s.school.tier === "A");

    if (eliteWithin1km.length > 0) {
      const names = eliteWithin1km.map((s) => s.school.name).join(", ");
      flags.push({
        id: "school-elite-nearby",
        title: "Near Elite Primary School",
        severity: "low",
        description: `Within 1 km of ${eliteWithin1km.length === 1 ? "elite school" : `${eliteWithin1km.length} elite schools`}: ${names}.`,
        detail:
          "Properties within 1 km of elite primary schools (tier A) command a 5-10% price premium due to MOE P1 registration priority. " +
          "This premium is well-established and supports resale value. Factor this into your valuation.",
      });
    }
  } else if (nearbySchools && nearbySchools.length === 0) {
    flags.push({
      id: "school-none-nearby",
      title: "No Notable Schools Within 2 km",
      severity: "low",
      description: "No primary schools with strong demand signals found within 2 km.",
      detail:
        "The absence of popular schools nearby means no school premium is priced in. " +
        "This is neutral for most buyers but may limit resale appeal to families prioritising P1 registration.",
    });
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Buy/Don't-Buy checklist
// ---------------------------------------------------------------------------

export function generateChecklist(
  input: PropertyInput,
  risks: RiskFlag[],
  marketContext: MarketContext,
  userCoords?: { lat: number; lng: number } | null,
  subjectMrt?: MrtProximityResult | null,
  nearbySchools?: SchoolProximityResult[] | null,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const remainingLease = calculateRemainingLease(input.leaseCommenceDate);

  // Lease assessment
  if (remainingLease >= LEASE_FULL_ELIGIBILITY_YEARS) {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "positive",
      detail: `~${Math.round(remainingLease)} years remaining — full CPF usage and HDB loan eligibility.`,
    });
  } else if (remainingLease >= LEASE_WARNING_YEARS) {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "neutral",
      detail: `~${Math.round(remainingLease)} years remaining — CPF and loan may be pro-rated. Check with CPF Board.`,
    });
  } else {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "negative",
      detail: `~${Math.round(remainingLease)} years remaining — significant financing restrictions. May require more cash.`,
    });
  }

  // Price trend
  if (marketContext.trendDirection === "up") {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "positive",
      detail: `Prices up ${marketContext.trendPercentage.toFixed(1)}% YoY — market momentum is positive.`,
    });
  } else if (marketContext.trendDirection === "flat") {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "neutral",
      detail: "Prices relatively flat YoY — stable market, no strong momentum either way.",
    });
  } else {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "negative",
      detail: `Prices down ${Math.abs(marketContext.trendPercentage).toFixed(1)}% YoY — negotiate harder or consider waiting.`,
    });
  }

  // Transaction volume
  if (marketContext.transactionCount12m >= 20) {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "positive",
      detail: `${marketContext.transactionCount12m} transactions in the last 12 months — good liquidity.`,
    });
  } else if (marketContext.transactionCount12m >= 5) {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "neutral",
      detail: `${marketContext.transactionCount12m} transactions in the last 12 months — moderate liquidity.`,
    });
  } else {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "negative",
      detail: `Only ${marketContext.transactionCount12m} transactions in the last 12 months — low liquidity, pricing uncertain.`,
    });
  }

  // BTO pressure (town-specific)
  const btoChecklist = BTO_SUPPLY_MAP[input.town];
  if (btoChecklist && btoChecklist.pressure === "high") {
    items.push({
      category: "Supply",
      question: "Is there upcoming BTO supply that could affect prices?",
      assessment: "negative",
      detail: btoChecklist.checklistDetail,
    });
  } else if (btoChecklist && btoChecklist.pressure === "moderate") {
    items.push({
      category: "Supply",
      question: "Is there upcoming BTO supply that could affect prices?",
      assessment: "neutral",
      detail: btoChecklist.checklistDetail,
    });
  } else {
    items.push({
      category: "Supply",
      question: "Is there upcoming BTO supply that could affect prices?",
      assessment: "positive",
      detail: btoChecklist
        ? btoChecklist.checklistDetail
        : `No major BTO supply pressure in ${input.town} — limited new supply supports resale values.`,
    });
  }

  // MOP estate proximity (distance-based)
  const checklistProximity = detectBtoProximity(
    input.block, input.streetName, input.town, userCoords,
  );
  if (checklistProximity.proximity !== "none" && checklistProximity.estate) {
    const distStr = checklistProximity.distanceMeters != null && checklistProximity.distanceMeters > 0
      ? checklistProximity.distanceMeters < 1000
        ? `${checklistProximity.distanceMeters}m away`
        : `${(checklistProximity.distanceMeters / 1000).toFixed(1)}km away`
      : "nearby";

    items.push({
      category: "Supply",
      question: "Is your block near a BTO estate reaching MOP?",
      assessment:
        checklistProximity.proximity === "same-estate" || checklistProximity.proximity === "immediate"
          ? "negative"
          : checklistProximity.proximity === "nearby"
            ? "neutral"
            : "positive",
      detail:
        checklistProximity.proximity === "same-estate"
          ? `Your block is part of ${checklistProximity.estate.name} (${checklistProximity.estate.units} units). Significant resale supply expected as owners sell post-MOP.`
          : `${checklistProximity.estate.name} (${checklistProximity.estate.units} units, ${distStr}) reaches MOP in ${checklistProximity.estate.mopYear}. ${
              checklistProximity.proximity === "immediate"
                ? "At this distance, MOP supply directly competes for your buyer pool."
                : checklistProximity.proximity === "nearby"
                  ? "Nearby MOP supply may increase buyer options in your neighbourhood."
                  : "Some supply pressure expected in the broader area."
            }`,
    });
  }

  // MRT proximity
  if (subjectMrt) {
    if (subjectMrt.distanceMeters <= 500) {
      items.push({
        category: "Location",
        question: "Is the property near an MRT station?",
        assessment: "positive",
        detail: `Within walking distance of ${subjectMrt.station.name} MRT (${subjectMrt.station.codes.join("/")}) at ${subjectMrt.distanceMeters}m (~${subjectMrt.walkingMinutes} min walk).${
          subjectMrt.station.status === "under-construction"
            ? ` Under construction, expected ${subjectMrt.station.expectedYear ?? "TBC"}.`
            : " Strong location premium of 5-15%."
        }`,
      });
    } else if (subjectMrt.distanceMeters <= 1000) {
      items.push({
        category: "Location",
        question: "Is the property near an MRT station?",
        assessment: "neutral",
        detail: `${subjectMrt.station.name} MRT (${subjectMrt.station.codes.join("/")}) is ${subjectMrt.distanceMeters}m away (~${subjectMrt.walkingMinutes} min walk). ${
          subjectMrt.station.status === "under-construction"
            ? `Under construction, expected ${subjectMrt.station.expectedYear ?? "TBC"}.`
            : "Walkable but outside the immediate 500m premium zone."
        }`,
      });
    } else {
      items.push({
        category: "Location",
        question: "Is the property near an MRT station?",
        assessment: "negative",
        detail: `Nearest MRT is ${subjectMrt.station.name} (${subjectMrt.station.codes.join("/")}) at ${(subjectMrt.distanceMeters / 1000).toFixed(1)}km (~${subjectMrt.walkingMinutes} min walk). Not within convenient walking distance.`,
      });
    }
  }

  // School proximity
  if (nearbySchools && nearbySchools.length > 0) {
    const within1km = nearbySchools.filter((s) => s.distanceBand === "within1km");
    const desirableWithin1km = within1km.filter(
      (s) => s.school.tier === "A" || s.school.tier === "B" || s.school.tier === "C",
    );
    const bestSchool = nearbySchools[0]; // sorted by distance

    if (desirableWithin1km.length >= 2) {
      const names = desirableWithin1km
        .slice(0, 3)
        .map((s) => s.school.name)
        .join(", ");
      items.push({
        category: "Location",
        question: "Is the property near desirable primary schools?",
        assessment: "positive",
        detail: `${desirableWithin1km.length} desirable school(s) within 1 km: ${names}. Strong P1 registration advantage and school premium.`,
      });
    } else if (desirableWithin1km.length === 1) {
      items.push({
        category: "Location",
        question: "Is the property near desirable primary schools?",
        assessment: "positive",
        detail: `Within 1 km of ${desirableWithin1km[0].school.name} (tier ${desirableWithin1km[0].school.tier}, ${desirableWithin1km[0].distanceMeters}m). P1 registration priority applies.`,
      });
    } else if (within1km.length > 0) {
      items.push({
        category: "Location",
        question: "Is the property near desirable primary schools?",
        assessment: "neutral",
        detail: `${within1km.length} school(s) within 1 km but none in the top tiers (A/B/C). P1 registration priority applies but no significant school premium.`,
      });
    } else {
      items.push({
        category: "Location",
        question: "Is the property near desirable primary schools?",
        assessment: "neutral",
        detail: `Nearest school is ${bestSchool.school.name} at ${bestSchool.distanceMeters}m (1-2 km band). Secondary P1 registration priority only.`,
      });
    }
  } else if (nearbySchools) {
    items.push({
      category: "Location",
      question: "Is the property near desirable primary schools?",
      assessment: "negative",
      detail: "No primary schools found within 2 km. No P1 registration distance advantage.",
    });
  }

  // Risk summary
  const criticalRisks = risks.filter((r) => r.severity === "critical").length;
  const highRisks = risks.filter((r) => r.severity === "high").length;

  if (criticalRisks > 0) {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "negative",
      detail: `${criticalRisks} critical risk(s) identified — review carefully before proceeding.`,
    });
  } else if (highRisks > 0) {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "neutral",
      detail: `${highRisks} high-severity risk(s) — manageable but factor into your decision.`,
    });
  } else {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "positive",
      detail: "No critical or high-severity risks identified.",
    });
  }

  return items;
}
