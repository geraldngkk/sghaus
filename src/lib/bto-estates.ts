import { haversineMeters } from "./geo";

// ---------------------------------------------------------------------------
// BTO Estate Block-Level Data & Distance-Based Proximity Detection
// ---------------------------------------------------------------------------
// Maps major BTO projects (2016-2021 launches reaching MOP 2025-2028) to their
// actual block numbers, streets, and centroid coordinates. Used by
// risk-assessment.ts to calculate real geographic distance between the user's
// block and nearby MOP-ing BTO estates.
//
// Source: research/BTO.md — updated 2026-02-22
// Coordinates: OneMap API (verified 2026-02-22)
// Data from: BTOhq.com, data.gov.sg HDB Property Information, OneMap
// Update after each MOP wave (next: mid-2026 when 2027 MOP data firms up)
// ---------------------------------------------------------------------------

export interface BtoEstate {
  name: string;
  town: string;
  street: string;
  blocks: string[];
  units: number;
  launchDate: string;
  topDate: string;
  mopYear: number;
  flatTypes: string[];
  classification: "standard" | "prime" | "plus";
  /** Centroid latitude (WGS84) — representative block of the estate */
  lat: number;
  /** Centroid longitude (WGS84) — representative block of the estate */
  lng: number;
}

export type BtoProximity =
  | "same-estate"
  | "immediate"   // < 500m
  | "nearby"       // 500m - 1km
  | "area"         // 1km - 2km
  | "none";        // > 2km or not in same town

