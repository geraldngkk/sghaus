import type { PrimarySchool, SchoolProximityResult } from "@/types";
import { haversineMeters, walkingMinutes } from "./geo";

// ---------------------------------------------------------------------------
// School Premium Tiers
// ---------------------------------------------------------------------------
// Within 1 km of a desirable school commands a property premium ("1 km rule").
// MOE P1 registration gives priority to families living within 1 km, and
// a secondary benefit for 1–2 km. Beyond 2 km there is no registration
// advantage and therefore no measurable price premium.
// ---------------------------------------------------------------------------

const SCHOOL_PREMIUM_TIERS = {
  A: { within1km: { minPercent: 0.05, maxPercent: 0.10 }, within2km: { minPercent: 0.025, maxPercent: 0.05 } },
  B: { within1km: { minPercent: 0.03, maxPercent: 0.06 }, within2km: { minPercent: 0.015, maxPercent: 0.03 } },
  C: { within1km: { minPercent: 0.01, maxPercent: 0.03 }, within2km: { minPercent: 0.005, maxPercent: 0.015 } },
  D: { within1km: { minPercent: 0, maxPercent: 0 }, within2km: { minPercent: 0, maxPercent: 0 } },
  E: { within1km: { minPercent: 0, maxPercent: 0 }, within2km: { minPercent: 0, maxPercent: 0 } },
} as const;

/** Maximum compound bonus when multiple desirable schools overlap within 1 km. */
const MAX_COMPOUND_BONUS = 0.03;

// ---------------------------------------------------------------------------
// Complete Primary School Dataset (182 schools)
// ---------------------------------------------------------------------------
// Sources:
//   - MOE School Information Service (school-information.moe.gov.sg)
//   - KiasuParents P1 Registration data (2024/2025 exercises)
//   - OneMap geocoding API
// Coordinates: WGS84 decimal degrees (lat/lng)
// Desirability score: 0–100 composite of demand + attribute factors
// Last updated: 2026-02-25
// ---------------------------------------------------------------------------

