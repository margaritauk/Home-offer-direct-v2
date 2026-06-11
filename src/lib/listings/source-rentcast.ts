/**
 * RentCast for-sale listings connector (issue #174 — Search P2-1) — the FIRST
 * real for-sale listings source behind the {@link ListingsDataSource} seam
 * (ADR-011). It mirrors the proven comps connector (issue #169,
 * `comps-source-rentcast.ts`): a pure mapper + a server-only fetch that reads
 * the API key from `process.env.RENTCAST_API_KEY`, sends it as the `X-Api-Key`
 * header, and returns `[]` on ANY failure rather than throwing.
 *
 * Server-only: the key is NEVER hardcoded, logged, exposed to the browser, or
 * prefixed `NEXT_PUBLIC_`.
 *
 * RentCast for-sale listings response schema (GET /v1/listings/sale) — an ARRAY
 * of sale records, relevant fields only:
 *   [
 *     {
 *       id: string,                 // stable RentCast id
 *       formattedAddress: string,   // "123 Main St, Austin, TX 78701"
 *       addressLine1: string,       // "123 Main St"
 *       city: string,
 *       state: string,              // two-letter
 *       zipCode: string,
 *       price: number,              // list price (dollars)
 *       bedrooms: number,
 *       bathrooms: number,
 *       squareFootage: number,      // living area
 *       propertyType: string,       // "Single Family" | "Condo" | "Townhouse" | "Multi-Family" | ...
 *       yearBuilt: number,
 *       daysOnMarket: number,
 *       status: string,             // "Active" | ...
 *       ...
 *     }
 *   ]
 *
 * Real data: mapped listings carry `isSample: false` — they are genuine for-sale
 * records, never illustrative samples.
 */

import { matches } from "./provider";
import type { Listing, ListingFilters, PropertyType } from "./types";

const RENTCAST_LISTINGS_URL = "https://api.rentcast.io/v1/listings/sale";
/** How many listings to ask RentCast for in one page. */
const LISTING_LIMIT = 50;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asPositiveNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
}

function asNumberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * Map a RentCast `propertyType` string to our {@link PropertyType} union.
 * RentCast uses spaced TitleCase labels ("Single Family", "Multi-Family"); we
 * normalize whitespace/case so minor variants still match. Anything we don't
 * recognize falls back to "single-family" — the most common case — so a real
 * listing is never dropped purely for an unmapped type.
 */
export function mapRentCastPropertyType(raw: unknown): PropertyType {
  const key = asString(raw)?.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  switch (key) {
    case "condo":
    case "condominium":
    case "apartment":
      return "condo";
    case "townhouse":
    case "townhome":
      return "townhouse";
    case "multi family":
    case "multifamily":
    case "duplex":
    case "triplex":
    case "fourplex":
      return "multi-family";
    case "single family":
    case "single family residence":
    case "manufactured":
    case "land":
    default:
      return "single-family";
  }
}

/**
 * Pure mapper: a RentCast for-sale payload (an ARRAY) → our {@link Listing}[].
 *
 * Field mapping:
 *   id           ← record.id (fallback record.formattedAddress)
 *   address      ← record.formattedAddress (fallback record.addressLine1)
 *   city/state   ← record.city / record.state
 *   zip          ← record.zipCode
 *   price        ← record.price
 *   beds/baths   ← record.bedrooms / record.bathrooms (0 if absent)
 *   sqft         ← record.squareFootage
 *   propertyType ← mapRentCastPropertyType(record.propertyType)
 *   yearBuilt    ← record.yearBuilt (0 if absent)
 *   daysOnMarket ← record.daysOnMarket (0 if absent)
 *   description  ← a short generated descriptor when RentCast has none
 *   isSample     ← false (these are REAL)
 *
 * Drop rules: any record missing a positive `price` OR a positive
 * `squareFootage` is dropped (a listing card needs both). Defensive: a
 * non-array / garbage payload yields `[]`. Never throws.
 */
