/**
 * Geocode seam types (UX continuity, Item 4 / S0a).
 *
 * A keyless-by-default place-search seam mirroring the listings/comps RentCast
 * seams: a {@link GeocodeSource} contract, swappable implementations behind
 * {@link getGeocodeSource} (Photon by default; a Null default when disabled),
 * and a pure response mapper so the mapping logic is unit-testable in isolation.
 *
 * FHA (geography only): a suggestion is one of five GEOGRAPHIC kinds —
 * zip · address · city · state · county. There is NO neighborhood kind and no
 * demographic/"good schools" proxy; the box is pure wayfinding. Every field is a
 * real place fact resolved from the geocoder, never fabricated.
 */

/** The kind of geography a suggestion represents (FHA: geography only). */
export type GeocodeKind = "zip" | "address" | "city" | "state" | "county";

/** One typeahead suggestion — a real place, tagged by its geographic kind. */
export interface GeocodeSuggestion {
  /** Stable-ish id for React keys / dedupe (built from coords + name). */
  id: string;
  /** Which geographic kind this is, for the kind label in the UI. */
  kind: GeocodeKind;
  /** Primary display text (e.g. "Austin", "78704", "123 Maple St"). */
  label: string;
  /** Secondary context line (e.g. "Travis County · TX"), when available. */
  context?: string;
  lat: number;
  lng: number;
  /** Postal code, when the place carries one. */
  zip?: string;
  city?: string;
  /** Two-letter state code, uppercase, when known. */
  state?: string;
  /** County name, when known (geography only — never a neighborhood). */
  county?: string;
}

/**
 * The geocode data-access contract. A real provider implements `suggest`
 * against its API; everything downstream (the route, the box) stays unchanged.
 * Implementations MUST return `[]` on any failure and never throw.
 */
export interface GeocodeSource {
  /** Typeahead: free-text query → geographic suggestions (or `[]`). */
  suggest(query: string): Promise<GeocodeSuggestion[]>;
}
