/**
 * Pure distance helpers (issue #182). No dependencies — the haversine formula is
 * plain trigonometry. Used to annotate listings with their distance (miles) from
 * the active search center and to power the "Distance (nearest)" sort.
 */

import type { Listing } from "./types";

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_MILES = 3958.7613;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle distance in miles between two lat/lng points (haversine). The
 * result is symmetric and zero when the points coincide.
 */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Return a copy of `listings` with `distance` (miles from `center`) set on each
 * entry that carries real coordinates. Listings missing `lat`/`lng` are returned
 * unchanged (distance left undefined) — we never fabricate a distance.
 */
export function annotateDistance(
  listings: Listing[],
  center: LatLng,
): Listing[] {
  return listings.map((l) => {
    if (typeof l.lat === "number" && typeof l.lng === "number") {
      return {
        ...l,
        distance: haversineMiles(center, { lat: l.lat, lng: l.lng }),
      };
    }
    return l;
  });
}
