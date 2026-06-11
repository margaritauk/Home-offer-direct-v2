/**
 * Listing domain model.
 *
 * Today these are mock/sample listings (every entry has `isSample: true`) served
 * from a bundled array via the provider seam. The shape is deliberately close to
 * what a real MLS/IDX feed returns so that swapping in a paid pipeline later
 * (see ADR-011) reuses this type and all the UI unchanged.
 */

export type PropertyType =
  | "single-family"
  | "condo"
  | "townhouse"
  | "multi-family";

export const propertyTypeLabels: Record<PropertyType, string> = {
  "single-family": "Single-family",
  condo: "Condo",
  townhouse: "Townhouse",
  "multi-family": "Multi-family",
};

export interface Listing {
  id: string;
  /** Street address line (e.g. "123 Maple St"). */
  address: string;
  city: string;
  /** Two-letter state code, uppercase. */
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: PropertyType;
  yearBuilt: number;
  daysOnMarket: number;
  description: string;
  /** Illustrative listing — never a real property. The UI labels these. */
  isSample: boolean;
}

export interface ListingFilters {
  /** State code; empty/undefined = all states. */
  state?: string;
  /** City name; used by the real (RentCast) source for a geographic query. */
  city?: string;
  /** ZIP code; used by the real (RentCast) source for a geographic query. */
  zip?: string;
  /** Latitude; with `lng`/`radius`, drives a radius search on the real source. */
  lat?: number;
  /** Longitude; with `lat`/`radius`, drives a radius search on the real source. */
  lng?: number;
  /** Search radius in miles, paired with `lat`/`lng` on the real source. */
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyType?: PropertyType;
  /** Free-text match against address / city / state / zip / description. */
  query?: string;
  /** Sort order; defaults to newest-on-market. */
  sort?: "price-asc" | "price-desc" | "newest";
}
