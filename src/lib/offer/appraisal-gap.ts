/**
 * Appraisal-gap coverage helper AT OFFER TIME (A3).
 *
 * PURE. Given a contract/offer price, a HYPOTHETICAL appraised value, and how
 * much of any gap the buyer is willing to cover, it computes the cash the buyer
 * would bring to cover the gap and the exposure that remains. No React/IO.
 *
 * This is the PRE-OFFER PLANNING view: "if I offer $X and it appraises at $V,
 * how much gap cash am I committing to?" It is DISTINCT from the post-appraisal
 * Clear-to-Close low-appraisal calculator (`src/lib/tools/clear-to-close.ts`),
 * which reacts after the number comes in. The two intentionally SHARE NO STATE.
 * The underlying arithmetic — gap = max(0, contract − appraised) — is the same
 * idea, but this view models a coverage *commitment* the buyer is sizing before
 * they offer.
 *
 * Key facts the UI must carry (UPL/accuracy):
 *  - Lenders lend on the LOWER of price or appraisal, so gap cash is on top of
 *    the down payment + closing costs and is generally NOT financeable.
 *  - Competitive norms for context only (market-dependent, dated): ~3–5% to stay
 *    competitive, ~5–10% to win a bidding war — Researcher brief, 2026-06-12
 *    (CUSO Home Lending / US News, 2025). NEVER a directive to cover a figure.
 */

export interface AppraisalGapInputs {
  /** The buyer's contract/offer price, in dollars. */
  contractPrice: number;
  /** A hypothetical appraised value to model against, in dollars. */
  appraisedValue: number;
  /**
   * How much of the gap the buyer is willing to cover in cash, in dollars.
   * When omitted/<=0 we model covering the FULL gap. Capped at the gap (you
   * never "cover" more than the shortfall).
   */
  coverageCap?: number;
}

export interface AppraisalGapModel {
  /** The shortfall = max(0, contract − appraised). 0 when it appraises at/above. */
  gap: number;
  /** True when appraisedValue < contractPrice. */
  isLow: boolean;
  /**
   * Cash the buyer commits to cover, in dollars: min(gap, coverageCap) when a
   * cap is given, else the full gap. Never negative.
   */
  cashToCover: number;
  /**
   * Gap left UNcovered after the buyer's coverage, in dollars. When this is > 0
   * the deal still needs a renegotiation or an exit to close — the helper makes
   * that exposure explicit. Never negative.
   */
  remainingExposure: number;
  /** True when the buyer chose to cover only part of the gap. */
  partialCoverage: boolean;
}

function safeMoney(n: number | undefined): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Model the offer-time appraisal-gap coverage of the buyer's own inputs. PURE.
 *
 * - Appraised >= contract → gap 0, cashToCover 0, remainingExposure 0 (never a
 *   negative "credit").
 * - No coverageCap (or <= 0) → cover the full gap.
 * - coverageCap above the gap → clamps to the gap (no over-coverage).
 * - NaN/negative inputs are treated as 0.
 */
export function modelGap(inputs: AppraisalGapInputs): AppraisalGapModel {
  const contractPrice = safeMoney(inputs.contractPrice);
  const appraisedValue = safeMoney(inputs.appraisedValue);

  const gap = Math.max(0, contractPrice - appraisedValue);
  const isLow = gap > 0;

  // A coverage cap <= 0 (or absent) means "cover the whole gap".
  const rawCap = safeMoney(inputs.coverageCap);
  const hasCap = rawCap > 0;
  const cashToCover = hasCap ? Math.min(rawCap, gap) : gap;
  const remainingExposure = Math.max(0, gap - cashToCover);
  const partialCoverage = isLow && remainingExposure > 0;

  return {
    gap,
    isLow,
    cashToCover,
    remainingExposure,
    partialCoverage,
  };
}
