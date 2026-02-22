// ---------------------------------------------------------------------------
// OneMap API Client — Geocoding for HDB blocks
// ---------------------------------------------------------------------------
// Uses Singapore's official OneMap API to convert HDB block + street into
// lat/lng coordinates. Required for distance-based BTO proximity detection.
//
// Setup: Set ONEMAP_EMAIL and ONEMAP_PASSWORD in .env.local
//        Register free at https://www.onemap.gov.sg/apidocs/register
//
// If credentials are not configured, geocoding silently returns null and
// the risk assessment falls back to block-number proximity logic.
// ---------------------------------------------------------------------------

const ONEMAP_BASE = "https://www.onemap.gov.sg/api";

let cachedToken: { token: string; expiry: number } | null = null;

// In-memory geocode cache — HDB block coordinates never change
const geocodeCache = new Map<string, { lat: number; lng: number }>();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getToken(): Promise<string | null> {
  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password) return null;

  // Return cached token if still valid (with 1hr buffer)
  if (cachedToken && cachedToken.expiry > Date.now() / 1000 + 3600) {
    return cachedToken.token;
  }

  try {
    const res = await fetch(`${ONEMAP_BASE}/auth/post/getToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      access_token: string;
      expiry_timestamp: string;
    };

    cachedToken = {
      token: data.access_token,
      expiry: parseInt(data.expiry_timestamp, 10),
    };

    return cachedToken.token;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Geocode
// ---------------------------------------------------------------------------

export interface GeocodedBlock {
  lat: number;
  lng: number;
  block: string;
  street: string;
  postal: string;
}

/**
 * Geocode an HDB block + street to lat/lng coordinates.
 * Returns null if OneMap credentials are not configured or the API fails.
 *
 * Results are cached in memory — HDB block locations never change.
 */
export async function geocodeBlock(
  block: string,
  street: string,
): Promise<GeocodedBlock | null> {
  const cacheKey = `${block}|${street}`.toUpperCase();

  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return { lat: cached.lat, lng: cached.lng, block, street, postal: "" };
  }

  const token = await getToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(`${block} ${street}`);
    const res = await fetch(
      `${ONEMAP_BASE}/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      found: number;
      results: Array<{
        BLK_NO: string;
        ROAD_NAME: string;
        LATITUDE: string;
        LONGITUDE: string;
        POSTAL: string;
      }>;
    };

    if (data.found === 0 || data.results.length === 0) return null;

    // Find the result that best matches our block number
    const blockUpper = block.toUpperCase();
    const match =
      data.results.find((r) => r.BLK_NO.toUpperCase() === blockUpper) ??
      data.results[0];

    const result: GeocodedBlock = {
      lat: parseFloat(match.LATITUDE),
      lng: parseFloat(match.LONGITUDE),
      block: match.BLK_NO,
      street: match.ROAD_NAME,
      postal: match.POSTAL,
    };

    // Cache the result
    geocodeCache.set(cacheKey, { lat: result.lat, lng: result.lng });

    return result;
  } catch {
    return null;
  }
}
