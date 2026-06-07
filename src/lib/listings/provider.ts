/**
 * Listings data-access seam.
 *
 * ALL reads go through this module. Today it filters a bundled mock array; to
 * plug in a paid MLS/IDX feed later (ADR-011 backlog), reimplement just these
 * functions — the cards, filters, and detail page stay the same.
 */
import { mockListings } from "./mock-data";
import type { Listing, ListingFilters } from "./types";

function matches(listing: Listing, f: ListingFilters): boolean {
  if (f.state && listing.state !== f.state.toUpperCase()) return false;
  if (typeof f.minPrice === "number" && listing.price < f.minPrice) return false;
  if (typeof f.maxPrice === "number" && listing.price > f.maxPrice) return false;
  if (typeof f.minBeds === "number" && listing.beds < f.minBeds) return false;
  if (typeof f.minBaths === "number" && listing.baths < f.minBaths) return false;
  if (f.propertyType && listing.propertyType !== f.propertyType) return false;
  if (f.query) {
    const q = f.query.trim().toLowerCase();
    if (q) {
      const hay = `${listing.address} ${listing.city} ${listing.state} ${listing.zip}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

function sortListings(listings: Listing[], sort: ListingFilters["sort"]): Listing[] {
  const out = [...listings];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "newest":
    default:
      return out.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
  }
}

/** Query listings against the given filters. */
export function queryListings(filters: ListingFilters = {}): Listing[] {
  return sortListings(
    mockListings.filter((l) => matches(l, filters)),
    filters.sort,
  );
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
