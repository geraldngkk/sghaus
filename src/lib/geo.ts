// ---------------------------------------------------------------------------
// Shared geospatial utilities
// ---------------------------------------------------------------------------

/**
 * Haversine distance — straight-line distance between two lat/lng points.
 * Returns distance in meters.
 */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimate walking time in minutes (80m/min average walking speed). */
export function walkingMinutes(distanceMeters: number): number {
  return Math.round(distanceMeters / 80);
}