export interface BtoProximityResult {
  proximity: BtoProximity;
  estate: BtoEstate | null;
  distanceMeters: number | null;
  riskMultiplier: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Major MOP Wave Estates (2025-2028)
// Coordinates are centroid of each estate (representative block, OneMap-verified)
// ---------------------------------------------------------------------------

export const BTO_ESTATES: BtoEstate[] = [
  // --- PUNGGOL (2026 MOP wave — largest town, ~3,222 units) ---
  {
    name: "Northshore StraitsView",
    town: "PUNGGOL",
    street: "NORTHSHORE DR",
    blocks: ["421A", "421B", "421C", "422A", "422B"],
    units: 1021,
    launchDate: "2015-11",
    topDate: "2021-03",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.419246,
    lng: 103.904705,
  },
  {
    name: "Waterway Sunrise I",
    town: "PUNGGOL",
    street: "PUNGGOL EAST",
    blocks: ["655A", "655B", "655C", "656A", "656B", "656C", "657A", "657B"],
    units: 1295,
    launchDate: "2016-11",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.399631,
    lng: 103.920800,
  },
  {
    name: "Northshore Trio",
    town: "PUNGGOL",
    street: "NORTHSHORE DR",
    blocks: ["410", "410A", "411", "411A", "411B"],
    units: 409,
    launchDate: "2016-11",
    topDate: "2022",
    mopYear: 2027,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM"],
    classification: "standard",
    lat: 1.418038,
    lng: 103.905838,
  },

  // --- QUEENSTOWN (2026 MOP wave — Dawson estate, ~2,405 units) ---
  {
    name: "SkyResidence @ Dawson",
    town: "QUEENSTOWN",
    street: "MARGARET DR",
    blocks: ["30", "31", "32", "33", "34", "35", "36", "37"],
    units: 1217,
    launchDate: "2016-01",
    topDate: "2020",
    mopYear: 2025,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.298322,
    lng: 103.804701,
  },
  {
    name: "SkyOasis @ Dawson",
    town: "QUEENSTOWN",
    street: "MARGARET DR",
    blocks: ["39A", "40A", "40B", "41A", "42A", "43A"],
    units: 1192,
    launchDate: "2016",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.296893,
    lng: 103.806822,
  },

  // --- TAMPINES (2026 MOP wave — Tampines North, ~2,133 units) ---
  {
    name: "Tampines GreenVerge",
    town: "TAMPINES",
    street: "TAMPINES ST 61",
    blocks: [
      "618A", "618B", "619A", "619B", "620A", "620B", "621A", "621B",
    ],
    units: 1718,
    launchDate: "2016-08",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.361410,
    lng: 103.938855,
  },
  {
    name: "Tampines GreenVerge (Ave 12)",
    town: "TAMPINES",
    street: "TAMPINES AVE 12",
    blocks: [
      "622A", "622B", "623A", "623B", "623C", "624A", "624B",
      "625A", "625B", "626A", "627A", "627B",
    ],
    units: 304,
    launchDate: "2016-08",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.361911,
    lng: 103.940765,
  },

  // --- TOA PAYOH / BIDADARI (2026 MOP wave — ~1,594 units) ---
  {
    name: "Alkaff Oasis (South)",
    town: "TOA PAYOH",
    street: "BIDADARI PARK DR",
    blocks: ["107A", "107B", "108A", "108B", "109A", "109B", "110A", "110B"],
    units: 797,
    launchDate: "2016-02",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.333455,
    lng: 103.872324,
  },
  {
    name: "Alkaff Oasis (North)",
    town: "TOA PAYOH",
    street: "ALKAFF CRES",
    blocks: ["111A", "111B", "112A", "112B", "113A", "113B", "114A", "114B"],
    units: 797,
    launchDate: "2016-02",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.335959,
    lng: 103.873151,
  },

  // --- BUKIT BATOK (2026-2027 MOP wave — ~1,440 units) ---
  {
    name: "West Scape @ Bukit Batok",
    town: "BUKIT BATOK",
    street: "BT BATOK WEST AVE 8",
    blocks: ["431", "431A", "431B", "432", "432A", "432B", "433", "433A", "433B", "433C"],
    units: 1140,
    launchDate: "2017-08",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.360391,
    lng: 103.743004,
  },
  {
    name: "Sky Vista @ Bukit Batok",
    town: "BUKIT BATOK",
    street: "BT BATOK WEST AVE 6",
    blocks: ["114A", "114B"],
    units: 257,
    launchDate: "2017-08",
    topDate: "2022",
    mopYear: 2027,
    flatTypes: ["2 ROOM", "3 ROOM"],
    classification: "standard",
    lat: 1.349907,
    lng: 103.745813,
  },

  // --- BEDOK (2026 MOP wave — ~1,250 units) ---
  {
    name: "Bedok North Vale",
    town: "BEDOK",
    street: "BEDOK NORTH AVE 1",
    blocks: ["547A", "547B", "547C"],
    units: 620,
    launchDate: "2016-05",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM"],
    classification: "standard",
    lat: 1.329983,
    lng: 103.925589,
  },
  {
    name: "Bedok North Green",
    town: "BEDOK",
    street: "BEDOK NORTH ST 3",
    blocks: ["540", "541", "542"],
    units: 630,
    launchDate: "2016-11",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.330666,
    lng: 103.922844,
  },

  // --- SENGKANG (2026-2027 MOP wave) ---
  {
    name: "Rivervale Shores",
    town: "SENGKANG",
    street: "SENGKANG EAST DR",
    blocks: ["170A", "170B", "171A", "171B", "172A", "172B", "173A", "173B", "174A", "175A", "175B"],
    units: 680,
    launchDate: "2017-02",
    topDate: "2022",
    mopYear: 2027,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.390409,
    lng: 103.909627,
  },
  {
    name: "Fernvale Palms",
    town: "SENGKANG",
    street: "SENGKANG WEST WAY",
    blocks: ["432A", "432B", "432C", "433A", "433B"],
    units: 520,
    launchDate: "2017-08",
    topDate: "2022",
    mopYear: 2027,
    flatTypes: ["3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.394949,
    lng: 103.877567,
  },

  // --- WOODLANDS (2026-2027 MOP wave) ---
  {
    name: "Woodlands Beacon",
    town: "WOODLANDS",
    street: "WOODLANDS ST 13",
    blocks: ["99", "100", "100A"],
    units: 530,
    launchDate: "2017-02",
    topDate: "2022",
    mopYear: 2027,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"],
    classification: "standard",
    lat: 1.432063,
    lng: 103.781325,
  },

  // --- BUKIT PANJANG (2026 MOP wave) ---
  {
    name: "Senja Grand",
    town: "BUKIT PANJANG",
    street: "SENJA RD",
    blocks: ["628A", "628B", "628C", "629A", "629B", "630A"],
    units: 590,
    launchDate: "2016-08",
    topDate: "2021",
    mopYear: 2026,
    flatTypes: ["2 ROOM", "3 ROOM", "4 ROOM"],
    classification: "standard",
    lat: 1.385978,
    lng: 103.758963,
  },
];

// ---------------------------------------------------------------------------
// Block number parsing
// ---------------------------------------------------------------------------

function parseBlockNumber(block: string): number {
  const match = block.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : NaN;
}

// ---------------------------------------------------------------------------
// Street name normalisation
// ---------------------------------------------------------------------------

function normaliseStreet(street: string): string {
  return street
    .toUpperCase()
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bCRESCENT\b/g, "CRES")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bBUKIT\b/g, "BT")
    .trim();
}

// ---------------------------------------------------------------------------
// Distance-based proximity detection (with geocoding)
// ---------------------------------------------------------------------------

