import type { MrtStation, MrtProximityResult } from "@/types";
import { haversineMeters, walkingMinutes } from "./geo";

// ---------------------------------------------------------------------------
// MRT Premium Tiers
// ---------------------------------------------------------------------------

const MRT_PREMIUM_TIERS = [
  { tier: "immediate" as const, maxMeters: 200, minPercent: 0.08, maxPercent: 0.15 },
  { tier: "convenient" as const, maxMeters: 500, minPercent: 0.05, maxPercent: 0.08 },
  { tier: "walkable" as const, maxMeters: 1000, minPercent: 0.02, maxPercent: 0.05 },
] as const;

// ---------------------------------------------------------------------------
// Complete MRT/LRT Station Dataset (~200 stations)
// ---------------------------------------------------------------------------
// Sources:
//   - xkjyeah/singapore-postal-codes (mrt_stations.json, lrt_stations.json)
//   - singaporeexpats.com maps (TEL stations)
//   - latitude.to (spot checks)
// Coordinates: WGS84 decimal degrees (lat/lng)
// Last updated: 2026-02-25
// Interchange stations have ONE entry with ALL codes and lines listed.
// Under-construction stations use approximate planned coordinates.
// ---------------------------------------------------------------------------

export const MRT_STATIONS: MrtStation[] = [

  // ==========================================================================
  // NORTH-SOUTH LINE (NS) — Red
  // ==========================================================================

  { name: "Jurong East",     code: "NS1",  codes: ["NS1", "EW24"],       line: "North-South Line", lines: ["North-South Line", "East-West Line"],                                   lat: 1.33315, lng: 103.74229, status: "operational" },
  { name: "Bukit Batok",     code: "NS2",  codes: ["NS2"],                line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.34903, lng: 103.74957, status: "operational" },
  { name: "Bukit Gombak",    code: "NS3",  codes: ["NS3"],                line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.35861, lng: 103.75179, status: "operational" },
  { name: "Choa Chu Kang",   code: "NS4",  codes: ["NS4", "BP1"],         line: "North-South Line", lines: ["North-South Line", "Bukit Panjang LRT"],                               lat: 1.38536, lng: 103.74437, status: "operational" },
  { name: "Yew Tee",         code: "NS5",  codes: ["NS5"],                line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.39754, lng: 103.74741, status: "operational" },
  { name: "Kranji",          code: "NS7",  codes: ["NS7"],                line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.42509, lng: 103.76214, status: "operational" },
  { name: "Marsiling",       code: "NS8",  codes: ["NS8"],                line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.43252, lng: 103.77407, status: "operational" },
  { name: "Woodlands",       code: "NS9",  codes: ["NS9", "TE2"],         line: "North-South Line", lines: ["North-South Line", "Thomson-East Coast Line"],                         lat: 1.43607, lng: 103.78793, status: "operational" },
  { name: "Admiralty",       code: "NS10", codes: ["NS10"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.44059, lng: 103.80099, status: "operational" },
  { name: "Sembawang",       code: "NS11", codes: ["NS11"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.44905, lng: 103.82005, status: "operational" },
  { name: "Canberra",        code: "NS12", codes: ["NS12"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.44308, lng: 103.82970, status: "operational" },
  { name: "Yishun",          code: "NS13", codes: ["NS13"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.42944, lng: 103.83501, status: "operational" },
  { name: "Khatib",          code: "NS14", codes: ["NS14"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.41738, lng: 103.83298, status: "operational" },
  { name: "Yio Chu Kang",    code: "NS15", codes: ["NS15"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.38176, lng: 103.84495, status: "operational" },
  { name: "Ang Mo Kio",      code: "NS16", codes: ["NS16"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.36993, lng: 103.84956, status: "operational" },
  { name: "Bishan",          code: "NS17", codes: ["NS17", "CC15"],       line: "North-South Line", lines: ["North-South Line", "Circle Line"],                                     lat: 1.35084, lng: 103.84814, status: "operational" },
  { name: "Braddell",        code: "NS18", codes: ["NS18"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.34047, lng: 103.84680, status: "operational" },
  { name: "Toa Payoh",       code: "NS19", codes: ["NS19"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.33263, lng: 103.84750, status: "operational" },
  { name: "Novena",          code: "NS20", codes: ["NS20"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.32044, lng: 103.84383, status: "operational" },
  { name: "Newton",          code: "NS21", codes: ["NS21", "DT11"],       line: "North-South Line", lines: ["North-South Line", "Downtown Line"],                                   lat: 1.31232, lng: 103.83799, status: "operational" },
  { name: "Orchard",         code: "NS22", codes: ["NS22", "TE14"],       line: "North-South Line", lines: ["North-South Line", "Thomson-East Coast Line"],                         lat: 1.30398, lng: 103.83225, status: "operational" },
  { name: "Somerset",        code: "NS23", codes: ["NS23"],               line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.30026, lng: 103.83909, status: "operational" },
  { name: "Dhoby Ghaut",     code: "NS24", codes: ["NS24", "NE6", "CC1"], line: "North-South Line", lines: ["North-South Line", "North East Line", "Circle Line"],                  lat: 1.29870, lng: 103.84612, status: "operational" },
  { name: "City Hall",       code: "NS25", codes: ["NS25", "EW13"],       line: "North-South Line", lines: ["North-South Line", "East-West Line"],                                   lat: 1.29294, lng: 103.85259, status: "operational" },
  { name: "Raffles Place",   code: "NS26", codes: ["NS26", "EW14"],       line: "North-South Line", lines: ["North-South Line", "East-West Line"],                                   lat: 1.28413, lng: 103.85146, status: "operational" },
  { name: "Marina Bay",      code: "NS27", codes: ["NS27", "CE2", "TE20"], line: "North-South Line", lines: ["North-South Line", "Circle Line Extension", "Thomson-East Coast Line"], lat: 1.27643, lng: 103.85460, status: "operational" },
  { name: "Marina South Pier", code: "NS28", codes: ["NS28"],             line: "North-South Line", lines: ["North-South Line"],                                                     lat: 1.27103, lng: 103.86245, status: "operational" },

  // ==========================================================================
  // EAST-WEST LINE (EW) — Green
  // ==========================================================================

  { name: "Pasir Ris",        code: "EW1",  codes: ["EW1"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.37304, lng: 103.94928, status: "operational" },
  { name: "Tampines",         code: "EW2",  codes: ["EW2", "DT32"],       line: "East-West Line", lines: ["East-West Line", "Downtown Line"],          lat: 1.35330, lng: 103.94514, status: "operational" },
  { name: "Simei",            code: "EW3",  codes: ["EW3"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.34320, lng: 103.95337, status: "operational" },
  { name: "Tanah Merah",      code: "EW4",  codes: ["EW4"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32719, lng: 103.94635, status: "operational" },
  { name: "Bedok",            code: "EW5",  codes: ["EW5"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32398, lng: 103.92998, status: "operational" },
  { name: "Kembangan",        code: "EW6",  codes: ["EW6"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32104, lng: 103.91295, status: "operational" },
  { name: "Eunos",            code: "EW7",  codes: ["EW7"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31978, lng: 103.90323, status: "operational" },
  { name: "Paya Lebar",       code: "EW8",  codes: ["EW8", "CC9"],        line: "East-West Line", lines: ["East-West Line", "Circle Line"],           lat: 1.31811, lng: 103.89306, status: "operational" },
  { name: "Aljunied",         code: "EW9",  codes: ["EW9"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31643, lng: 103.88291, status: "operational" },
  { name: "Kallang",          code: "EW10", codes: ["EW10"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31149, lng: 103.87139, status: "operational" },
  { name: "Lavender",         code: "EW11", codes: ["EW11"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.30738, lng: 103.86277, status: "operational" },
  { name: "Bugis",            code: "EW12", codes: ["EW12", "DT14"],      line: "East-West Line", lines: ["East-West Line", "Downtown Line"],          lat: 1.30047, lng: 103.85571, status: "operational" },
  { name: "Tanjong Pagar",    code: "EW15", codes: ["EW15"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.27656, lng: 103.84573, status: "operational" },
  { name: "Outram Park",      code: "EW16", codes: ["EW16", "NE3", "TE17"], line: "East-West Line", lines: ["East-West Line", "North East Line", "Thomson-East Coast Line"], lat: 1.27974, lng: 103.83951, status: "operational" },  // 3-line interchange
  { name: "Tiong Bahru",      code: "EW17", codes: ["EW17"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.28610, lng: 103.82745, status: "operational" },
  { name: "Redhill",          code: "EW18", codes: ["EW18"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.28963, lng: 103.81674, status: "operational" },
  { name: "Queenstown",       code: "EW19", codes: ["EW19"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.29455, lng: 103.80608, status: "operational" },
  { name: "Commonwealth",     code: "EW20", codes: ["EW20"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.30251, lng: 103.79823, status: "operational" },
  { name: "Buona Vista",      code: "EW21", codes: ["EW21", "CC22"],      line: "East-West Line", lines: ["East-West Line", "Circle Line"],           lat: 1.30722, lng: 103.79025, status: "operational" },
  { name: "Dover",            code: "EW22", codes: ["EW22"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31141, lng: 103.77864, status: "operational" },
  { name: "Clementi",         code: "EW23", codes: ["EW23"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31520, lng: 103.76518, status: "operational" },
  { name: "Chinese Garden",   code: "EW25", codes: ["EW25"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.34235, lng: 103.73260, status: "operational" },
  { name: "Lakeside",         code: "EW26", codes: ["EW26"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.34426, lng: 103.72095, status: "operational" },
  { name: "Boon Lay",         code: "EW27", codes: ["EW27"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.33860, lng: 103.70606, status: "operational" },
  { name: "Pioneer",          code: "EW28", codes: ["EW28"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.33759, lng: 103.69732, status: "operational" },
  { name: "Joo Koon",         code: "EW29", codes: ["EW29"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32772, lng: 103.67838, status: "operational" },
  { name: "Gul Circle",       code: "EW30", codes: ["EW30"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.31947, lng: 103.66053, status: "operational" },
  { name: "Tuas Crescent",    code: "EW31", codes: ["EW31"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32103, lng: 103.64908, status: "operational" },
  { name: "Tuas West Road",   code: "EW32", codes: ["EW32"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.32999, lng: 103.63961, status: "operational" },
  { name: "Tuas Link",        code: "EW33", codes: ["EW33"],              line: "East-West Line", lines: ["East-West Line"],                          lat: 1.34088, lng: 103.63699, status: "operational" },

  // Changi Branch
  { name: "Expo",             code: "CG1",  codes: ["CG1", "DT35"],       line: "East-West Line", lines: ["East-West Line", "Downtown Line"],          lat: 1.33538, lng: 103.96237, status: "operational" },
  { name: "Changi Airport",   code: "CG2",  codes: ["CG2"],               line: "East-West Line", lines: ["East-West Line"],                          lat: 1.35748, lng: 103.98788, status: "operational" },

  // ==========================================================================
  // NORTH EAST LINE (NE) — Purple
  // ==========================================================================

  { name: "HarbourFront",     code: "NE1",  codes: ["NE1", "CC29"],       line: "North East Line", lines: ["North East Line", "Circle Line"],                                      lat: 1.26539, lng: 103.82153, status: "operational" },
  { name: "Clarke Quay",      code: "NE5",  codes: ["NE5"],               line: "North East Line", lines: ["North East Line"],                                                      lat: 1.28839, lng: 103.84656, status: "operational" },
  { name: "Little India",     code: "NE7",  codes: ["NE7", "DT12"],       line: "North East Line", lines: ["North East Line", "Downtown Line"],                                    lat: 1.30680, lng: 103.84965, status: "operational" },
  { name: "Farrer Park",      code: "NE8",  codes: ["NE8"],               line: "North East Line", lines: ["North East Line"],                                                      lat: 1.31191, lng: 103.85348, status: "operational" },
  { name: "Boon Keng",        code: "NE9",  codes: ["NE9"],               line: "North East Line", lines: ["North East Line"],                                                      lat: 1.31934, lng: 103.86157, status: "operational" },
  { name: "Potong Pasir",     code: "NE10", codes: ["NE10"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.33138, lng: 103.86906, status: "operational" },
  { name: "Woodleigh",        code: "NE11", codes: ["NE11"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.33919, lng: 103.87082, status: "operational" },
  { name: "Serangoon",        code: "NE12", codes: ["NE12", "CC13"],      line: "North East Line", lines: ["North East Line", "Circle Line"],                                      lat: 1.34971, lng: 103.87357, status: "operational" },
  { name: "Kovan",            code: "NE13", codes: ["NE13"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.36018, lng: 103.88506, status: "operational" },
  { name: "Hougang",          code: "NE14", codes: ["NE14"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.37129, lng: 103.89238, status: "operational" },
  { name: "Buangkok",         code: "NE15", codes: ["NE15"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.38288, lng: 103.89312, status: "operational" },
  { name: "Sengkang",         code: "NE16", codes: ["NE16"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.39169, lng: 103.89548, status: "operational" },
  { name: "Punggol",          code: "NE17", codes: ["NE17"],              line: "North East Line", lines: ["North East Line"],                                                      lat: 1.40455, lng: 103.90207, status: "operational" },

  // Chinatown: NE4/DT19 interchange
  { name: "Chinatown",        code: "NE4",  codes: ["NE4", "DT19"],       line: "North East Line", lines: ["North East Line", "Downtown Line"],                                    lat: 1.28422, lng: 103.84514, status: "operational" },

  // ==========================================================================
  // CIRCLE LINE (CC) — Orange
  // ==========================================================================

  { name: "Bras Basah",       code: "CC2",  codes: ["CC2"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.29686, lng: 103.85067, status: "operational" },
  { name: "Esplanade",        code: "CC3",  codes: ["CC3"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.29366, lng: 103.85508, status: "operational" },
  { name: "Promenade",        code: "CC4",  codes: ["CC4", "DT15"],       line: "Circle Line", lines: ["Circle Line", "Downtown Line"],               lat: 1.29400, lng: 103.86035, status: "operational" },
  { name: "Nicoll Highway",   code: "CC5",  codes: ["CC5"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.29977, lng: 103.86364, status: "operational" },
  { name: "Stadium",          code: "CC6",  codes: ["CC6"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.30281, lng: 103.87534, status: "operational" },
  { name: "Mountbatten",      code: "CC7",  codes: ["CC7"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.30620, lng: 103.88253, status: "operational" },
  { name: "Dakota",           code: "CC8",  codes: ["CC8"],               line: "Circle Line", lines: ["Circle Line"],                                lat: 1.30855, lng: 103.88906, status: "operational" },
  { name: "MacPherson",       code: "CC10", codes: ["CC10", "DT26"],      line: "Circle Line", lines: ["Circle Line", "Downtown Line"],               lat: 1.32615, lng: 103.88930, status: "operational" },
  { name: "Tai Seng",         code: "CC11", codes: ["CC11"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.33510, lng: 103.88843, status: "operational" },
  { name: "Bartley",          code: "CC12", codes: ["CC12"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.34250, lng: 103.88018, status: "operational" },
  { name: "Lorong Chuan",     code: "CC14", codes: ["CC14"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.35161, lng: 103.86415, status: "operational" },
  { name: "Marymount",        code: "CC16", codes: ["CC16"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.34871, lng: 103.83942, status: "operational" },
  { name: "Caldecott",        code: "CC17", codes: ["CC17", "TE9"],       line: "Circle Line", lines: ["Circle Line", "Thomson-East Coast Line"],    lat: 1.33767, lng: 103.83953, status: "operational" },
  { name: "Botanic Gardens",  code: "CC19", codes: ["CC19", "DT9"],       line: "Circle Line", lines: ["Circle Line", "Downtown Line"],               lat: 1.32211, lng: 103.81498, status: "operational" },
  { name: "Farrer Road",      code: "CC20", codes: ["CC20"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.31744, lng: 103.80738, status: "operational" },
  { name: "Holland Village",  code: "CC21", codes: ["CC21"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.31224, lng: 103.79640, status: "operational" },
  { name: "one-north",        code: "CC23", codes: ["CC23"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.29976, lng: 103.78746, status: "operational" },
  { name: "Kent Ridge",       code: "CC24", codes: ["CC24"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.29354, lng: 103.78457, status: "operational" },
  { name: "Haw Par Villa",    code: "CC25", codes: ["CC25"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.28257, lng: 103.78175, status: "operational" },
  { name: "Pasir Panjang",    code: "CC26", codes: ["CC26"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27621, lng: 103.79135, status: "operational" },
  { name: "Labrador Park",    code: "CC27", codes: ["CC27"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27225, lng: 103.80263, status: "operational" },
  { name: "Telok Blangah",    code: "CC28", codes: ["CC28"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27071, lng: 103.80976, status: "operational" },
  // Circle Line Extension (Marina Bay loop)
  { name: "Bayfront",         code: "CE1",  codes: ["CE1", "DT16"],       line: "Circle Line", lines: ["Circle Line Extension", "Downtown Line"],     lat: 1.28187, lng: 103.85908, status: "operational" },
  // CC30–CC33 (Keppel – Prince Edward Road – Marina Bay) — opened 2026
  { name: "Keppel",           code: "CC30", codes: ["CC30"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27200, lng: 103.82460, status: "operational" },
  { name: "Cantonment",       code: "CC31", codes: ["CC31"],              line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27350, lng: 103.83550, status: "operational" },
  { name: "Prince Edward Road", code: "CC32", codes: ["CC32"],           line: "Circle Line", lines: ["Circle Line"],                                lat: 1.27680, lng: 103.83990, status: "operational" },

  // ==========================================================================
  // DOWNTOWN LINE (DT) — Blue
  // ==========================================================================

  { name: "Bukit Panjang",    code: "DT1",  codes: ["DT1"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.37900, lng: 103.76154, status: "operational" },
  { name: "Cashew",           code: "DT2",  codes: ["DT2"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.36982, lng: 103.76444, status: "operational" },
  { name: "Hillview",         code: "DT3",  codes: ["DT3"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.36234, lng: 103.76742, status: "operational" },
  { name: "Beauty World",     code: "DT5",  codes: ["DT5"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.34122, lng: 103.77579, status: "operational" },
  { name: "King Albert Park", code: "DT6",  codes: ["DT6"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.33566, lng: 103.78340, status: "operational" },
  { name: "Sixth Avenue",     code: "DT7",  codes: ["DT7"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.33086, lng: 103.79691, status: "operational" },
  { name: "Tan Kah Kee",      code: "DT8",  codes: ["DT8"],               line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.32556, lng: 103.80776, status: "operational" },
  { name: "Stevens",          code: "DT10", codes: ["DT10", "TE11"],      line: "Downtown Line", lines: ["Downtown Line", "Thomson-East Coast Line"], lat: 1.32007, lng: 103.82602, status: "operational" },  // interchange: primary code DT10
  { name: "Rochor",           code: "DT13", codes: ["DT13"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.30385, lng: 103.85277, status: "operational" },
  { name: "Downtown",         code: "DT17", codes: ["DT17"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.27945, lng: 103.85284, status: "operational" },
  { name: "Telok Ayer",       code: "DT18", codes: ["DT18"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.28207, lng: 103.84865, status: "operational" },
  { name: "Fort Canning",     code: "DT20", codes: ["DT20"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.29248, lng: 103.84433, status: "operational" },
  { name: "Bencoolen",        code: "DT21", codes: ["DT21"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.29892, lng: 103.85035, status: "operational" },
  { name: "Jalan Besar",      code: "DT22", codes: ["DT22"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.30517, lng: 103.85530, status: "operational" },
  { name: "Bendemeer",        code: "DT23", codes: ["DT23"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.31367, lng: 103.86298, status: "operational" },
  { name: "Geylang Bahru",    code: "DT24", codes: ["DT24"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.32130, lng: 103.87162, status: "operational" },
  { name: "Mattar",           code: "DT25", codes: ["DT25"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.32688, lng: 103.88325, status: "operational" },
  { name: "Ubi",              code: "DT27", codes: ["DT27"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.32997, lng: 103.89923, status: "operational" },
  { name: "Kaki Bukit",       code: "DT28", codes: ["DT28"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.33497, lng: 103.90846, status: "operational" },
  { name: "Bedok North",      code: "DT29", codes: ["DT29"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.33474, lng: 103.91798, status: "operational" },
  { name: "Bedok Reservoir",  code: "DT30", codes: ["DT30"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.33661, lng: 103.93223, status: "operational" },
  { name: "Tampines West",    code: "DT31", codes: ["DT31"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.34552, lng: 103.93844, status: "operational" },
  { name: "Tampines East",    code: "DT33", codes: ["DT33"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.35619, lng: 103.95463, status: "operational" },
  { name: "Upper Changi",     code: "DT34", codes: ["DT34"],              line: "Downtown Line", lines: ["Downtown Line"],                            lat: 1.34174, lng: 103.96147, status: "operational" },

  // ==========================================================================
  // THOMSON-EAST COAST LINE (TE) — Brown
  // ==========================================================================

  // TEL Stage 1 (opened Jan 2020)
  { name: "Woodlands North",  code: "TE1",  codes: ["TE1"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.44829, lng: 103.78569, status: "operational" },
  { name: "Woodlands South",  code: "TE3",  codes: ["TE3"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.42941, lng: 103.79429, status: "operational" },

  // TEL Stage 2 (opened Aug 2021)
  { name: "Springleaf",       code: "TE4",  codes: ["TE4"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.39890, lng: 103.81892, status: "operational" },
  { name: "Lentor",           code: "TE5",  codes: ["TE5"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.38551, lng: 103.83574, status: "operational" },
  { name: "Mayflower",        code: "TE6",  codes: ["TE6"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.37060, lng: 103.83967, status: "operational" },
  { name: "Bright Hill",      code: "TE7",  codes: ["TE7"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.36166, lng: 103.83434, status: "operational" },
  { name: "Upper Thomson",    code: "TE8",  codes: ["TE8"],               line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.35406, lng: 103.83290, status: "operational" },

  // TEL Stage 3 (opened Nov 2022)
  // Note: Stevens (TE11/DT10) is listed under Downtown Line above with both codes.
  { name: "Napier",           code: "TE12", codes: ["TE12"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.30656, lng: 103.81812, status: "operational" },
  { name: "Orchard Boulevard", code: "TE13", codes: ["TE13"],            line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.30467, lng: 103.82438, status: "operational" },
  { name: "Maxwell",          code: "TE18", codes: ["TE18"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.27965, lng: 103.84433, status: "operational" },
  { name: "Shenton Way",      code: "TE19", codes: ["TE19"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.27772, lng: 103.85037, status: "operational" },

  // TEL Stage 4 (opened Jun 2024)
  { name: "Gardens by the Bay", code: "TE22", codes: ["TE22"],           line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.27849, lng: 103.86745, status: "operational" },
  { name: "Tanjong Rhu",      code: "TE23", codes: ["TE23"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.29651, lng: 103.87183, status: "operational" },
  { name: "Katong Park",      code: "TE24", codes: ["TE24"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.29780, lng: 103.87977, status: "operational" },
  { name: "Tanjong Katong",   code: "TE25", codes: ["TE25"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.29932, lng: 103.89737, status: "operational" },
  { name: "Marine Parade",    code: "TE26", codes: ["TE26"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.30275, lng: 103.90677, status: "operational" },
  { name: "Marine Terrace",   code: "TE27", codes: ["TE27"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.30677, lng: 103.91680, status: "operational" },
  { name: "Siglap",           code: "TE28", codes: ["TE28"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.31001, lng: 103.93003, status: "operational" },
  { name: "Bayshore",         code: "TE29", codes: ["TE29"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.31300, lng: 103.94136, status: "operational" },

  // TEL Stage 5 (under construction, expected 2026–2027)
  { name: "Bedok South",      code: "TE30", codes: ["TE30"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.31850, lng: 103.94500, status: "under-construction" },
  { name: "Sungei Bedok",     code: "TE31", codes: ["TE31"],              line: "Thomson-East Coast Line", lines: ["Thomson-East Coast Line"],         lat: 1.32500, lng: 103.94600, status: "under-construction" },

  // ==========================================================================
  // BUKIT PANJANG LRT (BP)
  // ==========================================================================
  // Note: BP1 Choa Chu Kang LRT is the interchange with NS4 (listed above under NS4).

  { name: "South View",       code: "BP2",  codes: ["BP2"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38030, lng: 103.74529, status: "operational" },
  { name: "Keat Hong",        code: "BP3",  codes: ["BP3"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37860, lng: 103.74906, status: "operational" },
  { name: "Teck Whye",        code: "BP4",  codes: ["BP4"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37668, lng: 103.75371, status: "operational" },
  { name: "Phoenix",          code: "BP5",  codes: ["BP5"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37862, lng: 103.75800, status: "operational" },
  { name: "Bukit Panjang LRT", code: "BP6", codes: ["BP6"],              line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37793, lng: 103.76310, status: "operational" },
  { name: "Petir",            code: "BP7",  codes: ["BP7"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37777, lng: 103.76665, status: "operational" },
  { name: "Pending",          code: "BP8",  codes: ["BP8"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.37614, lng: 103.77126, status: "operational" },
  { name: "Bangkit",          code: "BP9",  codes: ["BP9"],               line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38002, lng: 103.77265, status: "operational" },
  { name: "Fajar",            code: "BP10", codes: ["BP10"],              line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38452, lng: 103.77081, status: "operational" },
  { name: "Segar",            code: "BP11", codes: ["BP11"],              line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38779, lng: 103.76960, status: "operational" },
  { name: "Jelapang",         code: "BP12", codes: ["BP12"],              line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38674, lng: 103.76453, status: "operational" },
  { name: "Senja",            code: "BP13", codes: ["BP13"],              line: "Bukit Panjang LRT", lines: ["Bukit Panjang LRT"],                    lat: 1.38760, lng: 103.75890, status: "operational" },

  // ==========================================================================
  // SENGKANG LRT — East Loop (SE) & West Loop (SW)
  // ==========================================================================
  // Note: STC Sengkang interchange listed under NE16 above.

  { name: "Compassvale",      code: "SE1",  codes: ["SE1"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39449, lng: 103.90049, status: "operational" },
  { name: "Rumbia",           code: "SE2",  codes: ["SE2"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39147, lng: 103.90597, status: "operational" },
  { name: "Bakau",            code: "SE3",  codes: ["SE3"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.38799, lng: 103.90541, status: "operational" },
  { name: "Kangkar",          code: "SE4",  codes: ["SE4"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.38396, lng: 103.90223, status: "operational" },
  { name: "Ranggung",         code: "SE5",  codes: ["SE5"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.38423, lng: 103.89719, status: "operational" },
  { name: "Cheng Lim",        code: "SW1",  codes: ["SW1"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39628, lng: 103.89380, status: "operational" },
  { name: "Farmway",          code: "SW2",  codes: ["SW2"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39717, lng: 103.88930, status: "operational" },
  { name: "Kupang",           code: "SW3",  codes: ["SW3"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39821, lng: 103.88126, status: "operational" },
  { name: "Thanggam",         code: "SW4",  codes: ["SW4"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39732, lng: 103.87564, status: "operational" },
  { name: "Fernvale",         code: "SW5",  codes: ["SW5"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39189, lng: 103.87631, status: "operational" },
  { name: "Layar",            code: "SW6",  codes: ["SW6"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.39208, lng: 103.88003, status: "operational" },
  { name: "Tongkang",         code: "SW7",  codes: ["SW7"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.38935, lng: 103.88584, status: "operational" },
  { name: "Renjong",          code: "SW8",  codes: ["SW8"],               line: "Sengkang LRT", lines: ["Sengkang LRT"],                              lat: 1.38672, lng: 103.89054, status: "operational" },

  // ==========================================================================
  // PUNGGOL LRT — East Loop (PE) & West Loop (PW)
  // ==========================================================================
  // Note: PTC Punggol interchange listed under NE17 above.

  { name: "Cove",             code: "PE1",  codes: ["PE1"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.39928, lng: 103.90596, status: "operational" },
  { name: "Meridian",         code: "PE2",  codes: ["PE2"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.39691, lng: 103.90895, status: "operational" },
  { name: "Coral Edge",       code: "PE3",  codes: ["PE3"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.39391, lng: 103.91258, status: "operational" },
  { name: "Riviera",          code: "PE4",  codes: ["PE4"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.39452, lng: 103.91617, status: "operational" },
  { name: "Kadaloor",         code: "PE5",  codes: ["PE5"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.39951, lng: 103.91657, status: "operational" },
  { name: "Oasis",            code: "PE6",  codes: ["PE6"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.40229, lng: 103.91273, status: "operational" },
  { name: "Damai",            code: "PE7",  codes: ["PE7"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.40523, lng: 103.90860, status: "operational" },
  { name: "Sam Kee",          code: "PW1",  codes: ["PW1"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.40961, lng: 103.90483, status: "operational" },
  { name: "Teck Lee",         code: "PW2",  codes: ["PW2"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.41277, lng: 103.90658, status: "operational" },
  { name: "Punggol Point",    code: "PW3",  codes: ["PW3"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.41685, lng: 103.90665, status: "operational" },
  { name: "Samudera",         code: "PW4",  codes: ["PW4"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.41590, lng: 103.90216, status: "operational" },
  { name: "Nibong",           code: "PW5",  codes: ["PW5"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.41187, lng: 103.90031, status: "operational" },
  { name: "Sumang",           code: "PW6",  codes: ["PW6"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.40845, lng: 103.89856, status: "operational" },
  { name: "Soo Teck",         code: "PW7",  codes: ["PW7"],               line: "Punggol LRT", lines: ["Punggol LRT"],                                lat: 1.40509, lng: 103.89721, status: "operational" },

  // ==========================================================================
  // CROSS ISLAND LINE (CR) — Under Construction, expected 2030
  // ==========================================================================

  { name: "Aviation Park",    code: "CR1",  codes: ["CR1"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.35980, lng: 103.98010, status: "under-construction" },
  { name: "Loyang",           code: "CR2",  codes: ["CR2"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.36920, lng: 103.97020, status: "under-construction" },
  { name: "Pasir Ris (CRL)",  code: "CR3",  codes: ["CR3"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.37248, lng: 103.94944, status: "under-construction" },
  { name: "Tampines North",   code: "CR4",  codes: ["CR4"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.36500, lng: 103.93620, status: "under-construction" },
  { name: "Defu",             code: "CR5",  codes: ["CR5"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.35980, lng: 103.90920, status: "under-construction" },
  { name: "Hougang (CRL)",    code: "CR6",  codes: ["CR6"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.37730, lng: 103.89640, status: "under-construction" },
  { name: "Serangoon North",  code: "CR7",  codes: ["CR7"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.37320, lng: 103.87400, status: "under-construction" },
  { name: "Tavistock",        code: "CR8",  codes: ["CR8"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.36510, lng: 103.86150, status: "under-construction" },
  { name: "Ang Mo Kio (CRL)", code: "CR9",  codes: ["CR9"],               line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.36950, lng: 103.84920, status: "under-construction" },
  { name: "Toa Payoh West",   code: "CR10", codes: ["CR10"],              line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.34670, lng: 103.84060, status: "under-construction" },
  { name: "Caldecott (CRL)", code: "CR11",  codes: ["CR11"],              line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.33770, lng: 103.83953, status: "under-construction" },
  { name: "Bukit Timah",      code: "CR12", codes: ["CR12"],              line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.34150, lng: 103.79670, status: "under-construction" },
  { name: "King Albert Park (CRL)", code: "CR13", codes: ["CR13"],        line: "Cross Island Line", lines: ["Cross Island Line"],                    lat: 1.33570, lng: 103.78340, status: "under-construction" },

  // ==========================================================================
  // JURONG REGION LINE (JRL) — Under Construction, expected 2028–2029
  // ==========================================================================

  // JRL Main Branch (JS)
  { name: "Choa Chu Kang (JRL)", code: "JS1", codes: ["JS1"],            line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.38600, lng: 103.74440, status: "under-construction" },
  { name: "Choa Chu Kang West", code: "JS2", codes: ["JS2"],             line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.38800, lng: 103.73600, status: "under-construction" },
  { name: "Tengah",           code: "JS3",  codes: ["JS3"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.37800, lng: 103.73000, status: "under-construction" },
  { name: "Hong Kah",         code: "JS4",  codes: ["JS4"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.36520, lng: 103.72380, status: "under-construction" },
  { name: "Corporation",      code: "JS5",  codes: ["JS5"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.35370, lng: 103.72070, status: "under-construction" },
  { name: "Jurong West",      code: "JS6",  codes: ["JS6"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.34910, lng: 103.71100, status: "under-construction" },
  { name: "Bahar Junction",   code: "JS7",  codes: ["JS7"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.34170, lng: 103.70770, status: "under-construction" },
  { name: "Boon Lay (JRL)",   code: "JS8",  codes: ["JS8"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.33870, lng: 103.70610, status: "under-construction" },
  { name: "Enterprise",       code: "JS9",  codes: ["JS9"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.32940, lng: 103.70560, status: "under-construction" },
  { name: "Tukang",           code: "JS10", codes: ["JS10"],              line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.32020, lng: 103.71370, status: "under-construction" },
  { name: "Jurong Hill",      code: "JS11", codes: ["JS11"],              line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.31350, lng: 103.71810, status: "under-construction" },
  { name: "Jurong Pier",      code: "JS12", codes: ["JS12"],              line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.30750, lng: 103.72130, status: "under-construction" },

  // JRL East Branch (JE)
  { name: "Tengah Plantation", code: "JE1", codes: ["JE1"],              line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.37350, lng: 103.74470, status: "under-construction" },
  { name: "Tengah Park",      code: "JE2",  codes: ["JE2"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.36580, lng: 103.74150, status: "under-construction" },
  { name: "Bukit Batok West", code: "JE3",  codes: ["JE3"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.35440, lng: 103.74370, status: "under-construction" },
  { name: "Toh Guan",         code: "JE4",  codes: ["JE4"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.34310, lng: 103.74540, status: "under-construction" },
  { name: "Jurong East (JRL)", code: "JE5", codes: ["JE5"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.33315, lng: 103.74229, status: "under-construction" },
  { name: "Jurong Town Hall", code: "JE6",  codes: ["JE6"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.32790, lng: 103.74100, status: "under-construction" },
  { name: "Pandan Reservoir", code: "JE7",  codes: ["JE7"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.32090, lng: 103.73730, status: "under-construction" },

  // JRL West Branch (JW)
  { name: "Lok Yang",         code: "JW2",  codes: ["JW2"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.32770, lng: 103.69760, status: "under-construction" },
  { name: "Gul Circle (JRL)", code: "JW3",  codes: ["JW3"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.31950, lng: 103.66050, status: "under-construction" },
  { name: "Tawas",            code: "JW4",  codes: ["JW4"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.31530, lng: 103.65260, status: "under-construction" },
  { name: "Nanyang Gateway",  code: "JW5",  codes: ["JW5"],               line: "Jurong Region Line", lines: ["Jurong Region Line"],                  lat: 1.34720, lng: 103.68780, status: "under-construction" },
];

// ---------------------------------------------------------------------------
// Proximity Functions
// ---------------------------------------------------------------------------

/**
 * Determine the MRT premium tier and percentage for a given distance.
 * Under-construction stations receive half the premium of operational ones.
 */
export function getMrtPremiumPercent(
  distanceMeters: number,
  status: MrtStation["status"],
): { tier: MrtProximityResult["premiumTier"]; percent: number } {
  for (const t of MRT_PREMIUM_TIERS) {
    if (distanceMeters <= t.maxMeters) {
      const midpoint = (t.minPercent + t.maxPercent) / 2;
      const percent = status === "under-construction" ? midpoint * 0.5 : midpoint;
      return { tier: t.tier, percent };
    }
  }
  return { tier: "baseline", percent: 0 };
}

/**
 * Find the nearest MRT station to a given lat/lng coordinate.
 * Returns proximity details including distance, walking time, and premium tier.
 */
export function findNearestMrt(
  lat: number,
  lng: number,
  stations: MrtStation[] = MRT_STATIONS,
): MrtProximityResult | null {
  if (stations.length === 0) return null;

  let nearest: MrtStation = stations[0];
  let minDist = Infinity;

  for (const station of stations) {
    const dist = haversineMeters(lat, lng, station.lat, station.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }

  const distRounded = Math.round(minDist);
  const { tier, percent } = getMrtPremiumPercent(distRounded, nearest.status);

  return {
    station: nearest,
    distanceMeters: distRounded,
    walkingMinutes: walkingMinutes(distRounded),
    premiumTier: tier,
    premiumPercent: percent,
  };
}
