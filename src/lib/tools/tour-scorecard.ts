/**
 * Tour scorecard math (issue #94).
 *
 * A buyer scores each home they tour on a consistent, weighted rubric (location,
 * condition, layout, price-vs-value, natural light, outdoor space, commute) with
 * 1–5 ratings, then compares homes by a single weighted total. This module is
 * the PURE core: no React, no storage — just the rubric definition and the
 * weighted-score / ranking math, so it can be unit-tested in isolation.
 *
 * GUARDRAIL (FHA, #94): the rubric criteria are all property facts. Free-text
 * notes are screened in the UI via `screenText` before they're persisted — see
 * the component. Nothing here solicits or stores protected-class signals.
 */

import type { PropertyType } from "@/lib/listings/types";

/** A criterion the buyer rates 1–5, with a relative importance weight. */
export interface ScorecardCriterion {
  id: string;
  label: string;
  /** Short helper text describing what a high score means. */
  hint?: string;
  /** Relative importance weight (>= 0). Defaults to 1 when omitted. */
  weight: number;
}

/**
 * The default rubric. Weights are relative (the total is normalized), so these
 * are sensible starting points the buyer can tune. All are property facts.
 */
export const DEFAULT_CRITERIA: ScorecardCriterion[] = [
  { id: "location", label: "Location", hint: "Convenience, amenities, noise", weight: 3 },
  { id: "condition", label: "Condition", hint: "Move-in ready vs. needs work", weight: 3 },
  { id: "layout", label: "Layout & flow", hint: "How the floor plan lives", weight: 2 },
  { id: "price-value", label: "Price vs. value", hint: "Asking price for what you get", weight: 3 },
  { id: "light", label: "Natural light", hint: "Brightness and exposure", weight: 1 },
  { id: "outdoor", label: "Outdoor space", hint: "Yard, balcony, parking", weight: 1 },
  { id: "commute", label: "Commute", hint: "Time to the places you go", weight: 2 },
];

/**
 * A facts-only snapshot of the listing a scored home was created from, copied at
 * add-time so the scorecard entry stays self-explanatory (photo + price/beds/
 * baths/sqft) even if the underlying feed swaps. Mirrors the `ShowingRecord`
 * snapshot posture.
 *
 * FHA: facts only — address/price/beds/baths/sqft/type. NO protected-class
 * field is ever captured here (same posture as `MyHome` and `ShowingRecord`).
 */
export interface ScoredHomeSnapshot {
  address: string;
  city?: string;
  state?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  propertyType?: PropertyType;
}

/** One home being scored: an id/label, per-criterion ratings, and notes. */
export interface ScoredHome {
  id: string;
  /** Display label (e.g. address). Still the manual-entry / fallback text. */
  label: string;
  /** The originating listing id, when added from search/showings. */
  listingId?: string;
  /**
   * Facts copied at add-time so the card can show the home, not a string.
   * Facts/buyer-content only — no protected-class field (FHA).
   */
  snapshot?: ScoredHomeSnapshot;
  /** Map of criterion id -> rating 1–5. Missing/0 means "not rated". */
  ratings: Record<string, number>;
  /** Screened free-text notes (facts only). */
  notes?: string;
  /** ISO timestamp added; enables a "recently added" sort (S0b). */
  addedAt?: string;
}

export interface HomeScore {
  /** Weighted total on a 1–5 scale (0 when nothing is rated). */
  weighted: number;
  /** Same total scaled to 0–100 for display/progress bars. */
  percent: number;
  /** Count of criteria that were actually rated (rating 1–5). */
  ratedCount: number;
}

function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n;
}

function safeWeight(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Compute a home's weighted score from its ratings and the rubric weights.
 *
 * Only criteria the buyer actually rated (rating 1–5) contribute, and the
 * divisor is the sum of *those* weights — so a half-filled card isn't penalized
 * for blank rows; it's scored on what was answered. Result is on the same 1–5
 * scale as the inputs, plus a 0–100 percent for display.
 */
export function scoreHome(
  ratings: Record<string, number>,
  criteria: ScorecardCriterion[],
): HomeScore {
  let weightedSum = 0;
  let weightTotal = 0;
  let ratedCount = 0;

  for (const c of criteria) {
    const rating = clampRating(ratings[c.id] ?? 0);
    if (rating <= 0) continue; // unrated row — excluded
    const w = safeWeight(c.weight);
    if (w <= 0) continue;
    weightedSum += rating * w;
    weightTotal += w;
    ratedCount += 1;
  }

  if (weightTotal <= 0) {
    return { weighted: 0, percent: 0, ratedCount: 0 };
  }

  const weighted = weightedSum / weightTotal;
  return {
    weighted,
    percent: (weighted / 5) * 100,
    ratedCount,
  };
}

export interface RankedHome extends ScoredHome {
  score: HomeScore;
  /** 1-based rank (ties share neither rank position is fabricated; stable). */
  rank: number;
}

/**
 * Score and rank a set of homes, highest weighted score first. Ranking is
 * stable: homes with equal scores keep their input order. Homes with nothing
 * rated sort last (score 0).
 */
export function rankHomes(
  homes: ScoredHome[],
  criteria: ScorecardCriterion[],
): RankedHome[] {
  return homes
    .map((home) => ({ ...home, score: scoreHome(home.ratings, criteria) }))
    .sort((a, b) => b.score.weighted - a.score.weighted)
    .map((home, i) => ({ ...home, rank: i + 1 }));
}
