/**
 * Funnel & north-star event definitions (cross-cutting §7).
 *
 * A minimal, PRIVACY-FIRST event vocabulary for the money-spine funnel. These
 * are typed names + tiny, NON-PII payloads only:
 *   savings-calc completion → offer-builder start → suggested-range viewed →
 *   offer-builder completion (the north-star: an offer built with a concession
 *   ask + an estimated captured-savings figure).
 *
 * HARD PRIVACY RULE: payloads carry ONLY coarse, non-identifying transaction
 * facts (a market band label, a rounded dollar bucket, a boolean). NEVER any
 * protected-class / PII data, free text, addresses, or names. The
 * {@link sanitizeProps} guard in ./index enforces the shape at the seam.
 */

import type { MarketBand } from "@/lib/market/types";

/** The funnel event names, as a closed union (no arbitrary strings). */
export type AnalyticsEventName =
  | "savings_calc_completed"
  | "offer_builder_started"
  | "suggested_range_viewed"
  | "offer_builder_completed"
  | "market_read_viewed";

/** Non-PII property values we allow on an event. */
export type AnalyticsPropValue = string | number | boolean;

export type AnalyticsProps = Record<string, AnalyticsPropValue>;

/** A single emitted event: a name + a sanitized, non-PII payload. */
export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props: AnalyticsProps;
}

/**
 * Typed payloads per event. Each is intentionally coarse — buckets and labels,
 * never raw amounts that could fingerprint a deal.
 */
export interface AnalyticsEventPayloads {
  savings_calc_completed: {
    /** Coarse bucket of estimated savings (e.g. "5k-10k"). */
    savingsBucket?: string;
    /** Capture-rate band the buyer modeled. */
    captureBand?: "none" | "partial" | "full";
  };
  market_read_viewed: {
    band: MarketBand;
    /** Whether the read came from manual entry or a live pull. */
    source?: "manual" | "rentcast" | "sample";
  };
  offer_builder_started: {
    /** Whether a market read existed when they started. */
    hasMarketRead?: boolean;
  };
  suggested_range_viewed: {
    /** Whether comps + market were both present. */
    hasComps: boolean;
    hasMarket: boolean;
    /** Where the band emphasized. */
    emphasis?: "lower" | "middle" | "upper" | "none";
  };
  offer_builder_completed: {
    /** The north-star: did the offer include a concession (savings) ask? */
    hasConcessionAsk: boolean;
    /** Coarse bucket of the estimated captured savings. */
    savingsBucket?: string;
  };
}

/**
 * Coarse savings bucket helper — turns a raw dollar amount into a non-PII band.
 * PURE. Used so we never log a precise figure that could fingerprint a deal.
 */
export function savingsBucket(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "0";
  }
  if (amount < 5000) return "0-5k";
  if (amount < 10000) return "5k-10k";
  if (amount < 20000) return "10k-20k";
  if (amount < 40000) return "20k-40k";
  return "40k+";
}