export const PRIMARY_SCHOOLS: PrimarySchool[] = [

  // === TIER A — Elite ===

  { name: "NAN HUA PRIMARY SCHOOL", postalCode: "128806", lat: 1.31920159956387, lng: 103.761095065761, area: "CLEMENTI", zone: "WEST", sap: true, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 100, tier: "A" },
  { name: "NANYANG PRIMARY SCHOOL", postalCode: "268097", lat: 1.32107094241153, lng: 103.807681852799, area: "BUKIT TIMAH", zone: "WEST", sap: true, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 85, tier: "A" },
  { name: "ST. HILDA'S PRIMARY SCHOOL", postalCode: "529706", lat: 1.34938565036336, lng: 103.937007133662, area: "TAMPINES", zone: "EAST", sap: false, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 84, tier: "A" },
  { name: "TAO NAN SCHOOL", postalCode: "449761", lat: 1.30528528687321, lng: 103.911553152326, area: "MARINE PARADE", zone: "EAST", sap: true, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 80, tier: "A" },
  { name: "CATHOLIC HIGH SCHOOL (PRIMARY)", postalCode: "579837", lat: 1.35042215656701, lng: 103.848826189269, area: "BISHAN", zone: "SOUTH", sap: true, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 79, tier: "A" },
  { name: "HOLY INNOCENTS' PRIMARY SCHOOL", postalCode: "536451", lat: 1.36693830877349, lng: 103.894114899795, area: "HOUGANG", zone: "SOUTH", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 76, tier: "A" },
  { name: "POI CHING SCHOOL", postalCode: "529067", lat: 1.35765121877679, lng: 103.935246486174, area: "TAMPINES", zone: "EAST", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 76, tier: "A" },
  { name: "AI TONG SCHOOL", postalCode: "579646", lat: 1.36058343005814, lng: 103.83302033725, area: "BISHAN", zone: "SOUTH", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 75, tier: "A" },

  // === TIER B — Popular ===

  { name: "PEI HWA PRESBYTERIAN PRIMARY SCHOOL", postalCode: "597610", lat: 1.33807302121151, lng: 103.776250903095, area: "BUKIT TIMAH", zone: "WEST", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 70, tier: "B" },
  { name: "KONG HWA SCHOOL", postalCode: "399772", lat: 1.31099674009193, lng: 103.888352029067, area: "GEYLANG", zone: "EAST", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 69, tier: "B" },
  { name: "NAN CHIAU PRIMARY SCHOOL", postalCode: "545080", lat: 1.39221149906592, lng: 103.891180928186, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 69, tier: "B" },
  { name: "CHIJ ST. NICHOLAS GIRLS' SCHOOL (PRIMARY)", postalCode: "569405", lat: 1.37348, lng: 103.83425, area: "ANG MO KIO", zone: "SOUTH", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 69, tier: "B" },
  { name: "MARIS STELLA HIGH SCHOOL (PRIMARY)", postalCode: "368051", lat: 1.34139, lng: 103.87782, area: "TOA PAYOH", zone: "SOUTH", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 69, tier: "B" },
  { name: "PEI CHUN PUBLIC SCHOOL", postalCode: "319320", lat: 1.33677864390672, lng: 103.855341310212, area: "TOA PAYOH", zone: "SOUTH", sap: true, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 67, tier: "B" },
  { name: "ROSYTH SCHOOL", postalCode: "555855", lat: 1.3728583654058, lng: 103.87477170399, area: "SERANGOON", zone: "NORTH", sap: false, gep: true, affiliated: false, missionSchool: false, desirabilityScore: 66, tier: "B" },
  { name: "CHONGFU SCHOOL", postalCode: "768959", lat: 1.43846230429529, lng: 103.839070714229, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 65, tier: "B" },
  { name: "HENRY PARK PRIMARY SCHOOL", postalCode: "278790", lat: 1.31674735173514, lng: 103.784129850316, area: "BUKIT TIMAH", zone: "WEST", sap: false, gep: true, affiliated: true, missionSchool: false, desirabilityScore: 64, tier: "B" },
  { name: "CHIJ PRIMARY (TOA PAYOH)", postalCode: "319765", lat: 1.33275264711587, lng: 103.841847263786, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 63, tier: "B" },
  { name: "ANGLO-CHINESE SCHOOL (PRIMARY)", postalCode: "309918", lat: 1.31871860621788, lng: 103.83534516884, area: "NOVENA", zone: "SOUTH", sap: false, gep: true, affiliated: true, missionSchool: true, desirabilityScore: 61, tier: "B" },
  { name: "FAIRFIELD METHODIST SCHOOL (PRIMARY)", postalCode: "139648", lat: 1.30100441916733, lng: 103.785455606827, area: "QUEENSTOWN", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 61, tier: "B" },
  { name: "HONG WEN SCHOOL", postalCode: "327829", lat: 1.32175581103999, lng: 103.857733816796, area: "KALLANG", zone: "SOUTH", sap: true, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 61, tier: "B" },
  { name: "KUO CHUAN PRESBYTERIAN PRIMARY SCHOOL", postalCode: "579793", lat: 1.34939813669536, lng: 103.855018233311, area: "BISHAN", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 61, tier: "B" },
  { name: "PRINCESS ELIZABETH PRIMARY SCHOOL", postalCode: "659163", lat: 1.34919098857585, lng: 103.740719208011, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 60, tier: "B" },
  { name: "RED SWASTIKA SCHOOL", postalCode: "469719", lat: 1.33367448359173, lng: 103.93450966846, area: "BEDOK", zone: "EAST", sap: true, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 59, tier: "B" },
  { name: "SINGAPORE CHINESE GIRLS' PRIMARY SCHOOL", postalCode: "309437", lat: 1.32080725235992, lng: 103.827744749548, area: "NOVENA", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 59, tier: "B" },
  { name: "ST ANDREW'S SCHOOL (JUNIOR)", postalCode: "359337", lat: 1.33140255308868, lng: 103.865117134385, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 59, tier: "B" },
  { name: "PAYA LEBAR METHODIST GIRLS' SCHOOL (PRIMARY)", postalCode: "536741", lat: 1.34947276268396, lng: 103.884971343143, area: "HOUGANG", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 58, tier: "B" },

  // === TIER C — In-Demand ===

  { name: "RAFFLES GIRLS' PRIMARY SCHOOL", postalCode: "289072", lat: 1.33004178068277, lng: 103.806397828938, area: "BUKIT TIMAH", zone: "SOUTH", sap: false, gep: true, affiliated: true, missionSchool: false, desirabilityScore: 54, tier: "C" },
  { name: "ANGLO-CHINESE SCHOOL (JUNIOR)", postalCode: "227988", lat: 1.30932252730174, lng: 103.841552127373, area: "CENTRAL", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 52, tier: "C" },
  { name: "MAHA BODHI SCHOOL", postalCode: "408931", lat: 1.32858023873554, lng: 103.901306904157, area: "GEYLANG", zone: "EAST", sap: true, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 52, tier: "C" },
  { name: "SOUTH VIEW PRIMARY SCHOOL", postalCode: "689762", lat: 1.38143123987698, lng: 103.747153671, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 52, tier: "C" },
  { name: "NORTHLAND PRIMARY SCHOOL", postalCode: "769026", lat: 1.42096989918951, lng: 103.840928424929, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 51, tier: "C" },
  { name: "RULANG PRIMARY SCHOOL", postalCode: "649295", lat: 1.34718953201213, lng: 103.718786145011, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 51, tier: "C" },
  { name: "ST. ANTHONY'S CANOSSIAN PRIMARY SCHOOL", postalCode: "469701", lat: 1.3351714044028, lng: 103.940544723873, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 51, tier: "C" },
  { name: "METHODIST GIRLS' SCHOOL (PRIMARY)", postalCode: "599986", lat: 1.33266213599636, lng: 103.783382114018, area: "BUKIT TIMAH", zone: "WEST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 50, tier: "C" },
  { name: "ST. JOSEPH'S INSTITUTION JUNIOR", postalCode: "309331", lat: 1.31781476118551, lng: 103.845633334522, area: "NOVENA", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 49, tier: "C" },
  { name: "ST. MARGARET'S SCHOOL (PRIMARY)", postalCode: "228197", lat: 1.30414407358332, lng: 103.845820266438, area: "CENTRAL", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 44, tier: "C" },
  { name: "ANGSANA PRIMARY SCHOOL", postalCode: "528565", lat: 1.36360590588314, lng: 103.9389409004, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 39, tier: "C" },
  { name: "WELLINGTON PRIMARY SCHOOL", postalCode: "757702", lat: 1.45189083282189, lng: 103.822341940714, area: "SEMBAWANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 39, tier: "C" },
  { name: "BUKIT PANJANG PRIMARY SCHOOL", postalCode: "679676", lat: 1.37350089986584, lng: 103.769417337654, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 38, tier: "C" },
  { name: "GONGSHANG PRIMARY SCHOOL", postalCode: "529176", lat: 1.35723721393297, lng: 103.949115320172, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 38, tier: "C" },
  { name: "MEE TOH SCHOOL", postalCode: "828867", lat: 1.39485356081865, lng: 103.90857257736, area: "PUNGGOL", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 37, tier: "C" },
  { name: "SENGKANG GREEN PRIMARY SCHOOL", postalCode: "797636", lat: 1.39284606680477, lng: 103.875217666486, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 37, tier: "C" },
  { name: "TEMASEK PRIMARY SCHOOL", postalCode: "469300", lat: 1.31770677551333, lng: 103.945590669163, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 37, tier: "C" },
  { name: "CHIJ OUR LADY OF THE NATIVITY", postalCode: "534793", lat: 1.37330297140128, lng: 103.897575728303, area: "HOUGANG", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 36, tier: "C" },
  { name: "FRONTIER PRIMARY SCHOOL", postalCode: "648200", lat: 1.3366431119298, lng: 103.699682818103, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 36, tier: "C" },
  { name: "XINMIN PRIMARY SCHOOL", postalCode: "538784", lat: 1.37176798317468, lng: 103.88280991785, area: "HOUGANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 36, tier: "C" },
  { name: "ADMIRALTY PRIMARY SCHOOL", postalCode: "738907", lat: 1.4426347903311, lng: 103.800040119743, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 35, tier: "C" },
  { name: "SHUQUN PRIMARY SCHOOL", postalCode: "649332", lat: 1.34765311431632, lng: 103.721523713379, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 35, tier: "C" },

  // === TIER D — Moderate ===

  { name: "PASIR RIS PRIMARY SCHOOL", postalCode: "518968", lat: 1.37245132722087, lng: 103.962922699031, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 34, tier: "D" },
  { name: "PUNGGOL GREEN PRIMARY SCHOOL", postalCode: "828772", lat: 1.40172590450528, lng: 103.898794262307, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 34, tier: "D" },
  { name: "HORIZON PRIMARY SCHOOL", postalCode: "828819", lat: 1.40000881091199, lng: 103.91307153053, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 33, tier: "D" },
  { name: "KEMING PRIMARY SCHOOL", postalCode: "659762", lat: 1.34552849960874, lng: 103.756449399351, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 33, tier: "D" },
  { name: "NORTH VIEW PRIMARY SCHOOL", postalCode: "768960", lat: 1.42752327193727, lng: 103.848190787869, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 33, tier: "D" },
  { name: "WESTWOOD PRIMARY SCHOOL", postalCode: "649188", lat: 1.34715462510442, lng: 103.700526720098, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 33, tier: "D" },
  { name: "DAZHONG PRIMARY SCHOOL", postalCode: "659441", lat: 1.35906257616677, lng: 103.748122250254, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 32, tier: "D" },
  { name: "HUAMIN PRIMARY SCHOOL", postalCode: "768857", lat: 1.42697284512936, lng: 103.844240226564, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 32, tier: "D" },
  { name: "ALEXANDRA PRIMARY SCHOOL", postalCode: "159016", lat: 1.2912990413487, lng: 103.823940802388, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 31, tier: "D" },
  { name: "ELIAS PARK PRIMARY SCHOOL", postalCode: "518866", lat: 1.37451269377776, lng: 103.945128117139, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 31, tier: "D" },
  { name: "HOUGANG PRIMARY SCHOOL", postalCode: "534238", lat: 1.37737530954806, lng: 103.880900019698, area: "HOUGANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 31, tier: "D" },
  { name: "VALOUR PRIMARY SCHOOL", postalCode: "828728", lat: 1.40744168163777, lng: 103.898762173662, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "CHUA CHU KANG PRIMARY SCHOOL", postalCode: "689905", lat: 1.37775890093367, lng: 103.741832917421, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "COMPASSVALE PRIMARY SCHOOL", postalCode: "545091", lat: 1.39443093598545, lng: 103.897904958974, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "NORTHSHORE PRIMARY SCHOOL", postalCode: "828671", lat: 1.41842322079348, lng: 103.905147201163, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "RIVERSIDE PRIMARY SCHOOL", postalCode: "737803", lat: 1.44704733609149, lng: 103.801938959313, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "RIVERVALE PRIMARY SCHOOL", postalCode: "545092", lat: 1.39333506298213, lng: 103.904545253288, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "YU NENG PRIMARY SCHOOL", postalCode: "469623", lat: 1.33398037894072, lng: 103.932015036296, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 30, tier: "D" },
  { name: "PUNGGOL PRIMARY SCHOOL", postalCode: "538787", lat: 1.37820062547641, lng: 103.894667159512, area: "HOUGANG", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 29, tier: "D" },
  { name: "WEST SPRING PRIMARY SCHOOL", postalCode: "679946", lat: 1.38896618016838, lng: 103.766256126816, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 29, tier: "D" },
  { name: "QIFA PRIMARY SCHOOL", postalCode: "128104", lat: 1.3132658326807, lng: 103.756629101811, area: "CLEMENTI", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 26, tier: "D" },
  { name: "RADIN MAS PRIMARY SCHOOL", postalCode: "99840", lat: 1.27489701529771, lng: 103.824115781658, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 26, tier: "D" },
  { name: "TANJONG KATONG PRIMARY SCHOOL", postalCode: "437259", lat: 1.30498489044822, lng: 103.899999965407, area: "MARINE PARADE", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 26, tier: "D" },
  { name: "YANGZHENG PRIMARY SCHOOL", postalCode: "556108", lat: 1.3489768083841, lng: 103.868467129954, area: "SERANGOON", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 26, tier: "D" },
  { name: "CHONGZHENG PRIMARY SCHOOL", postalCode: "529392", lat: 1.35061130568554, lng: 103.951317297552, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 25, tier: "D" },
  { name: "SEMBAWANG PRIMARY SCHOOL", postalCode: "757715", lat: 1.4450436428697, lng: 103.82102151409, area: "SEMBAWANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 25, tier: "D" },
  { name: "CANBERRA PRIMARY SCHOOL", postalCode: "757714", lat: 1.45123288382933, lng: 103.81588941317, area: "SEMBAWANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 24, tier: "D" },
  { name: "JING SHAN PRIMARY SCHOOL", postalCode: "569228", lat: 1.37196445720109, lng: 103.851763531681, area: "ANG MO KIO", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 24, tier: "D" },
  { name: "JUNYUAN PRIMARY SCHOOL", postalCode: "528906", lat: 1.34787074766746, lng: 103.939221709073, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 24, tier: "D" },
  { name: "NAVAL BASE PRIMARY SCHOOL", postalCode: "769028", lat: 1.41629226758972, lng: 103.838858273963, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 24, tier: "D" },
  { name: "RIVER VALLEY PRIMARY SCHOOL", postalCode: "237993", lat: 1.29418347842837, lng: 103.836018941571, area: "CENTRAL", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 23, tier: "D" },
  { name: "FENGSHAN PRIMARY SCHOOL", postalCode: "469680", lat: 1.32980598760785, lng: 103.931710293058, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 19, tier: "D" },
  { name: "ANDERSON PRIMARY SCHOOL", postalCode: "569785", lat: 1.38419941907925, lng: 103.841411716006, area: "ANG MO KIO", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 18, tier: "D" },
  { name: "CANOSSA CATHOLIC PRIMARY SCHOOL", postalCode: "387621", lat: 1.32664424544839, lng: 103.882227964852, area: "GEYLANG", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "CHIJ (KATONG) PRIMARY", postalCode: "424821", lat: 1.30648535277087, lng: 103.911105620496, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "CHIJ (KELLOCK)", postalCode: "99757", lat: 1.27474048872023, lng: 103.827954007978, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "CHIJ OUR LADY OF GOOD COUNSEL", postalCode: "558979", lat: 1.35742952269615, lng: 103.864009397373, area: "SERANGOON", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "CHIJ OUR LADY QUEEN OF PEACE", postalCode: "679287", lat: 1.36649865720247, lng: 103.767457467964, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "GEYLANG METHODIST SCHOOL (PRIMARY)", postalCode: "389706", lat: 1.31759126757284, lng: 103.883845744916, area: "GEYLANG", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "NGEE ANN PRIMARY SCHOOL", postalCode: "449149", lat: 1.30552505910497, lng: 103.917463017497, area: "MARINE PARADE", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "OASIS PRIMARY SCHOOL", postalCode: "828716", lat: 1.40462413200793, lng: 103.911120600638, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 18, tier: "D" },
  { name: "ST. GABRIEL'S PRIMARY SCHOOL", postalCode: "556742", lat: 1.34930766795555, lng: 103.862309899986, area: "SERANGOON", zone: "SOUTH", sap: false, gep: false, affiliated: true, missionSchool: true, desirabilityScore: 18, tier: "D" },
  { name: "WATERWAY PRIMARY SCHOOL", postalCode: "828802", lat: 1.39889261226315, lng: 103.918585924582, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 18, tier: "D" },
  { name: "TAMPINES PRIMARY SCHOOL", postalCode: "529426", lat: 1.34994333795888, lng: 103.943402379754, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 17, tier: "D" },
  { name: "ZHANGDE PRIMARY SCHOOL", postalCode: "169485", lat: 1.28421153855474, lng: 103.825951884637, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 16, tier: "D" },

  // === TIER E — Baseline ===

  { name: "HAIG GIRLS' SCHOOL", postalCode: "427072", lat: 1.31173085411355, lng: 103.903061519804, area: "GEYLANG", zone: "EAST", sap: false, gep: false, affiliated: true, missionSchool: false, desirabilityScore: 10, tier: "E" },
  { name: "DE LA SALLE SCHOOL", postalCode: "689285", lat: 1.3947078296399, lng: 103.743201812831, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "KHENG CHENG SCHOOL", postalCode: "319580", lat: 1.33728818369962, lng: 103.847141122849, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "MARYMOUNT CONVENT SCHOOL", postalCode: "297754", lat: 1.34043840661368, lng: 103.839811736775, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "MONTFORT JUNIOR SCHOOL", postalCode: "538786", lat: 1.37362445234082, lng: 103.889741457901, area: "HOUGANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "ST. ANTHONY'S PRIMARY SCHOOL", postalCode: "659401", lat: 1.36411948475833, lng: 103.749251919049, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "ST. STEPHEN'S SCHOOL", postalCode: "455789", lat: 1.31878279235375, lng: 103.917372254203, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: true, desirabilityScore: 8, tier: "E" },
  { name: "AHMAD IBRAHIM PRIMARY SCHOOL", postalCode: "768643", lat: 1.43341408412245, lng: 103.832750468895, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "ANCHOR GREEN PRIMARY SCHOOL", postalCode: "544969", lat: 1.39036998654612, lng: 103.887165375933, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "ANG MO KIO PRIMARY SCHOOL", postalCode: "569920", lat: 1.36909205812692, lng: 103.839041363152, area: "ANG MO KIO", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BEACON PRIMARY SCHOOL", postalCode: "679944", lat: 1.38394936211823, lng: 103.773632022975, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BEDOK GREEN PRIMARY SCHOOL", postalCode: "469317", lat: 1.32399627990304, lng: 103.937745023577, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BENDEMEER PRIMARY SCHOOL", postalCode: "339948", lat: 1.32220848530291, lng: 103.865351336085, area: "KALLANG", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BLANGAH RISE PRIMARY SCHOOL", postalCode: "109100", lat: 1.27614522920998, lng: 103.80861316604, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BOON LAY GARDEN PRIMARY SCHOOL", postalCode: "649930", lat: 1.34284013791617, lng: 103.712858381937, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BUKIT TIMAH PRIMARY SCHOOL", postalCode: "598112", lat: 1.3377498622588, lng: 103.766855344779, area: "BUKIT TIMAH", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "BUKIT VIEW PRIMARY SCHOOL", postalCode: "659634", lat: 1.34586054788695, lng: 103.75366641455, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CANTONMENT PRIMARY SCHOOL", postalCode: "88256", lat: 1.27547252623201, lng: 103.839962631748, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CASUARINA PRIMARY SCHOOL", postalCode: "518935", lat: 1.37246063927999, lng: 103.957020286115, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CEDAR PRIMARY SCHOOL", postalCode: "349700", lat: 1.33566084356265, lng: 103.87562006259, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CHANGKAT PRIMARY SCHOOL", postalCode: "529896", lat: 1.34023163951633, lng: 103.952080114035, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CLEMENTI PRIMARY SCHOOL", postalCode: "129903", lat: 1.31506321827875, lng: 103.763144493687, area: "CLEMENTI", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CONCORD PRIMARY SCHOOL", postalCode: "689814", lat: 1.38026516111464, lng: 103.736554295636, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "CORPORATION PRIMARY SCHOOL", postalCode: "648347", lat: 1.35148548772662, lng: 103.707578404944, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "DAMAI PRIMARY SCHOOL", postalCode: "479226", lat: 1.33524602829747, lng: 103.921286435321, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "EAST SPRING PRIMARY SCHOOL", postalCode: "529258", lat: 1.35268400746357, lng: 103.961676849165, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "EDGEFIELD PRIMARY SCHOOL", postalCode: "828869", lat: 1.40009139510996, lng: 103.907847599114, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "ENDEAVOUR PRIMARY SCHOOL", postalCode: "757521", lat: 1.45403837499301, lng: 103.817436231731, area: "SEMBAWANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "EVERGREEN PRIMARY SCHOOL", postalCode: "738908", lat: 1.44415332824735, lng: 103.794577787757, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FARRER PARK PRIMARY SCHOOL", postalCode: "217567", lat: 1.31236867681371, lng: 103.850766402965, area: "KALLANG", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FERN GREEN PRIMARY SCHOOL", postalCode: "797538", lat: 1.39744694871873, lng: 103.88012374173, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FERNVALE PRIMARY SCHOOL", postalCode: "797701", lat: 1.38997939874565, lng: 103.874100979909, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FIRST TOA PAYOH PRIMARY SCHOOL", postalCode: "319252", lat: 1.34032299499938, lng: 103.855529906182, area: "TOA PAYOH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FUCHUN PRIMARY SCHOOL", postalCode: "739063", lat: 1.43063975763573, lng: 103.778175192579, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "FUHUA PRIMARY SCHOOL", postalCode: "609647", lat: 1.33650394789627, lng: 103.736103745748, area: "JURONG EAST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "GAN ENG SENG PRIMARY SCHOOL", postalCode: "158901", lat: 1.28559516494962, lng: 103.815547410064, area: "BUKIT MERAH", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "GREENDALE PRIMARY SCHOOL", postalCode: "828848", lat: 1.39646367174598, lng: 103.912450421018, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "GREENRIDGE PRIMARY SCHOOL", postalCode: "677744", lat: 1.38593108948507, lng: 103.767803387989, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "GREENWOOD PRIMARY SCHOOL", postalCode: "737942", lat: 1.4401104867196, lng: 103.804515180606, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "INNOVA PRIMARY SCHOOL", postalCode: "737888", lat: 1.42927790140509, lng: 103.790592723808, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "JIEMIN PRIMARY SCHOOL", postalCode: "768515", lat: 1.42760611127302, lng: 103.830401099055, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "JURONG PRIMARY SCHOOL", postalCode: "609476", lat: 1.34843859698946, lng: 103.733156566858, area: "JURONG EAST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "JURONG WEST PRIMARY SCHOOL", postalCode: "648368", lat: 1.33971273175894, lng: 103.698743607058, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "KRANJI PRIMARY SCHOOL", postalCode: "689189", lat: 1.39418496446376, lng: 103.747412309639, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "LAKESIDE PRIMARY SCHOOL", postalCode: "618310", lat: 1.33837569571569, lng: 103.718096899655, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "LIANHUA PRIMARY SCHOOL", postalCode: "659243", lat: 1.35424191127295, lng: 103.754165828711, area: "BUKIT BATOK", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "MARSILING PRIMARY SCHOOL", postalCode: "738927", lat: 1.43392876015922, lng: 103.773637073788, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "MAYFLOWER PRIMARY SCHOOL", postalCode: "569878", lat: 1.37639873282244, lng: 103.843165756947, area: "ANG MO KIO", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "MERIDIAN PRIMARY SCHOOL", postalCode: "518798", lat: 1.37550677054835, lng: 103.934953276155, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "NEW TOWN PRIMARY SCHOOL", postalCode: "148812", lat: 1.29964188181021, lng: 103.80010216304, area: "QUEENSTOWN", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "NORTH SPRING PRIMARY SCHOOL", postalCode: "545088", lat: 1.38707582424175, lng: 103.903088569789, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "NORTH VISTA PRIMARY SCHOOL", postalCode: "544974", lat: 1.38289339218536, lng: 103.895854162476, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "NORTHOAKS PRIMARY SCHOOL", postalCode: "757622", lat: 1.45660782030102, lng: 103.814196981329, area: "SEMBAWANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "OPERA ESTATE PRIMARY SCHOOL", postalCode: "458436", lat: 1.31996876377748, lng: 103.923752668632, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PALM VIEW PRIMARY SCHOOL", postalCode: "544822", lat: 1.3838407564383, lng: 103.891215110737, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PARK VIEW PRIMARY SCHOOL", postalCode: "519524", lat: 1.37801687647812, lng: 103.9392021807, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PEI TONG PRIMARY SCHOOL", postalCode: "129857", lat: 1.31666529308968, lng: 103.767438999533, area: "CLEMENTI", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PEIYING PRIMARY SCHOOL", postalCode: "768687", lat: 1.41723339695904, lng: 103.830417090698, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PIONEER PRIMARY SCHOOL", postalCode: "699915", lat: 1.35442592930738, lng: 103.732790920197, area: "TENGAH", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PUNGGOL COVE PRIMARY SCHOOL", postalCode: "828674", lat: 1.41158455562454, lng: 103.89890448429, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "PUNGGOL VIEW PRIMARY SCHOOL", postalCode: "828845", lat: 1.40505250226058, lng: 103.905299026568, area: "PUNGGOL", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "QIHUA PRIMARY SCHOOL", postalCode: "738525", lat: 1.44203596557592, lng: 103.788339762066, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "QUEENSTOWN PRIMARY SCHOOL", postalCode: "149303", lat: 1.29552905587752, lng: 103.807648475656, area: "QUEENSTOWN", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "UNITY PRIMARY SCHOOL", postalCode: "688268", lat: 1.40278303219036, lng: 103.746801233973, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "SENG KANG PRIMARY SCHOOL", postalCode: "545166", lat: 1.38925044778224, lng: 103.899527879229, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "SI LING PRIMARY SCHOOL", postalCode: "739067", lat: 1.43240935732525, lng: 103.786035065192, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "SPRINGDALE PRIMARY SCHOOL", postalCode: "544799", lat: 1.39467010299293, lng: 103.889926221247, area: "SENG KANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "TAMPINES NORTH PRIMARY SCHOOL", postalCode: "529565", lat: 1.36048786025607, lng: 103.948768900518, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "TECK GHEE PRIMARY SCHOOL", postalCode: "569299", lat: 1.36565018546903, lng: 103.851009800453, area: "ANG MO KIO", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "TECK WHYE PRIMARY SCHOOL", postalCode: "688261", lat: 1.38388660469396, lng: 103.753924558586, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "TELOK KURAU PRIMARY SCHOOL", postalCode: "479239", lat: 1.33104585441349, lng: 103.910934011337, area: "BEDOK", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "TOWNSVILLE PRIMARY SCHOOL", postalCode: "569730", lat: 1.35994649477568, lng: 103.853768994775, area: "ANG MO KIO", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WEST GROVE PRIMARY SCHOOL", postalCode: "649223", lat: 1.3448790560014, lng: 103.699286360581, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WEST VIEW PRIMARY SCHOOL", postalCode: "677742", lat: 1.38378546546228, lng: 103.760273432258, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WHITE SANDS PRIMARY SCHOOL", postalCode: "519075", lat: 1.36563610941695, lng: 103.960861814678, area: "PASIR RIS", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WOODGROVE PRIMARY SCHOOL", postalCode: "738079", lat: 1.43310340168966, lng: 103.790604437613, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WOODLANDS PRIMARY SCHOOL", postalCode: "738853", lat: 1.43658270720199, lng: 103.791791282236, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "WOODLANDS RING PRIMARY SCHOOL", postalCode: "738240", lat: 1.43485179380236, lng: 103.79741434351, area: "WOODLANDS", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "XINGHUA PRIMARY SCHOOL", postalCode: "538882", lat: 1.35799653782463, lng: 103.890216355459, area: "HOUGANG", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "XINGNAN PRIMARY SCHOOL", postalCode: "649036", lat: 1.34270639669225, lng: 103.687588478681, area: "JURONG WEST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "XISHAN PRIMARY SCHOOL", postalCode: "768611", lat: 1.43347186049118, lng: 103.837755326519, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "YEW TEE PRIMARY SCHOOL", postalCode: "689100", lat: 1.39672603497195, lng: 103.751817992962, area: "CHOA CHU KANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "YIO CHU KANG PRIMARY SCHOOL", postalCode: "538720", lat: 1.37793264345276, lng: 103.885643682171, area: "HOUGANG", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "YISHUN PRIMARY SCHOOL", postalCode: "768679", lat: 1.43397617334964, lng: 103.834050796658, area: "YISHUN", zone: "NORTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "YUHUA PRIMARY SCHOOL", postalCode: "609558", lat: 1.34291981622016, lng: 103.740861148879, area: "JURONG EAST", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "YUMIN PRIMARY SCHOOL", postalCode: "529393", lat: 1.35131569890862, lng: 103.950551091373, area: "TAMPINES", zone: "EAST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "ZHENGHUA PRIMARY SCHOOL", postalCode: "679002", lat: 1.37942873617052, lng: 103.76970317201, area: "BUKIT PANJANG", zone: "WEST", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
  { name: "ZHONGHUA PRIMARY SCHOOL", postalCode: "556095", lat: 1.36026072476019, lng: 103.869712517383, area: "SERANGOON", zone: "SOUTH", sap: false, gep: false, affiliated: false, missionSchool: false, desirabilityScore: 0, tier: "E" },
];

// ---------------------------------------------------------------------------
// Proximity Functions
// ---------------------------------------------------------------------------

/**
 * Find all primary schools within a given radius of a lat/lng coordinate.
 * Default radius is 2000 m, matching MOE’s 2 km registration band.
 * Returns results sorted by distance ascending.
 */
export function findNearbySchools(
  lat: number,
  lng: number,
  radiusMeters: number = 2000,
): SchoolProximityResult[] {
  const results: SchoolProximityResult[] = [];

  for (const school of PRIMARY_SCHOOLS) {
    const dist = haversineMeters(lat, lng, school.lat, school.lng);
    if (dist > radiusMeters) continue;

    const distRounded = Math.round(dist);
    const band: SchoolProximityResult["distanceBand"] =
      distRounded <= 1000 ? "within1km" : "within2km";
    const tierPremium = SCHOOL_PREMIUM_TIERS[school.tier];
    const bandPremium = tierPremium[band];

    results.push({
      school,
      distanceMeters: distRounded,
      walkingMinutes: walkingMinutes(distRounded),
      distanceBand: band,
      premiumPercent: { min: bandPremium.minPercent, max: bandPremium.maxPercent },
    });
  }

  results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return results;
}

/**
 * Calculate the overall school proximity premium for a property.
 * Takes the best single-school premium, then adds a capped compound bonus
 * if multiple desirable schools (tier A/B/C) overlap within 1 km.
 */
export function getSchoolPremiumPercent(
  schools: SchoolProximityResult[],
): { min: number; max: number } {
  if (schools.length === 0) return { min: 0, max: 0 };

  // Find the single best premium
  let bestMin = 0;
  let bestMax = 0;
  for (const s of schools) {
    if (s.premiumPercent.max > bestMax) {
      bestMin = s.premiumPercent.min;
      bestMax = s.premiumPercent.max;
    }
  }

  if (bestMax === 0) return { min: 0, max: 0 };

  // Count additional desirable schools within 1 km (excluding the best one)
  const desirableWithin1km = schools.filter(
    (s) =>
      s.distanceBand === "within1km" &&
      s.premiumPercent.max > 0,
  );

  // If more than one desirable school within 1 km, add compound bonus
  // Each additional school adds 1% capped at MAX_COMPOUND_BONUS
  const additionalCount = Math.max(0, desirableWithin1km.length - 1);
  const compoundBonus = Math.min(additionalCount * 0.01, MAX_COMPOUND_BONUS);

  return {
    min: bestMin + compoundBonus,
    max: bestMax + compoundBonus,
  };
}
