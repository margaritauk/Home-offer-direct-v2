/**
 * Market-conditions read types (A1 / ADR-013).
 *
 * The buyer reads "market temperature" from four signals an agent uses:
 * days-on-market, list-to-sale ratio, months-of-supply, and the recent price
 * trend. {@link MarketStats} is the neutral, FHA-safe input shape (transactional
 * market facts only — deliberately NO school/demographic/desirability fields).
 * {@link MarketRead} is the plain-English classification {@link classifyMarket}
 * produces from it.
 *
 * Compliance (FHA): only transactional metrics live here — no neighborhood
 * "desirability", safety, or school-quality fields, which are steering vectors.
 * Compliance (UPL): the read describes conditions + typical buyer responses as
 * trade-offs; it NEVER carries a directive price.
 */

/** Where a {@link MarketStats} figure came from (drives the source/date stamp). */
export type MarketStatsSource = "rentcast" | "manual" | "sample";

/**
 * Neutral market statistics for an area/segment. Every field is optional so the
 * read degrades gracefully on partial/thin data. FHA: transactional facts only.
 */
export interface MarketStats {
  /** Human label for the area/segment (e.g. "78701 · single-family"). */
  areaLabel?: string;
  /** Median days a listing is active before going under contract. */
  daysOnMarket?: number;
  /** Sale ÷ list price, as a PERCENT (e.g. 102 = homes selling 2% above ask). */
  listToSaleRatio?: number;
  /** Months of inventory at the current sales pace. */
  monthsOfSupply?: number;
  /** Median price for context (not classified; shown for transparency). */
  medianPrice?: number;
  /** Recent median-price trend, as a PERCENT change (e.g. -1.5 = down 1.5%). */
  priceTrendPct?: number;
  /** As-of / retrieval date for the source + date stamp (ISO or display string). */
  asOf?: string;
  /** Provenance of these figures, for the cited-source convention. */
  source: MarketStatsSource;
}

/** The market-temperature band, ordered cool → hot for the buyer. */
export type MarketBand =
  | "strong-buyer"
  | "buyer"
  | "balanced"
  | "seller"
  | "strong-seller"
  | "unknown";

/**
 * One signal's contribution to the read: the metric, its value echoed back, and
 * a plain-English "what this means for you" framed as a TRADE-OFF (never a
 * directive). `lean` says which side this single signal points to.
 */
export interface MarketFactor {
  /** Stable id (e.g. "months-of-supply"). */
  id: string;
  /** Display label for the metric. */
  label: string;
  /** The value, formatted for display (e.g. "9 days", "102%"). */
  display: string;
  /** Which way this one signal leans. */
  lean: "buyer" | "balanced" | "seller" | "unknown";
  /** The trade-off note — descriptive, never "offer $X". */
  meaning: string;
}

/** The classification {@link classifyMarket} returns. */
export interface MarketRead {
  band: MarketBand;
  /** Plain-English headline (e.g. "Leans toward a seller's market"). */
  headline: string;
  /** Per-signal trade-off breakdown, in display order. */
  factors: MarketFactor[];
  /** Caveats — thin-data / low-confidence / "snapshot, conditions move". */
  caveats: string[];
  /** Number of usable (finite, in-range) signals that fed the read. */
  signalCount: number;
  /** True when too few signals to classify confidently. */
  lowConfidence: boolean;
}