export function mapRentCastListings(payload: unknown): Listing[] {
  if (!Array.isArray(payload)) return [];

  const out: Listing[] = [];

  for (const raw of payload) {
    if (!isRecord(raw)) continue;

    const price = asPositiveNumber(raw.price);
    const sqft = asPositiveNumber(raw.squareFootage);
    // A listing without a usable price AND living area can't be shown.
    if (price === undefined || sqft === undefined) continue;

    const address = asString(raw.formattedAddress) ?? asString(raw.addressLine1);
    const id = asString(raw.id) ?? address;
    // Without any stable identifier we can't anchor / link the listing; skip it.
    if (id === undefined) continue;

    const propertyType = mapRentCastPropertyType(raw.propertyType);
    const city = asString(raw.city) ?? "";
    const state = (asString(raw.state) ?? "").toUpperCase();
    const beds = asNumberOr(raw.bedrooms, 0);
    const baths = asNumberOr(raw.bathrooms, 0);

    const description =
      asString(raw.description) ??
      `${beds} bd / ${baths} ba ${propertyType.replace("-", " ")} home${
        city ? ` in ${city}` : ""
      }.`;

    out.push({
      id,
      address: address ?? id,
      city,
      state,
      zip: asString(raw.zipCode) ?? "",
      price,
      beds,
      baths,
      sqft,
      propertyType,
      yearBuilt: asNumberOr(raw.yearBuilt, 0),
      daysOnMarket: asNumberOr(raw.daysOnMarket, 0),
      description,
      // REAL listing — never flagged as an illustrative sample.
      isSample: false,
    });
  }

  return out;
}

/**
 * Build the RentCast query string from our neutral {@link ListingFilters}.
 * Only the filters RentCast supports server-side are sent; the rest are applied
 * client-side afterwards via {@link matches}. `status=Active` + `limit` are
 * always set.
 */
function buildQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();

  // Geographic scope: a lat/lng/radius search takes precedence; otherwise fall
  // back to zip, then city+state, then state alone.
  if (
    typeof filters.lat === "number" &&
    typeof filters.lng === "number" &&
    typeof filters.radius === "number"
  ) {
    params.set("latitude", String(filters.lat));
    params.set("longitude", String(filters.lng));
    params.set("radius", String(filters.radius));
  } else if (filters.zip) {
    params.set("zipCode", filters.zip);
  } else {
    if (filters.city) params.set("city", filters.city);
    if (filters.state) params.set("state", filters.state.toUpperCase());
  }

  // Property type: RentCast takes a single `propertyType`. We can only push it
  // server-side when the multi-select resolves to exactly one type; otherwise
  // we leave it off and let the shared `matches()` post-filter narrow the set.
  const singleType =
    filters.propertyTypes && filters.propertyTypes.length === 1
      ? filters.propertyTypes[0]
      : filters.propertyTypes && filters.propertyTypes.length > 1
        ? undefined
        : filters.propertyType;
  if (singleType) {
    params.set("propertyType", singleType);
  }
  if (typeof filters.minBeds === "number" && filters.minBeds > 0) {
    params.set("bedrooms", String(filters.minBeds));
  }
  if (typeof filters.minBaths === "number" && filters.minBaths > 0) {
    params.set("bathrooms", String(filters.minBaths));
  }
  if (typeof filters.maxPrice === "number" && filters.maxPrice > 0) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (typeof filters.minPrice === "number" && filters.minPrice > 0) {
    params.set("minPrice", String(filters.minPrice));
  }
  // Freshness: RentCast supports `daysOld` (listings on market <= N days).
  if (
    typeof filters.maxDaysOnMarket === "number" &&
    filters.maxDaysOnMarket > 0
  ) {
    params.set("daysOld", String(filters.maxDaysOnMarket));
  }

  params.set("status", "Active");
  params.set("limit", String(LISTING_LIMIT));

  return params.toString();
}

/**
 * Live RentCast for-sale listings source. Server-only. Reads the API key from
 * env and queries the listings endpoint. Returns `[]` on any failure (missing
 * key, non-OK response, or thrown error) — it never throws and never fabricates.
 *
 * RentCast can't honor every filter server-side, so the mapped results are
 * post-filtered with the same {@link matches} predicate the mock path uses — a
 * safety net so the user only ever sees listings consistent with their filters.
 */
export class RentCastListingsDataSource {
  async search(filters: ListingFilters): Promise<Listing[]> {
    const apiKey = process.env.RENTCAST_API_KEY;
    // No key → we can't query; return nothing rather than guess.
    if (!apiKey) return [];

    const url = `${RENTCAST_LISTINGS_URL}?${buildQuery(filters)}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return [];
      const mapped = mapRentCastListings(await res.json());
      // Post-filter for safety (RentCast may not honor every filter), reusing
      // the shared predicate so behavior matches the mock path exactly.
      return mapped.filter((l) => matches(l, filters));
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<Listing | undefined> {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey || !id) return undefined;

    const url = `${RENTCAST_LISTINGS_URL}?id=${encodeURIComponent(id)}&limit=1`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return undefined;
      return mapRentCastListings(await res.json())[0];
    } catch {
      return undefined;
    }
  }
}