/**
 * Distance-based risk tiers for BTO MOP proximity.
 *
 * | Tier       | Distance   | Risk Multiplier | Rationale                                    |
 * |------------|------------|-----------------|----------------------------------------------|
 * | same-estate| 0m         | 1.0             | User IS in the MOP-ing estate                |
 * | immediate  | < 500m     | 0.8             | Walking distance, competing for same buyers  |
 * | nearby     | 500m - 1km | 0.5             | Same neighbourhood, indirect competition     |
 * | area       | 1km - 2km  | 0.3             | Same general area, mild supply effect        |
 * | none       | > 2km      | 0.0             | Too far for estate-specific impact            |
 */

export function detectBtoProximity(
  block: string,
  street: string,
  town: string,
  userCoords?: { lat: number; lng: number } | null,
  currentYear: number = new Date().getFullYear(),
): BtoProximityResult {
  const normStreet = normaliseStreet(street);
  const userBlockUpper = block.toUpperCase();

  // Only consider estates reaching MOP within the next 2 years
  const relevantEstates = BTO_ESTATES.filter(
    (e) => e.town === town && e.mopYear <= currentYear + 2,
  );

  if (relevantEstates.length === 0) {
    return {
      proximity: "none",
      estate: null,
      distanceMeters: null,
      riskMultiplier: 0,
      message: "",
    };
  }

  // --- Check for same-estate match first (block-level, no geocoding needed) ---
  for (const estate of relevantEstates) {
    const estateStreet = normaliseStreet(estate.street);
    if (
      estateStreet === normStreet &&
      estate.blocks.some((b) => b.toUpperCase() === userBlockUpper)
    ) {
      return {
        proximity: "same-estate",
        estate,
        distanceMeters: 0,
        riskMultiplier: 1.0,
        message:
          `Your block is part of ${estate.name} (${estate.units} units), ` +
          `which ${estate.mopYear <= currentYear ? "reached" : "reaches"} MOP in ${estate.mopYear}. ` +
          `Expect significant resale supply from this estate as owners sell post-MOP.`,
      };
    }
  }

  // --- Distance-based detection (requires user coordinates) ---
  if (userCoords) {
    return detectByDistance(relevantEstates, userCoords, currentYear);
  }

  // --- Fallback: block-number proximity (when geocoding unavailable) ---
  return detectByBlockNumber(relevantEstates, normStreet, block, currentYear);
}

// ---------------------------------------------------------------------------
// Distance-based detection (primary — uses Haversine)
// ---------------------------------------------------------------------------

function detectByDistance(
  estates: BtoEstate[],
  userCoords: { lat: number; lng: number },
  currentYear: number,
): BtoProximityResult {
  let closestEstate: BtoEstate | null = null;
  let closestDistance = Infinity;

  for (const estate of estates) {
    const dist = haversineMeters(
      userCoords.lat, userCoords.lng,
      estate.lat, estate.lng,
    );
    if (dist < closestDistance) {
      closestDistance = dist;
      closestEstate = estate;
    }
  }

  if (!closestEstate || closestDistance > 2000) {
    return {
      proximity: "none",
      estate: null,
      distanceMeters: closestDistance === Infinity ? null : Math.round(closestDistance),
      riskMultiplier: 0,
      message: "",
    };
  }

  const distRounded = Math.round(closestDistance);
  const mopVerb = closestEstate.mopYear <= currentYear ? "reached" : "reaches";

  if (closestDistance < 500) {
    return {
      proximity: "immediate",
      estate: closestEstate,
      distanceMeters: distRounded,
      riskMultiplier: 0.8,
      message:
        `${closestEstate.name} (${closestEstate.units} units) is ~${distRounded}m from your block ` +
        `and ${mopVerb} MOP in ${closestEstate.mopYear}. ` +
        `At this distance, MOP resale supply directly competes for the same buyer pool.`,
    };
  }

  if (closestDistance < 1000) {
    return {
      proximity: "nearby",
      estate: closestEstate,
      distanceMeters: distRounded,
      riskMultiplier: 0.5,
      message:
        `${closestEstate.name} (${closestEstate.units} units) is ~${distRounded}m away ` +
        `and ${mopVerb} MOP in ${closestEstate.mopYear}. ` +
        `Nearby MOP supply may increase buyer options in your neighbourhood.`,
    };
  }

  // 1km - 2km
  return {
    proximity: "area",
    estate: closestEstate,
    distanceMeters: distRounded,
    riskMultiplier: 0.3,
    message:
      `${closestEstate.name} (${closestEstate.units} units) is ~${(closestDistance / 1000).toFixed(1)}km away ` +
      `and ${mopVerb} MOP in ${closestEstate.mopYear}. ` +
      `Some supply pressure expected in the broader area.`,
  };
}

