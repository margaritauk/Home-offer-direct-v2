/**
 * Get-ready tool math (issue #98): an educational credit-readiness checklist +
 * a down-payment / closing-cost savings goal with progress.
 *
 * GUARDRAIL (#98): EDUCATION, not financial or credit advice. The checklist
 * items are generic best-practice steps (pull your reports, dispute errors,
 * lower utilization, avoid new credit) — we never collect a score, give a
 * number, or tell the buyer they will/won't qualify. The savings math is a
 * transparent target-vs-saved percentage, clearly an estimate.
 */

/** One educational credit-readiness step. Content is static; state is the check. */
export interface CreditChecklistItem {
  id: string;
  label: string;
  /** Why it matters — neutral, educational framing. */
  detail: string;
}

/**
 * The default educational checklist. Deliberately generic best practices, with
 * no scores, thresholds, or "you will qualify" claims (SAFE Act / not advice).
 */
export const CREDIT_CHECKLIST: CreditChecklistItem[] = [
  {
    id: "pull-reports",
    label: "Pull your free credit reports",
    detail:
      "You can request reports from all three bureaus at AnnualCreditReport.com. Reviewing them is the starting point.",
  },
  {
    id: "dispute-errors",
    label: "Dispute any errors you find",
    detail:
      "Mistakes on a report are common. Each bureau has a process to dispute inaccurate items.",
  },
  {
    id: "lower-utilization",
    label: "Pay down credit-card balances",
    detail:
      "Lowering how much of your available credit you use is a widely cited factor in credit health.",
  },
  {
    id: "avoid-new-credit",
    label: "Avoid opening new credit before applying",
    detail:
      "New accounts and hard inquiries shortly before a mortgage application can complicate underwriting.",
  },
  {
    id: "pay-on-time",
    label: "Keep every payment on time",
    detail:
      "Consistent on-time payments over several months is a common readiness signal lenders look for.",
  },
  {
    id: "gather-docs",
    label: "Start gathering income & asset documents",
    detail:
      "Pay stubs, W-2s/1099s, and bank statements are typically requested — having them ready speeds things up.",
  },
];

export interface SavingsGoalInput {
  /** Target home price in dollars. */
  homePrice: number;
  /** Down payment target as a percent of price (e.g. 10). */
  downPaymentPercent: number;
  /** Estimated closing costs as a percent of price (e.g. 3). */
  closingCostPercent: number;
  /** How much the buyer has saved so far, in dollars. */
  currentSaved: number;
}

export interface SavingsGoalResult {
  /** Down payment target in dollars. */
  downPaymentTarget: number;
  /** Closing-cost target in dollars. */
  closingCostTarget: number;
  /** Total cash target = down payment + closing costs. */
  totalTarget: number;
  /** Saved so far (echoed, sanitized). */
  saved: number;
  /** Progress toward the target, 0–100 (capped at 100). */
  percentComplete: number;
  /** Remaining gap to the target, floored at 0. */
  gap: number;
  /** True once saved >= target. */
  reached: boolean;
}

function nonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/**
 * Compute the savings goal: target = (down% + closing%) of price, compared to
 * what's saved. Returns dollar targets, a 0–100 progress, and the remaining
 * gap. All inputs are sanitized; an invalid price yields a zero target.
 */
export function savingsGoal(input: SavingsGoalInput): SavingsGoalResult {
  const homePrice = nonNeg(input.homePrice);
  const downPct = clampPercent(input.downPaymentPercent);
  const closingPct = clampPercent(input.closingCostPercent);
  const saved = nonNeg(input.currentSaved);

  const downPaymentTarget = homePrice * (downPct / 100);
  const closingCostTarget = homePrice * (closingPct / 100);
  const totalTarget = downPaymentTarget + closingCostTarget;

  const percentComplete =
    totalTarget > 0 ? Math.min(100, (saved / totalTarget) * 100) : 0;
  const gap = Math.max(0, totalTarget - saved);

  return {
    downPaymentTarget,
    closingCostTarget,
    totalTarget,
    saved,
    percentComplete,
    gap,
    reached: totalTarget > 0 && saved >= totalTarget,
  };
}
