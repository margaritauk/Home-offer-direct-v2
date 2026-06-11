/**
 * Comps data-source seam (issue #104).
 *
 * The AI "auto-find comps" feature must NEVER invent a sale. It may only
 * rank/adjust REAL recent sales. Those real sales come from a data source behind
 * this seam — mirroring the listings provider pattern (ADR-011) so a real
 * ATTOM/MLS connector can be plugged in later by reimplementing just these
 * functions.
 *
 * By DEFAULT no source is configured ({@link NullCompsDataSource}), so
 * {@link getCompsDataSource} returns zero candidates and the route surfaces a
 * clear "no comparable sales found" message — it does not fabricate anything.
 */

import { RentCastCompsDataSource } from "./comps-source-rentcast";

/** The subject home we want comparable sales for. Neutral facts only. */
export interface CompsSubject {
  /** Address/label of the subject home. */
  label?: string;
  /** Subject living area in square feet. */
  sqft?: number;
  /** City of the subject home. */
  city?: string;
  /** Two-letter state code. */
  state?: string;
}

/**
 * A REAL recent sale returned by a data source. This is the only thing the AI is
 * ever allowed to choose from; nothing the model emits that isn't traceable to
 * one of these (by id/address) is allowed through.
 */
export interface CandidateSale {
  /** Stable id from the source feed. */
  id: string;
  /** Street address of the sold home. */
  address: string;
  city?: string;
  /** Two-letter state code. */
  state?: string;
  /** Recorded sale price in dollars. */
  salePrice: number;
  /** ISO date (or source-formatted) of the sale. */
  saleDate?: string;
  /** Living area in square feet. */
  sqft: number;
  beds?: number;
  baths?: number;
  /** Distance from the subject in miles, when the source provides it. */
  distanceMiles?: number;
  /**
   * True when this record is ILLUSTRATIVE sample data, NOT a real recorded sale
   * (issue #127). Mirrors the `isSample` listings pattern. Anything carrying
   * this flag must be visibly labeled "Sample data — illustrative, not real
   * sales" wherever it surfaces in the UI. Real connectors leave it unset.
   */
  sample?: boolean;
}

/**
 * The data-access contract. ALL real-sale reads for the comps AI go through an
 * implementation of this. A real connector implements `fetchRecentSales` against
 * its API; everything downstream (prompt, parser, route) stays unchanged.
 */
export interface CompsDataSource {
  fetchRecentSales(subject: CompsSubject): Promise<CandidateSale[]>;
}

/**
 * The default, no-op source: no feed configured → zero candidates. This is what
 * keeps the feature honest in the default build — with nothing wired up, the
 * route returns "no comparable sales found" instead of inventing comps.
 */
export const NullCompsDataSource: CompsDataSource = {
  async fetchRecentSales(): Promise<CandidateSale[]> {
    return [];
  },
};

/**
 * ILLUSTRATIVE sample comps source (issue #127).
 *
 * This source NEVER returns real recorded sales. It synthesizes a small,
 * clearly-flagged set of plausible-looking comparable sales derived
 * DETERMINISTICALLY from the subject, so the "Auto-find comps" UX can be
 * demonstrated end-to-end without a Claude key or a paid data feed.
 *
 * HONESTY GUARDRAIL: every record it returns carries `sample: true`. Callers
 * MUST label these "Sample data — illustrative, not real sales" and must never
 * present them as genuine recent sales. This mirrors the `isSample` listings
 * pattern (ADR-011). It is selected only behind the demo flag in the UI path,
 * never by the server default ({@link getCompsDataSource} stays the null source).
 */
export const SampleCompsDataSource: CompsDataSource = {
  async fetchRecentSales(subject: CompsSubject): Promise<CandidateSale[]> {
    // Baseline subject sqft. If the subject gives us nothing usable we fall back
    // to a reasonable default so the UX still has something to show.
    const baseSqft =
      typeof subject.sqft === "number" &&
      Number.isFinite(subject.sqft) &&
      subject.sqft > 0
        ? Math.round(subject.sqft)
        : 1800;

    // A plausible baseline $/sqft for the illustrative set. Deliberately a round,
    // obviously-synthetic number — this is not market data.
    const basePricePerSqft = 250;

    const city = subject.city;
    const state = subject.state;

    // Deterministic spread of offsets: sqft delta (%), days-ago, distance, and a
    // small $/sqft nudge so the comps aren't all identical. Fixed table → same
    // subject always yields the same sample set.
    const offsets = [
      { sqftPct: -0.04, daysAgo: 28, distanceMiles: 0.3, ppsfDelta: 6 },
      { sqftPct: 0.05, daysAgo: 45, distanceMiles: 0.5, ppsfDelta: -4 },
      { sqftPct: -0.09, daysAgo: 62, distanceMiles: 0.8, ppsfDelta: 10 },
      { sqftPct: 0.11, daysAgo: 80, distanceMiles: 1.1, ppsfDelta: -8 },
      { sqftPct: 0.0, daysAgo: 96, distanceMiles: 1.4, ppsfDelta: 0 },
    ];

    // Anchor the "recent-ish" sale dates to the subject so output is stable
    // across runs (no Date.now()): walk back from a fixed reference date.
    const reference = new Date("2025-01-01T00:00:00.000Z");

    return offsets.map((o, i) => {
      const sqft = Math.max(400, Math.round(baseSqft * (1 + o.sqftPct)));
      const pricePerSqft = basePricePerSqft + o.ppsfDelta;
      const salePrice = Math.round((sqft * pricePerSqft) / 1000) * 1000;
      const saleDate = new Date(
        reference.getTime() - o.daysAgo * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10);

      return {
        id: `sample-comp-${i + 1}`,
        address: `${100 + i * 4} Sample St`,
        city,
        state,
        salePrice,
        saleDate,
        sqft,
        distanceMiles: o.distanceMiles,
        sample: true,
      } satisfies CandidateSale;
    });
  },
};

/**
 * The seam. Returns the configured data source, or {@link NullCompsDataSource}
 * by default. The first real connector — RentCast (issue #169) — plugs in HERE,
 * gated on the `COMPS_DATA_SOURCE` env var AND its API key; until then every
 * caller gets zero candidates.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */
export function getCompsDataSource(): CompsDataSource {
  // RentCast: selected only when `COMPS_DATA_SOURCE === "rentcast"` AND its
  // server key is present. Without the key there are no real candidates, so we
  // fall back to the null source rather than wire up a source that can't query.
  if (
    process.env.COMPS_DATA_SOURCE === "rentcast" &&
    Boolean(process.env.RENTCAST_API_KEY)
  ) {
    return new RentCastCompsDataSource();
  }
  // Default: the null source, so no source == no fabricated comps.
  return NullCompsDataSource;
}
