/**
 * Listings search route (issue #174 — Search P2-1).
 *
 * POST { ...ListingFilters } → { listings, source }. It runs the search through
 * the {@link getListingsDataSource} seam, so it returns REAL for-sale listings
 * when RentCast is configured (`LISTINGS_DATA_SOURCE=rentcast` +
 * `RENTCAST_API_KEY`) and the bundled illustrative samples otherwise.
 *
 * `source` is "rentcast" when the real feed is active, else "mock" — the client
 * uses this to choose the honest disclaimer (never claiming mock is live).
 *
 * Everything is wrapped so the route NEVER 500s at the user: any failure
 * degrades to `{ listings: [], source, error }`.
 */

import { NextResponse } from "next/server";
import {
  getListingsDataSource,
  isRentCastListingsActive,
} from "@/lib/listings/provider";
import { rentcastHasLocation } from "@/lib/listings/source-rentcast";
import type { ListingFilters } from "@/lib/listings/types";

export async function POST(request: Request) {
  const source = isRentCastListingsActive() ? "rentcast" : "mock";

  try {
    const filters = (await request
      .json()
      .catch(() => ({}))) as ListingFilters;
    const f = filters ?? {};

    // RentCast can't search without a location — tell the client to prompt for
    // one instead of returning a confusing empty list. (Mock data has no such
    // requirement.)
    if (source === "rentcast" && !rentcastHasLocation(f)) {
      return NextResponse.json({ listings: [], source, needsLocation: true });
    }

    const listings = await getListingsDataSource().search(f);
    return NextResponse.json({ listings, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Never surface a 500: degrade to an empty result the UI can render.
    return NextResponse.json({ listings: [], source, error: message });
  }
}
