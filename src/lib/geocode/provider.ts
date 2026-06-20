/**
 * Geocode data-access seam (UX continuity, Item 4 / S0a) — mirrors the listings
 * RentCast seam (`src/lib/listings/provider.ts`).
 *
 * ALL geocode reads go through {@link getGeocodeSource}. Unlike RentCast, the
 * default ({@link PhotonGeocodeSource}) is KEYLESS and free, so the seam is
 * ACTIVE out of the box with no env config. Selection:
 *   - `GEOCODE_SOURCE` (default `"photon"`) chooses the implementation.
 *   - `GEOCODE_DISABLED` (kill switch) forces the {@link NullGeocodeSource}
 *     (suggestions become `[]`) regardless of `GEOCODE_SOURCE`.
 *
 * A production swap to a keyed provider (Radar / Geoapify) is one new
 * `source-*.ts` + one `GEOCODE_SOURCE` value — nothing downstream changes.
 *
 * Server-only: reads `process.env`. The route is the single caller.
 */
import { PhotonGeocodeSource } from "./source-photon";
import { isGeocodeDisabled } from "./geocode-flag";
import type { GeocodeSource } from "./types";

/** The safe default when geocoding is disabled / unconfigured: no suggestions. */
export class NullGeocodeSource implements GeocodeSource {
  async suggest(): Promise<[]> {
    return [];
  }
}

/** Whether the live (Photon) geocode source is active (server-only). */
export function isGeocodeActive(): boolean {
  if (isGeocodeDisabled()) return false;
  const source = (process.env.GEOCODE_SOURCE ?? "photon").trim().toLowerCase();
  return source === "photon" || source === "";
}

/**
 * The seam (server-only). Returns the {@link PhotonGeocodeSource} by default
 * (keyless), or the {@link NullGeocodeSource} when the kill switch is on or an
 * unknown `GEOCODE_SOURCE` is configured.
 */
export function getGeocodeSource(): GeocodeSource {
  if (isGeocodeActive()) return new PhotonGeocodeSource();
  return new NullGeocodeSource();
}
