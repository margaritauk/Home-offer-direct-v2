/**
 * Geocode (place-search) route (UX continuity, Item 4 / S0a).
 *
 * GET /api/geocode?q=<text> → { suggestions, source }. Runs the typeahead
 * through the {@link getGeocodeSource} seam, so it returns real Photon places by
 * default (keyless) and `[]` when the `GEOCODE_DISABLED` kill switch is on.
 *
 * Server-side on purpose: keeps the upstream geocoder swappable behind the seam
 * and lets a future keyed provider stay server-only. Everything is wrapped so
 * the route NEVER 500s at the user: any failure degrades to
 * `{ suggestions: [] }`, so the box falls back to free-text entry.
 *
 * FHA: the seam only ever returns the five geographic kinds; no demographic
 * field is requested or returned.
 */

import { NextResponse } from "next/server";
import { getGeocodeSource, isGeocodeActive } from "@/lib/geocode/provider";

export async function GET(request: Request) {
  const source = isGeocodeActive() ? "photon" : "disabled";

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (!q) return NextResponse.json({ suggestions: [], source });

    const suggestions = await getGeocodeSource().suggest(q);
    return NextResponse.json({ suggestions, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Never surface a 500: degrade to an empty result the box can render.
    return NextResponse.json({ suggestions: [], source, error: message });
  }
}
