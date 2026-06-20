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

import { matches, sortListings } from "./provider";
import { annotateDistance } from "./distance";
import type {
  Listing,
  ListingContact,
  ListingFilters,
  PropertyType,
} from "./types";

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

/** A finite number (allowing 0 and negatives, e.g. longitude), else undefined. */
function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** A loosely-validated email (must contain one @ and a dot in the domain). */
function asEmail(v: unknown): string | undefined {
  const s = asString(v)?.trim();
  if (!s) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : undefined;
}

/** A phone string with at least 7 digits (kept as the source provides it). */
function asPhone(v: unknown): string | undefined {
  const s = asString(v)?.trim();
  if (!s) return undefined;
  return (s.match(/\d/g) ?? []).length >= 7 ? s : undefined;
}

/** A website URL; prepends https:// when the scheme is missing. */
function asWebsite(v: unknown): string | undefined {
  const s = asString(v)?.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  // Only treat it as a site if it looks domain-ish; else drop it.
  return /\.[a-z]{2,}/i.test(s) ? `https://${s}` : undefined;
}

/**
 * Map a RentCast `listingAgent`/`listingOffice` object to a {@link ListingContact}
 * (Item 3 / S0b). Defensive + honest:
 *  - reads `name`/`phone`/`email`/`website` (office has no website per RentCast,
 *    so it stays undefined there);
 *  - validates phone/email so a malformed value doesn't become a broken
 *    `tel:`/`mailto:` link;
 *  - returns `undefined` when NOTHING usable is present — never a hollow object,
 *    never a fabricated field (mirrors the lat/lng "real or undefined" posture).
 *  - never throws on garbage.
 */
export function mapListingContact(raw: unknown): ListingContact | undefined {
  if (!isRecord(raw)) return undefined;
  const contact: ListingContact = {};
  const name = asString(raw.name);
  const phone = asPhone(raw.phone);
  const email = asEmail(raw.email);
  const website = asWebsite(raw.website);
  if (name) contact.name = name;
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (website) contact.website = website;
  return Object.keys(contact).length > 0 ? contact : undefined;
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
    // Real coordinates when present — drive distance + the "nearest" sort. Left
    // undefined when RentCast omits them (never fabricated).
    const lat = asFiniteNumber(raw.latitude);
    const lng = asFiniteNumber(raw.longitude);

    const description =
      asString(raw.description) ??
      `${beds} bd / ${baths} ba ${propertyType.replace("-", " ")} home${
        city ? ` in ${city}` : ""
      }.`;

    // Listing-agent / office contacts (real-or-undefined; never fabricated).
    const listingAgent = mapListingContact(raw.listingAgent);
    const listingOffice = mapListingContact(raw.listingOffice);

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
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
      ...(listingAgent ? { listingAgent } : {}),
      ...(listingOffice ? { listingOffice } : {}),
    });
  }

  return out;
}

/**
 * Whether the filters carry a geographic scope RentCast can query. RentCast's
 * `/listings/sale` REQUIRES at least one location param (lat+lng, zipCode, city,
 * or state) — a location-less request errors. The route uses this to prompt the
 * buyer to pick a location instead of firing a guaranteed-to-fail query.
 */
export function rentcastHasLocation(filters: ListingFilters): boolean {
  return (
    (typeof filters.lat === "number" && typeof filters.lng === "number") ||
    Boolean(filters.zip) ||
    Boolean(filters.city) ||
    Boolean(filters.state)
  );
}

/**
 * Build the RentCast query string from our neutral {@link ListingFilters}.
 *
 * We deliberately send ONLY a location scope + freshness (`daysOld`) +
 * status/limit, and post-filter everything else via {@link matches}. Reasons:
 *  - RentCast's `bedrooms`/`bathrooms` are EXACT matches, so sending them for a
 *    "3+" search would wrongly drop 4-bed homes.
 *  - RentCast's `propertyType` labels ("Single Family") differ from our enum
 *    ("single-family"), so sending ours wouldn't match.
 *  - Price min/max aren't reliably supported on this endpoint.
 * `matches()` enforces all of those client-side, so results stay correct.
 */
function buildQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();

  // Geographic scope: lat/lng (+radius) takes precedence; then zip; then
  // city+state; then state alone.
  if (typeof filters.lat === "number" && typeof filters.lng === "number") {
    params.set("latitude", String(filters.lat));
    params.set("longitude", String(filters.lng));
    if (typeof filters.radius === "number") {
      params.set("radius", String(filters.radius));
    }
  } else if (filters.zip) {
    params.set("zipCode", filters.zip);
  } else {
    if (filters.city) params.set("city", filters.city);
    if (filters.state) params.set("state", filters.state.toUpperCase());
  }

  // Freshness is a genuine RentCast filter (listings on market <= N days).
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
    // RentCast requires a location; without one, don't fire a failing request.
    if (!rentcastHasLocation(filters)) return [];

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
      const filtered = mapped.filter((l) => matches(l, filters));
      // Annotate distance from the search center (when one exists) and sort with
      // the same shared logic as the mock path, so "distance"/etc. behave alike.
      const annotated =
        typeof filters.lat === "number" && typeof filters.lng === "number"
          ? annotateDistance(filtered, { lat: filters.lat, lng: filters.lng })
          : filtered;
      return sortListings(annotated, filters.sort);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<Listing | undefined> {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey || !id) return undefined;

    // RentCast exposes a single listing at /listings/sale/{id}.
    const url = `${RENTCAST_LISTINGS_URL}/${encodeURIComponent(id)}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return undefined;
      const body = await res.json();
      // The endpoint may return a single object or a one-element array.
      const arr = Array.isArray(body) ? body : [body];
      return mapRentCastListings(arr)[0];
    } catch {
      return undefined;
    }
  }
}
