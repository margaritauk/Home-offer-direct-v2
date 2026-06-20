/**
 * Geocode kill switch (UX continuity, Item 4 / S0a) — mirrors
 * `src/lib/rentcast-flag.ts`.
 *
 * A single code-level off-switch for the geocode seam. When `GEOCODE_DISABLED`
 * is truthy, {@link getGeocodeSource} returns the Null source (suggestions
 * become `[]`) even if `GEOCODE_SOURCE` is still set — so place-search can be
 * cut fast (vendor outage, cost, bad data) and restored by flipping one value.
 *
 * Unlike RentCast, the geocode seam is keyless-by-default (Photon is free), so
 * the seam is ACTIVE out of the box; this flag is the only thing that turns it
 * off. Truthy = "1" | "true" | "yes" | "on" (case-insensitive). Anything else
 * (including unset/empty) leaves geocoding enabled.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */
export function isGeocodeDisabled(): boolean {
  const raw = process.env.GEOCODE_DISABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
