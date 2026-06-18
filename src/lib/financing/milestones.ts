/**
 * Financing-milestone tracker core (S5-F1).
 *
 * Between offer-accepted and clear-to-close the loan is the thing most likely to
 * quietly collapse a deal. This module turns the handful of dates a buyer knows
 * about their loan — when they applied, when the appraisal is/was due, and the
 * date their financing contingency requires them to be clear-to-close by — into
 * the same `Milestone[]` the deadline engine emits, so the SHIPPED S1 machinery
 * (R1 `computeReminders` and R3 `computeNextActions`/`buildHomeRollups`) consume
 * them with NO new plumbing concept.
 *
 * Everything here is PURE (no I/O, no React) and uses the same UTC `YYYY-MM-DD`
 * frame as `lib/deadlines.ts`, so dates fire on their calendar day with no
 * timezone drift, and a date move is just a recomputation (the reminder differ
 * naturally re-fires affected reminders and drops stale ones).
 *
 * SAFE-Act content boundary: this is PROCESS education only. Copy says "ask your
 * lender"; it NEVER quotes a rate-as-offer and NEVER recommends or names a lender
 * as advice. The low-appraisal arithmetic is reused from `clear-to-close` with
 * neutral framing (see {@link financingAppraisalGap}).
 */

import {
  addDays,
  formatISO,
  isValidDate,
  parseDate,
  type Milestone,
} from "@/lib/deadlines";
import {
  appraisalGap,
  type AppraisalGapResult,
  type AppraisalInput,
} from "@/lib/tools/clear-to-close";

/** Stable ids for the financing milestones, prefixed so they never collide with
 * the deadline-engine milestone ids (`earnest-money`, `appraisal`, …). */
export const FINANCING_MILESTONE_IDS = {
  loanApplication: "financing-loan-application",
  appraisal: "financing-appraisal",
  underwritingConditions: "financing-underwriting-conditions",
  clearToClose: "financing-clear-to-close",
} as const;

export type FinancingMilestoneId =
  (typeof FINANCING_MILESTONE_IDS)[keyof typeof FINANCING_MILESTONE_IDS];

/** A single step in the financing checklist (the editable input model). */
export interface FinancingStep {
  id: FinancingMilestoneId;
  label: string;
  /** Process-framed description — SAFE-Act safe ("ask your lender", never a rate). */
  description: string;
  /** Whether buyers most often blow this one (drives the `critical` flag). */
  critical?: boolean;
  /**
   * When true this step has NO explicit date input — its date is DERIVED from the
   * deal's `financingContingencyDays` anchor (the clear-to-close-by date). The
   * tool renders it read-only.
   */
  derived?: boolean;
}

/**
 * The canonical financing checklist, extending the `clear-to-close` step model.
 * Loan-application and appraisal carry explicit buyer-entered dates; the
 * clear-to-close-by date is derived from the financing contingency anchor.
 */
export const FINANCING_STEPS: ReadonlyArray<FinancingStep> = [
  {
    id: FINANCING_MILESTONE_IDS.loanApplication,
    label: "Loan application submitted",
    description:
      "Apply with your lender so underwriting can start. Ask your lender what they still need from you.",
  },
  {
    id: FINANCING_MILESTONE_IDS.appraisal,
    label: "Appraisal completed",
    description:
      "The lender's appraisal should be back. If the value comes in low, ask your lender about your options.",
    critical: true,
  },
  {
    id: FINANCING_MILESTONE_IDS.underwritingConditions,
    label: "Underwriting conditions cleared",
    description:
      "Underwriting may ask for more documents. Ask your lender for the full conditions list and return it promptly.",
  },
  {
    id: FINANCING_MILESTONE_IDS.clearToClose,
    label: "Clear to close by financing date",
    description:
      "Your loan must be approved (clear to close) by your financing contingency date, or you risk your earnest money. Ask your lender to confirm the timeline.",
    critical: true,
    derived: true,
  },
];

/** The buyer-entered dates for the financing tool. Empty string = unset. */
export interface FinancingDates {
  /** Loan application date (YYYY-MM-DD) or "". */
  loanApplicationDate: string;
  /** Appraisal date (YYYY-MM-DD) or "". */
  appraisalDate: string;
  /** Underwriting-conditions date (YYYY-MM-DD) or "". */
  underwritingConditionsDate: string;
  /**
   * Clear-to-close-by date (YYYY-MM-DD) or "". When unset, it is DERIVED from the
   * under-contract anchor + `financingContingencyDays` (see {@link FinancingInput}).
   */
  clearToCloseByDate: string;
}

export const EMPTY_FINANCING_DATES: FinancingDates = {
  loanApplicationDate: "",
  appraisalDate: "",
  underwritingConditionsDate: "",
  clearToCloseByDate: "",
};

export interface FinancingInput {
  /** The buyer-entered financing dates. */
  dates: FinancingDates;
  /**
   * Anchor: the date the deal went under contract (YYYY-MM-DD). With this set we
   * can DERIVE the clear-to-close-by date from `financingContingencyDays` when the
   * buyer hasn't entered one explicitly.
   */
  underContractDate?: string;
  /** Calendar days from the contract date to the financing contingency. */
  financingContingencyDays?: number;
}