// ---------------------------------------------------------------------------
// Block-number fallback (when geocoding is unavailable)
// ---------------------------------------------------------------------------

function detectByBlockNumber(
  estates: BtoEstate[],
  normStreet: string,
  block: string,
  currentYear: number,
): BtoProximityResult {
  const userBlockNum = parseBlockNumber(block);

  let bestResult: BtoProximityResult = {
    proximity: "none",
    estate: null,
    distanceMeters: null,
    riskMultiplier: 0,
    message: "",
  };

  for (const estate of estates) {
    const estateStreet = normaliseStreet(estate.street);

    if (estateStreet === normStreet && !isNaN(userBlockNum)) {
      let minBlockDist = Infinity;
      for (const estateBlock of estate.blocks) {
        const estateBlockNum = parseBlockNumber(estateBlock);
        if (!isNaN(estateBlockNum)) {
          const dist = Math.abs(userBlockNum - estateBlockNum);
          if (dist < minBlockDist) minBlockDist = dist;
        }
      }

      const mopVerb = estate.mopYear <= currentYear ? "reached" : "reaches";

      // Block distance heuristic: ~50-100m per block number
      if (minBlockDist <= 5 && (bestResult.distanceMeters ?? Infinity) > minBlockDist * 80) {
        bestResult = {
          proximity: "immediate",
          estate,
          distanceMeters: minBlockDist * 80, // rough estimate
          riskMultiplier: 0.8,
          message:
            `${estate.name} (${estate.units} units) is ~${minBlockDist} blocks away ` +
            `and ${mopVerb} MOP in ${estate.mopYear}. ` +
            `MOP resale supply directly competes for the same buyer pool.`,
        };
      } else if (minBlockDist <= 12 && bestResult.proximity === "none") {
        bestResult = {
          proximity: "nearby",
          estate,
          distanceMeters: minBlockDist * 80,
          riskMultiplier: 0.5,
          message:
            `${estate.name} (${estate.units} units) is ~${minBlockDist} blocks away ` +
            `and ${mopVerb} MOP in ${estate.mopYear}. ` +
            `Nearby MOP supply may increase buyer options in your neighbourhood.`,
        };
      } else if (minBlockDist <= 25 && bestResult.proximity === "none") {
        bestResult = {
          proximity: "area",
          estate,
          distanceMeters: minBlockDist * 80,
          riskMultiplier: 0.3,
          message:
            `${estate.name} (${estate.units} units) on your street ` +
            `${mopVerb} MOP in ${estate.mopYear}. ` +
            `Some supply pressure expected in the area.`,
        };
      }
    }
  }

  return bestResult;
}

// ---------------------------------------------------------------------------
// Dynamic MOP detection from transaction data
// ---------------------------------------------------------------------------

/**
 * Detects potential MOP-wave blocks from transaction data by identifying
 * blocks with recent lease commencement dates that have just started
 * appearing in resale transactions.
 *
 * Complements the static BTO_ESTATES map — catches estates not yet tracked.
 */
export function detectMopActivityFromComps(
  comps: Array<{
    block: string;
    streetName: string;
    leaseCommenceDate: number;
    month: string;
  }>,
  currentYear: number = new Date().getFullYear(),
): { mopBlocks: string[]; mopStreet: string; avgLeaseYear: number } | null {
  const recentBlocks = comps.filter(
    (c) => c.leaseCommenceDate >= 2016 && c.leaseCommenceDate <= currentYear - 4,
  );

  if (recentBlocks.length < 3) return null;

  const blockCounts = new Map<string, number>();
  for (const c of recentBlocks) {
    const key = `${c.block}|${c.streetName}`;
    blockCounts.set(key, (blockCounts.get(key) ?? 0) + 1);
  }

  const streets = new Map<string, string[]>();
  for (const [key] of blockCounts) {
    const [block, street] = key.split("|");
    if (!streets.has(street)) streets.set(street, []);
    streets.get(street)!.push(block);
  }

  for (const [street, blocks] of streets) {
    if (blocks.length >= 3) {
      const streetComps = recentBlocks.filter((c) => c.streetName === street);
      const avgLease = Math.round(
        streetComps.reduce((sum, c) => sum + c.leaseCommenceDate, 0) /
          streetComps.length,
      );
      return { mopBlocks: blocks, mopStreet: street, avgLeaseYear: avgLease };
    }
  }

  return null;
}
