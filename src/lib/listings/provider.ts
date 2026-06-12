/**
 * Listings data-access seam (ADR-011, issue #174).
 *
 * ALL reads go through this module. Two implementations sit behind the
 * {@link ListingsDataSource} contract:
 *   - {@link MockListingsDataSource} — the bundled illustrative sample array
 *     (every entry `isSample: true`), filtered with {@link matches}. This is the
 *     default and keeps the sync {@link queryListings} export working.
 *   - {@link RentCastListingsDataSource} — a REAL for-sale feed (issue #174),
 *     selected only when `LISTINGS_DATA_SOURCE === "rentcast"` AND
 *     `RENTCAST_API_KEY` is set.
 *
 * {@link getListingsDataSource} is server-only (reads `process.env`) and is the
 * single switch point; the cards, filters, and detail page stay unchanged.
 */
import { RentCastListingsDataSource } from "./source-rentcast";
import { mockListings } from "./mock-data";
import { annotateDistance } from "./distance";
import { isRentCastDisabled } from "@/lib/rentcast-flag";
import type { Listing, ListingFilters } from "./types";

/**
 * Client-applicable filter predicate. Used by the mock path AND as a safety
 * post-filter for the real source (which can't honor every filter server-side).
 * Exported so the RentCast connector can reuse the exact same logic.
 */
export function matches(listing: Listing, f: ListingFilters): boolean {
  if (f.state && listing.state !== f.state.toUpperCase()) return false;
  if (typeof f.minPrice === "number" && listing.price < f.minPrice) return false;
  if (typeof f.maxPrice === "number" && listing.price > f.maxPrice) return false;
  if (typeof f.minBeds === "number" && listing.beds < f.minBeds) return false;
  if (typeof f.maxBeds === "number" && listing.beds > f.maxBeds) return false;
  if (typeof f.minBaths === "number" && listing.baths < f.minBaths) return false;
  if (typeof f.minSqft === "number" && listing.sqft < f.minSqft) return false;
  if (typeof f.maxSqft === "number" && listing.sqft > f.maxSqft) return false;
  if (typeof f.minYearBuilt === "number" && listing.yearBuilt < f.minYearBuilt)
    return false;
  if (typeof f.maxYearBuilt === "number" && listing.yearBuilt > f.maxYearBuilt)
    return false;
  if (
    typeof f.maxDaysOnMarket === "number" &&
    listing.daysOnMarket > f.maxDaysOnMarket
  )
    return false;
  // Multi-select property type takes precedence (OR semantics); fall back to the
  // single `propertyType` for back-compat. An empty `propertyTypes` is ignored.
  if (f.propertyTypes && f.propertyTypes.length > 0) {
    if (!f.propertyTypes.includes(listing.propertyType)) return false;
  } else if (f.propertyType && listing.propertyType !== f.propertyType) {
    return false;
  }
  if (f.query) {
    const q = f.query.trim().toLowerCase();
    if (q) {
      const hay = `${listing.address} ${listing.city} ${listing.state} ${listing.zip} ${listing.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

export function sortListings(
  listings: Listing[],
  sort: ListingFilters["sort"],
): Listing[] {
  const out = [...listings];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "sqft-desc":
      return out.sort((a, b) => b.sqft - a.sqft);
    case "beds-desc":
      return out.sort((a, b) => b.beds - a.beds);
    case "distance":
      // Nearest first; listings without a distance sort last (Infinity).
      return out.sort(
        (a, b) =>
          (a.distance ?? Infinity) - (b.distance ?? Infinity),
      );
    case "days-asc":
    case "newest":
    default:
      return out.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
  }
}

/**
 * Annotate listings with distance from the filters' center when the search
 * carries real coordinates (`lat`/`lng`). Otherwise returns them unchanged — we
 * never fabricate a distance for a location-less search.
 */
function annotateForFilters(
  listings: Listing[],
  filters: ListingFilters,
): Listing[] {
  if (typeof filters.lat === "number" && typeof filters.lng === "number") {
    return annotateDistance(listings, { lat: filters.lat, lng: filters.lng });
  }
  return listings;
}

/**
 * Query the bundled mock listings synchronously. Kept for back-compat with the
 * existing callers/tests and the static detail page; the seam below builds on it
 * for the async (real-source-capable) path.
 */
export function queryListings(filters: ListingFilters = {}): Listing[] {
  const filtered = annotateForFilters(
    mockListings.filter((l) => matches(l, filters)),
    filters,
  );
  return sortListings(filtered, filters.sort);
}

export function getListingById(id: string): Listing | undefined {
  return mockListings.find((l) => l.id === id);
}

export function allListings(): Listing[] {
  return mockListings;
}

/** Distinct state codes present in the data, sorted. */
export function listingStates(): string[] {
  return [...new Set(mockListings.map((l) => l.state))].sort();
}

/**
 * The data-access contract. ALL listings reads can go through an implementation
 * of this; a real connector implements it against its API, everything
 * downstream stays unchanged.
 */
export interface ListingsDataSource {
  search(filters: ListingFilters): Promise<Listing[]>;
  getById(id: string): Promise<Listing | undefined>;
}

/**
 * The default source: the bundled illustrative samples (`isSample: true`),
 * filtered + sorted with the same sync logic as {@link queryListings}, wrapped
 * in async so it satisfies the {@link ListingsDataSource} contract.
 */
export class MockListingsDataSource implements ListingsDataSource {
  async search(filters: ListingFilters): Promise<Listing[]> {
    return queryListings(filters);
  }

  async getById(id: string): Promise<Listing | undefined> {
    return getListingById(id);
  }
}

/**
 * The seam (server-only). Returns {@link RentCastListingsDataSource} when
 * `LISTINGS_DATA_SOURCE === "rentcast"` AND `RENTCAST_API_KEY` is set AND the
 * {@link isRentCastDisabled} kill switch is off; otherwise the
 * {@link MockListingsDataSource}. Without the key we fall back to mock rather
 * than wire up a source that can't query.
 */
export function getListingsDataSource(): ListingsDataSource {
  if (isRentCastListingsActive()) {
    return new RentCastListingsDataSource();
  }
  return new MockListingsDataSource();
}

/** Whether the active source is the real RentCast feed (server-only). */
export function isRentCastListingsActive(): boolean {
  return (
    !isRentCastDisabled() &&
    process.env.LISTINGS_DATA_SOURCE === "rentcast" &&
    Boolean(process.env.RENTCAST_API_KEY)
  );
}

/**
 * Search listings through the seam (async). Routes to the real source when
 * configured, else the mock. The route layer wraps this.
 */
export function searchListings(filters: ListingFilters = {}): Promise<Listing[]> {
  return getListingsDataSource().search(filters);
}