const DESCRIPTION_BY_ID = new Map(
  FINANCING_STEPS.map((s) => [s.id, s] as const),
);

/**
 * Whether the buyer has entered ANY explicit financing date. The derived
 * clear-to-close-by date (from the under-contract anchor) is intentionally NOT
 * counted here: it would otherwise auto-populate for every under-contract deal
 * and duplicate the deadline-engine `financing` milestone. The financing tool is
 * only "in use" once the buyer enters at least one of its own dates.
 */
export function hasAnyExplicitFinancingDate(dates: FinancingDates): boolean {
  return (
    isValidDate(dates.loanApplicationDate) ||
    isValidDate(dates.appraisalDate) ||
    isValidDate(dates.underwritingConditionsDate) ||
    isValidDate(dates.clearToCloseByDate)
  );
}

/**
 * The effective clear-to-close-by date: the buyer's explicit date if set and
 * valid, otherwise derived from `underContractDate + financingContingencyDays`.
 * Returns "" when neither is available.
 */
export function clearToCloseByDate(input: FinancingInput): string {
  const explicit = input.dates.clearToCloseByDate;
  if (isValidDate(explicit)) return explicit;
  if (
    input.underContractDate &&
    isValidDate(input.underContractDate) &&
    typeof input.financingContingencyDays === "number" &&
    Number.isFinite(input.financingContingencyDays)
  ) {
    return addDays(input.underContractDate, input.financingContingencyDays);
  }
  return "";
}

/**
 * Compute the financing milestones as `Milestone[]`-compatible items, sorted by
 * date, so R1 reminders and R3 cockpit consume them with no new plumbing.
 *
 * Each entered date emits one milestone. A step with no date is simply omitted —
 * a missing financing date degrades GRACEFULLY to an empty result (not a crash,
 * not a milestone with an invalid date). When every date is unset the result is
 * an empty array.
 *
 * The clear-to-close milestone uses the explicit date when set, otherwise the
 * date derived from the financing-contingency anchor.
 */
export function computeFinancingMilestones(input: FinancingInput): Milestone[] {
  // The tool is only "in use" once the buyer enters at least one explicit date.
  // Without that, return empty so the derived clear-to-close-by date never
  // auto-populates the cockpit/reminders (and never duplicates the deadline
  // engine's own `financing` milestone). See {@link hasAnyExplicitFinancingDate}.
  if (!hasAnyExplicitFinancingDate(input.dates)) return [];

  const dateById: Record<FinancingMilestoneId, string> = {
    [FINANCING_MILESTONE_IDS.loanApplication]: input.dates.loanApplicationDate,
    [FINANCING_MILESTONE_IDS.appraisal]: input.dates.appraisalDate,
    [FINANCING_MILESTONE_IDS.underwritingConditions]:
      input.dates.underwritingConditionsDate,
    [FINANCING_MILESTONE_IDS.clearToClose]: clearToCloseByDate(input),
  };

  const milestones: Milestone[] = [];
  for (const step of FINANCING_STEPS) {
    const date = dateById[step.id];
    if (!isValidDate(date)) continue; // missing/invalid → graceful skip
    milestones.push({
      id: step.id,
      label: step.label,
      description: step.description,
      date,
      critical: step.critical,
    });
  }

  milestones.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  return milestones;
}

/** Whether any financing milestone is computable from the given input. */
export function hasFinancingMilestones(input: FinancingInput): boolean {
  return computeFinancingMilestones(input).length > 0;
}

/** Description for a financing milestone id (for surfaces that only carry the id). */
export function financingDescriptionFor(id: FinancingMilestoneId): string {
  return DESCRIPTION_BY_ID.get(id)?.description ?? "";
}

/**
 * Days until the clear-to-close-by date from `todayISO`. `null` when the date is
 * unavailable. Positive = days remaining, 0 = today, negative = past.
 */
export function daysToClearToClose(
  input: FinancingInput,
  todayISO: string,
): number | null {
  const ctc = clearToCloseByDate(input);
  if (!isValidDate(ctc) || !isValidDate(todayISO)) return null;
  return Math.round((parseDate(ctc) - parseDate(todayISO)) / 86_400_000);
}

/**
 * The appraisal-gap arithmetic, reused verbatim from `clear-to-close` so there is
 * a single source of truth for the low-appraisal math. Re-exported here under a
 * neutral, SAFE-Act-safe name so the financing tool can surface the gap with
 * process framing ("ask your lender") and never a rate-as-offer or a lender
 * recommendation. Pure pass-through — no new math.
 */
export function financingAppraisalGap(
  input: AppraisalInput,
): AppraisalGapResult {
  return appraisalGap(input);
}

export type { AppraisalGapResult, AppraisalInput } from "@/lib/tools/clear-to-close";

/** Today's date in the engine's UTC `YYYY-MM-DD` frame. */
export function financingToday(): string {
  return formatISO(Date.now());
}
