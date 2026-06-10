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
 * The seam. Returns the configured data source, or {@link NullCompsDataSource}
 * by default. A real ATTOM/MLS connector plugs in HERE (gated on the
 * `COMPS_DATA_SOURCE` env var); until then every caller gets zero candidates.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */
export function getCompsDataSource(): CompsDataSource {
  // No real connector ships in this scaffolding. When `COMPS_DATA_SOURCE` names
  // a supported provider, return its implementation here. Default: the null
  // source, so no source == no fabricated comps.
  return NullCompsDataSource;
}
