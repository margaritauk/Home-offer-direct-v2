/**
 * RentCast comps connector (issue #169) — the FIRST real recent-sales data
 * source behind the {@link CompsDataSource} seam (issue #104 / ADR-011).
 *
 * It calls RentCast's AVM endpoint and maps the `comparables` it returns into our
 * neutral {@link CandidateSale} shape. Everything is server-only: the API key is
 * read from `process.env.RENTCAST_API_KEY` and is NEVER hardcoded, logged, or
 * exposed to the browser. On any failure (no key, bad address, non-OK response,
 * thrown error) it returns `[]` rather than throwing — so the route surfaces a
 * clean "no comparable sales found" instead of fabricating comps.
 *
 * RentCast AVM response schema (GET /v1/avm/value), relevant fields only:
 *   {
 *     price: number,                 // subject AVM value (ignored here)
 *     comparables: [
 *       {
 *         id: string,                // stable RentCast id
 *         formattedAddress: string,  // "123 Main St, Austin, TX 78701"
 *         addressLine1: string,
 *         city: string,
 *         state: string,             // two-letter
 *         price: number,             // the comp's sale/list price (dollars)
 *         squareFootage: number,     // living area
 *         bedrooms: number,
 *         bathrooms: number,
 *         distance: number,          // miles from the subject
 *         lastSeenDate: string,      // ISO; most recent observation
 *         removedDate: string,       // ISO; when delisted (fallback)
 *         listedDate: string,        // ISO; when listed (fallback)
 *         ...
 *       }
 *     ]
 *   }
 *
 * Real sales: the mapper leaves `sample` UNSET (these are genuine records).
 */

import type {
  CandidateSale,
  CompsDataSource,
  CompsSubject,
} from "@/lib/tools/comps-source";

const RENTCAST_AVM_URL = "https://api.rentcast.io/v1/avm/value";
/** How many comparables to ask RentCast for. */
const COMP_COUNT = 8;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asPositiveNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Pure mapper: a RentCast AVM payload → our {@link CandidateSale}[].
 *
 * Field mapping:
 *   id            ← comp.id (fallback comp.formattedAddress)
 *   address       ← comp.formattedAddress (fallback comp.addressLine1)
 *   city/state    ← comp.city / comp.state
 *   salePrice     ← comp.price
 *   saleDate      ← comp.lastSeenDate ?? comp.removedDate ?? comp.listedDate
 *   sqft          ← comp.squareFootage
 *   beds/baths    ← comp.bedrooms / comp.bathrooms
 *   distanceMiles ← comp.distance
 *
 * Drop rules: any comp missing a positive `price` OR a positive
 * `squareFootage` is dropped — without both it can't feed the downstream
 * comps math. Defensive: a non-object payload or a missing/non-array
 * `comparables` yields `[]`. Never throws.
 */
export function mapRentCastComparables(payload: unknown): CandidateSale[] {
  if (!isRecord(payload)) return [];
  const comparables = payload.comparables;
  if (!Array.isArray(comparables)) return [];

  const out: CandidateSale[] = [];

  for (const raw of comparables) {
    if (!isRecord(raw)) continue;

    const salePrice = asPositiveNumber(raw.price);
    const sqft = asPositiveNumber(raw.squareFootage);
    // Can't use a comp without a usable price AND living area.
    if (salePrice === undefined || sqft === undefined) continue;

    const address = asString(raw.formattedAddress) ?? asString(raw.addressLine1);
    const id = asString(raw.id) ?? address;
    // Without any stable identifier we can't anchor the comp; skip it.
    if (id === undefined) continue;

    const saleDate =
      asString(raw.lastSeenDate) ??
      asString(raw.removedDate) ??
      asString(raw.listedDate);

    out.push({
      id,
      address: address ?? id,
      city: asString(raw.city),
      state: asString(raw.state),
      salePrice,
      saleDate,
      sqft,
      beds: asNumber(raw.bedrooms),
      baths: asNumber(raw.bathrooms),
      distanceMiles: asNumber(raw.distance),
      // `sample` intentionally unset — these are REAL recorded comparables.
    });
  }

  return out;
}

/**
 * Live RentCast data source. Server-only. Reads the API key from env and queries
 * the AVM endpoint by the subject's address label. Returns `[]` on any failure
 * (missing key, missing address, non-OK response, or thrown error) — it never
 * throws and never fabricates.
 */
export class RentCastCompsDataSource implements CompsDataSource {
  async fetchRecentSales(subject: CompsSubject): Promise<CandidateSale[]> {
    const apiKey = process.env.RENTCAST_API_KEY;
    const address = subject.label?.trim();

    // No key or no address → we can't query; return nothing rather than guess.
    if (!apiKey || !address) return [];

    const url = `${RENTCAST_AVM_URL}?address=${encodeURIComponent(
      address,
    )}&compCount=${COMP_COUNT}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return [];
      return mapRentCastComparables(await res.json());
    } catch {
      return [];
    }
  }
}
