/**
 * Guided comp adjustments (I4).
 *
 * The Comps Worksheet already lets a buyer enter a dollar adjustment per comp.
 * This module adds the GUIDANCE a CMA uses — suggested adjustment PROMPTS for the
 * standard categories (condition, GLA/sqft, garage/parking, lot, recency,
 * bed/bath) and a plain explanation of the methodology. It does NOT auto-adjust:
 * the buyer still types the dollar figure, so no valuation is fabricated.
 *
 * The one bit of math here is pure and unit-tested: from the subject vs comp
 * sqft delta we derive a $/sqft-based size-adjustment ILLUSTRATION (a range), and
 * we flag when total adjustments are large relative to the comp's price (the
 * appraiser net/gross-cap heuristic). None of it outputs a price or a directive.
 *
 * Compliance:
 *  - UPL: methodology + prompts, never a directive valuation; the lender's
 *    appraisal governs. We never emit an "offer $X" or a final value.
 *  - FHA: a "location/site adjustment" is framed on OBJECTIVE site factors only
 *    (busy road, lot, view) — never neighborhood-by-demographics.
 *
 * Sources (see docs/backlog/contributions/researcher.md + buyer-agent-advisor.md,
 * as of 2026):
 *  - Sales-comparison approach: adjust each comp TOWARD the subject; a superior
 *    comp adjusts DOWN, an inferior comp adjusts UP; net the adjustments; weight
 *    closer/recent comps more (Nolo glossary; sales-comparison method framing).
 *  - Appraiser adjustment guardrails commonly cited (Fannie Mae / URAR practice):
 *    a single line item over ~10% of sale price, NET adjustments over ~15%, or
 *    GROSS adjustments over ~25% warrant extra support — large totals usually
 *    mean the comp is weak. Presented as CONTEXT, not a hard rule.
 */

/** Conventional appraiser adjustment guardrails, as fractions of sale price. */
export const ADJUSTMENT_CAPS = {
  /** A single line-item adjustment over this share warrants extra support. */
  singleLine: 0.1,
  /** Net (signed sum) adjustment over this share warrants extra support. */
  net: 0.15,
  /** Gross (absolute sum) adjustment over this share warrants extra support. */
  gross: 0.25,
} as const;

export interface AdjustmentPrompt {
  id:
    | "condition"
    | "sqft"
    | "garage"
    | "lot"
    | "recency"
    | "bed-bath";
  label: string;
  /** What to compare between the comp and the subject. */
  prompt: string;
  /** Plain-English direction guard (the classic sign-error fix). */
  direction: string;
}

/**
 * The standard adjustment categories with the direction made explicit. These are
 * static (the same prompts walk every comp); the sqft prompt is enriched with a
 * computed illustration by {@link suggestAdjustmentPrompts}.
 */
export const ADJUSTMENT_PROMPTS: readonly AdjustmentPrompt[] = [
  {
    id: "condition",
    label: "Condition & updates",
    prompt:
      "Is the comp more or less updated than your subject (kitchen, baths, systems, roof)?",
    direction:
      "If the comp is in better condition, adjust it DOWN (its price overstates your subject). If it's rougher, adjust it UP.",
  },
  {
    id: "sqft",
    label: "Living area (GLA / sqft)",
    prompt:
      "How does the comp's finished square footage compare to your subject?",
    direction:
      "A larger comp adjusts DOWN toward your smaller subject; a smaller comp adjusts UP. Use a $/sqft basis, but don't scale naively — price-per-sqft falls as size rises.",
  },
  {
    id: "garage",
    label: "Garage / parking",
    prompt:
      "Does the comp have more or fewer covered/parking spaces than your subject?",
    direction:
      "More parking than your subject → adjust the comp DOWN; less → adjust UP.",
  },
  {
    id: "lot",
    label: "Lot & objective site factors",
    prompt:
      "Compare lot size and objective site factors only — busy road, corner, view, slope.",
    direction:
      "A superior lot/site adjusts the comp DOWN; an inferior one adjusts UP. Site factors are physical only — never the neighborhood's people.",
  },
  {
    id: "recency",
    label: "Recency / market conditions",
    prompt:
      "How long ago did the comp sell, and which way has the market moved since?",
    direction:
      "In a rising market an older sale adjusts UP; in a falling market it adjusts DOWN. Reconcile this with your market-conditions read so you don't double-count the trend.",
  },
  {
    id: "bed-bath",
    label: "Bed / bath count",
    prompt:
      "Does the comp have a different bedroom or bathroom count than your subject?",
    direction:
      "More beds/baths than your subject → adjust the comp DOWN; fewer → adjust UP.",
  },
] as const;

