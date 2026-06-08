/**
 * Clear-to-close tracker + low-appraisal calculator (issue #109).
 *
 * Two pieces:
 *  1. A clear-to-close checklist (appraisal ordered/received, conditions
 *     submitted, final approval) tracked with status + dates.
 *  2. A low-appraisal calculator: when the appraisal comes in below the
 *     contract price, the lender bases the loan on the LOWER value, so the buyer
 *     must cover the gap. This computes the gap and the cash impact of each
 *     neutral option (more cash to keep LTV, renegotiate, contingency exit).
 *
 * IMPORTANT (guardrail, #109): these are ESTIMATES, not lending advice, and the
 * options are presented NEUTRALLY — they are not recommendations. The UI labels
 * it as such.
 */

export type StepState = "not-started" | "in-progress" | "done";

export interface ClearToCloseStep {
  id: string;
  label: string;
  state: StepState;
  /** ISO date string for the milestone, or "". */
  date: string;
}

/** The canonical clear-to-close milestones. */
export const CLEAR_TO_CLOSE_STEPS: ReadonlyArray<
  Omit<ClearToCloseStep, "state" | "date">
> = [
  { id: "appraisal-ordered", label: "Appraisal ordered" },
  { id: "appraisal-received", label: "Appraisal received" },
  { id: "conditions-submitted", label: "Underwriting conditions submitted" },
  { id: "final-approval", label: "Final approval / clear to close" },
];

export interface ClearToCloseProgress {
  total: number;
  done: number;
  /** done === total. */
  allDone: boolean;
  /** 0–100, rounded. */
  percent: number;
}

export function clearToCloseProgress(
  steps: ClearToCloseStep[],
): ClearToCloseProgress {
  const total = steps.length;
  const done = steps.filter((s) => s.state === "done").length;
  return {
    total,
    done,
    allDone: total > 0 && done === total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export interface AppraisalInput {
  /** Agreed contract price in dollars. */
  contractPrice: number;
  /** Appraised value in dollars. */
  appraisedValue: number;
  /**
   * Down payment the buyer already planned, in dollars. Used to derive the
   * original LTV so the "keep your LTV" option can be framed.
   */
  plannedDownPayment: number;
}

export interface AppraisalGapResult {
  /** Positive when the appraisal is below contract (a shortfall); else 0. */
  gap: number;
  /** True when appraisedValue < contractPrice. */
  isLow: boolean;
  /**
   * OPTION A — bring more cash to closing to keep the lender's loan-to-value
   * (the lender lends on the lower appraised value, so the buyer covers the full
   * gap in cash on top of the planned down payment).
   */
  optionMoreCash: {
    /** Extra cash needed beyond the planned down payment (= the gap). */
    extraCash: number;
    /** Total cash now needed for down payment + gap. */
    totalCashNeeded: number;
  };
  /**
   * OPTION B — renegotiate the price down to the appraised value. Cash impact is
   * zero gap to cover; the buyer's exposure becomes the price reduction sought.
   */
  optionRenegotiate: {
    /** The price reduction that would close the gap entirely. */
    priceReductionToClose: number;
    /** Extra cash needed if the seller agrees to meet at appraised value (0). */
    extraCash: number;
  };
  /**
   * OPTION C — use the appraisal contingency to exit. No additional cash; the
   * buyer walks and (typically) recovers earnest money per the contract.
   */
  optionContingencyExit: {
    extraCash: number;
  };
}

function safeMoney(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Compute the appraisal gap and the neutral cash impact of each option. Pure.
 * When the appraisal meets or exceeds the contract price, the gap is 0 and every
 * option's extra cash is 0 (there's nothing to cover).
 */
export function appraisalGap(input: AppraisalInput): AppraisalGapResult {
  const contractPrice = safeMoney(input.contractPrice);
  const appraisedValue = safeMoney(input.appraisedValue);
  const plannedDownPayment = safeMoney(input.plannedDownPayment);

  const gap = Math.max(0, contractPrice - appraisedValue);
  const isLow = gap > 0;

  return {
    gap,
    isLow,
    optionMoreCash: {
      extraCash: gap,
      totalCashNeeded: plannedDownPayment + gap,
    },
    optionRenegotiate: {
      priceReductionToClose: gap,
      extraCash: 0,
    },
    optionContingencyExit: {
      extraCash: 0,
    },
  };
}
