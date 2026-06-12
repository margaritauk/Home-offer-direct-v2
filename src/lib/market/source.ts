/**
 * Market-data provider seam (A1 / ADR-013).
 *
 * Mirrors the listings (ADR-011) and comps (#104) seams: ALL market-stat reads
 * go through a {@link MarketDataSource}. Two implementations sit behind it:
 *   - {@link NullMarketDataSource} — the default; returns `null` (no data) so the
 *     Market Conditions tool falls back to MANUAL ENTRY rather than fabricating a
 *     read. This keeps the build honest with nothing wired up.
 *   - {@link RentCastMarketDataSource} — a gated, real `/v1/markets` connector
 *     (see ./source-rentcast). Returns `null`/empty on any failure.
 *
 * Gating: selected ONLY when `MARKET_DATA_SOURCE === "rentcast"` AND
 * `RENTCAST_API_KEY` is set AND the shared {@link isRentCastDisabled} kill switch
 * is off. A NEW env var is used on purpose — we do NOT overload
 * `COMPS_DATA_SOURCE`/`LISTINGS_DATA_SOURCE`.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */

import { RentCastMarketDataSource } from "./source-rentcast";
import { isRentCastDisabled } from "@/lib/rentcast-flag";
import type { MarketStats } from "./types";

/** What we ask a market-data source for. Neutral location facts only. */
export interface MarketQuery {
  /** ZIP / postal code to scope the stats (RentCast is zip-level). */
  zip?: string;
  /** Two-letter state code, for labeling/fallback. */
  state?: string;
  /** Optional human label for the area/segment. */
  areaLabel?: string;
}

/**
 * The data-access contract. A real connector implements `fetchMarketStats`
 * against its API; everything downstream (the tool, the classifier) is unchanged.
 * Returns `null` when no data is available — callers fall back to manual entry.
 */
export interface MarketDataSource {
  fetchMarketStats(query: MarketQuery): Promise<MarketStats | null>;
}

/**
 * The default, no-op source: nothing configured → `null`. With no source wired,
 * the tool stays in manual-entry mode and never invents market figures.
 */
export const NullMarketDataSource: MarketDataSource = {
  async fetchMarketStats(): Promise<MarketStats | null> {
    return null;
  },
};

/**
 * The seam. Returns the RentCast source ONLY when fully configured + enabled,
 * otherwise the null source. Server-only.
 */
export function getMarketDataSource(): MarketDataSource {
  if (isMarketDataLive()) {
    return new RentCastMarketDataSource();
  }
  return NullMarketDataSource;
}

/**
 * Whether the live RentCast market source is active (server-only). Honors the
 * shared {@link isRentCastDisabled} kill switch first, then the dedicated
 * `MARKET_DATA_SOURCE` flag + the shared key.
 */
export function isMarketDataLive(): boolean {
  return (
    !isRentCastDisabled() &&
    process.env.MARKET_DATA_SOURCE === "rentcast" &&
    Boolean(process.env.RENTCAST_API_KEY)
  );
}

/**
 * Fetch market stats through the seam (async). Routes to the real source when
 * configured, else returns `null`. Never throws.
 */
export function fetchMarketStats(
  query: MarketQuery,
): Promise<MarketStats | null> {
  return getMarketDataSource().fetchMarketStats(query);
}