export interface SizeAdjustmentHint {
  /** Subject minus comp sqft (positive = subject is larger). */
  sqftDelta: number;
  /** The comp's implied $/sqft used for the illustration, or null. */
  pricePerSqft: number | null;
  /**
   * Illustrative dollar adjustment toward the subject, or null when it can't be
   * computed. Sign convention matches `Comp.adjustment` (positive = comp is
   * SUPERIOR, i.e. larger than the subject, so its price is adjusted down).
   * This is a starting illustration, NOT a prescribed number.
   */
  illustrativeAdjustment: number | null;
  /** Plain-English note on the direction for this specific pair. */
  note: string;
}

function isPositive(n: number | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/**
 * Compute an illustrative size adjustment for a comp from the sqft delta and the
 * comp's own $/sqft. PURE. Returns nulls (never throws) when inputs are unusable.
 *
 * Sign: a comp LARGER than the subject is "superior" on size, so we illustrate a
 * POSITIVE adjustment (the worksheet subtracts it: `salePrice - adjustment`),
 * matching the existing `Comp.adjustment` convention. We DO NOT modify any comp
 * — the buyer enters the figure they choose.
 */
export function suggestSizeAdjustment(
  subjectSqft: number,
  comp: { salePrice: number; sqft: number },
): SizeAdjustmentHint {
  const validSubject = isPositive(subjectSqft);
  const validComp = isPositive(comp.sqft) && isPositive(comp.salePrice);

  if (!validComp || !validSubject) {
    return {
      sqftDelta: validSubject && isPositive(comp.sqft) ? subjectSqft - comp.sqft : 0,
      pricePerSqft: null,
      illustrativeAdjustment: null,
      note: "Enter the subject's and this comp's square footage to see a size-adjustment illustration.",
    };
  }

  const pricePerSqft = comp.salePrice / comp.sqft;
  const sqftDelta = subjectSqft - comp.sqft; // + when subject is bigger
  // Comp is superior (larger) when sqftDelta < 0 → positive adjustment.
  // `+ 0` normalizes a possible -0 (from Math.round(-0)) to 0.
  const illustrativeAdjustment = Math.round(-sqftDelta * pricePerSqft) + 0;

  let note: string;
  if (sqftDelta === 0) {
    note = "Same finished size — no size adjustment needed.";
  } else if (sqftDelta < 0) {
    note = `This comp is about ${Math.abs(sqftDelta)} sqft larger than your subject — that points to adjusting it DOWN (a positive adjustment).`;
  } else {
    note = `This comp is about ${sqftDelta} sqft smaller than your subject — that points to adjusting it UP (a negative adjustment).`;
  }

  return { sqftDelta, pricePerSqft, illustrativeAdjustment, note };
}

export interface AdjustmentGuidance {
  prompts: readonly AdjustmentPrompt[];
  /** The computed size illustration for this comp. */
  size: SizeAdjustmentHint;
}

/**
 * Produce the per-comp adjustment guidance: the static category prompts plus the
 * computed size illustration. The buyer reads this and enters their own
 * adjustment — nothing is auto-applied. PURE.
 */
export function suggestAdjustmentPrompts(
  subjectSqft: number,
  comp: { salePrice: number; sqft: number },
): AdjustmentGuidance {
  return {
    prompts: ADJUSTMENT_PROMPTS,
    size: suggestSizeAdjustment(subjectSqft, comp),
  };
}

export interface AdjustmentSizeCheck {
  /** |adjustment| ÷ salePrice, or null when not computable. */
  ratio: number | null;
  /** True when the single line-item adjustment exceeds the conventional cap. */
  exceedsSingleLineCap: boolean;
  /** A neutral note when the adjustment looks large, else null. */
  note: string | null;
}

/**
 * Flag when a SINGLE comp's net adjustment is large relative to its sale price —
 * the "your adjustment looks high; this comp may be weak" heuristic. PURE. This
 * never says "use a different number"; it surfaces the appraiser convention as
 * context so the buyer can pick better comps.
 */
export function checkAdjustmentSize(comp: {
  salePrice: number;
  adjustment?: number;
}): AdjustmentSizeCheck {
  const adjustment = Number.isFinite(comp.adjustment ?? 0)
    ? comp.adjustment ?? 0
    : 0;
  if (!isPositive(comp.salePrice)) {
    return { ratio: null, exceedsSingleLineCap: false, note: null };
  }
  const ratio = Math.abs(adjustment) / comp.salePrice;
  const exceedsSingleLineCap = ratio > ADJUSTMENT_CAPS.singleLine;
  return {
    ratio,
    exceedsSingleLineCap,
    note: exceedsSingleLineCap
      ? `This adjustment is about ${Math.round(ratio * 100)}% of the comp's price. Appraisers usually expect a single adjustment under ~${Math.round(ADJUSTMENT_CAPS.singleLine * 100)}% — a large one often means a closer comp would be stronger.`
      : null,
  };
}
