/**
 * Comps worksheet math (issue #95).
 *
 * The buyer enters a subject home and a handful of comparable sales (price,
 * sqft, and a dollar adjustment for differences like condition or a finished
 * basement). This module computes each comp's adjusted $/sqft and rolls them up
 * into an estimated fair-value RANGE for the subject.
 *
 * IMPORTANT (guardrail, #95): this is an ESTIMATE, not an appraisal. The UI
 * labels it as such. The math is deliberately simple and transparent (mean and
 * spread of adjusted $/sqft) — it is decision-support, not a valuation product.
 */

export interface SubjectHome {
  /** Subject living area in square feet. */
  sqft: number;
}

export interface Comp {
  id: string;
  /** Address/label. Facts only; not used in the math. */
  label: string;
  /** Recorded sale price in dollars. */
  salePrice: number;
  /** Living area in square feet. */
  sqft: number;
  /**
   * Net dollar adjustment applied to this comp to make it comparable to the
   * subject. Positive = the comp is *superior* (e.g. nicer finishes) so we
   * subtract value to compare; we apply it as `salePrice - adjustment`. Negative
   * = comp is inferior, adjusting its implied value up. Defaults to 0.
   */
  adjustment?: number;
}

export interface CompResult extends Comp {
  /** salePrice - adjustment, floored at 0. */
  adjustedPrice: number;
  /** adjustedPrice / sqft, or null when sqft is invalid. */
  adjustedPricePerSqft: number | null;
}

export interface CompsEstimate {
  /** Per-comp breakdown (adjusted price + $/sqft). */
  comps: CompResult[];
  /** Comps that produced a usable $/sqft (valid sqft & price). */
  usableCount: number;
  /** Mean adjusted $/sqft across usable comps, or null when none. */
  avgPricePerSqft: number | null;
  /** Lowest adjusted $/sqft among usable comps, or null. */
  minPricePerSqft: number | null;
  /** Highest adjusted $/sqft among usable comps, or null. */
  maxPricePerSqft: number | null;
  /** Low end of the estimated fair value for the subject, or null. */
  estimatedLow: number | null;
  /** Midpoint estimate (avg $/sqft × subject sqft), or null. */
  estimatedMid: number | null;
  /** High end of the estimated fair value for the subject, or null. */
  estimatedHigh: number | null;
}

function isPositive(n: number | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function adjust(comp: Comp): CompResult {
  const adjustment = Number.isFinite(comp.adjustment ?? 0) ? comp.adjustment ?? 0 : 0;
  const adjustedPrice = isPositive(comp.salePrice)
    ? Math.max(0, comp.salePrice - adjustment)
    : 0;
  const adjustedPricePerSqft = isPositive(comp.sqft) && adjustedPrice > 0
    ? adjustedPrice / comp.sqft
    : null;
  return { ...comp, adjustedPrice, adjustedPricePerSqft };
}

/**
 * Compute each comp's adjusted $/sqft and an estimated fair-value range for the
 * subject. The range is the subject's sqft × the min / mean / max adjusted
 * $/sqft of the usable comps — a transparent spread, NOT an appraised value.
 *
 * Returns nulls (rather than throwing) when there are no usable comps or the
 * subject sqft is invalid, so the UI can show an empty/awaiting state.
 */
export function compsEstimate(subject: SubjectHome, comps: Comp[]): CompsEstimate {
  const results = comps.map(adjust);
  const perSqft = results
    .map((c) => c.adjustedPricePerSqft)
    .filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);

  const usableCount = perSqft.length;

  if (usableCount === 0) {
    return {
      comps: results,
      usableCount: 0,
      avgPricePerSqft: null,
      minPricePerSqft: null,
      maxPricePerSqft: null,
      estimatedLow: null,
      estimatedMid: null,
      estimatedHigh: null,
    };
  }

  const avg = perSqft.reduce((s, v) => s + v, 0) / usableCount;
  const min = Math.min(...perSqft);
  const max = Math.max(...perSqft);

  const subjectSqft = isPositive(subject.sqft) ? subject.sqft : null;

  return {
    comps: results,
    usableCount,
    avgPricePerSqft: avg,
    minPricePerSqft: min,
    maxPricePerSqft: max,
    estimatedLow: subjectSqft ? min * subjectSqft : null,
    estimatedMid: subjectSqft ? avg * subjectSqft : null,
    estimatedHigh: subjectSqft ? max * subjectSqft : null,
  };
}
