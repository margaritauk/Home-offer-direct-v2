/**
 * Deadline engine for an active home purchase.
 *
 * Turns the two dates a buyer knows — when they went under contract and the
 * target closing date — into the concrete milestone deadlines that matter when
 * you don't have an agent watching them. Pure functions, no I/O, so the logic is
 * fully unit-testable.
 *
 * Dates are handled as `YYYY-MM-DD` strings in a fixed (UTC) frame to avoid
 * timezone drift; we never need wall-clock time, only calendar days.
 */

/** Editable contingency periods (in calendar days from the contract date). */
export interface DeadlineOffsets {
  earnestMoneyDays: number;
  inspectionContingencyDays: number;
  appraisalContingencyDays: number;
  financingContingencyDays: number;
  titleReviewDays: number;
}

export const defaultOffsets: DeadlineOffsets = {
  earnestMoneyDays: 3,
  inspectionContingencyDays: 10,
  appraisalContingencyDays: 17,
  financingContingencyDays: 21,
  titleReviewDays: 14,
};

export interface DeadlineInput {
  /** Date the offer was accepted / went under contract (YYYY-MM-DD). */
  underContractDate: string;
  /** Target closing date (YYYY-MM-DD). */
  closingDate: string;
  offsets: DeadlineOffsets;
}

export type MilestoneStatus = "overdue" | "today" | "soon" | "upcoming";

export interface Milestone {
  id: string;
  label: string;
  description: string;
  /** Computed calendar date (YYYY-MM-DD). */
  date: string;
  /** Trust-critical deadline that buyers most often blow. */
  critical?: boolean;
}

const MS_PER_DAY = 86_400_000;

/** Parse a YYYY-MM-DD string to a UTC timestamp (midnight). NaN if invalid. */
export function parseDate(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return Number.NaN;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(ts);
  // Reject impossible dates that JS would roll over (e.g. 2026-02-30).
  if (
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() !== Number(m[2]) - 1 ||
    d.getUTCDate() !== Number(m[3])
  ) {
    return Number.NaN;
  }
  return ts;
}

export function formatISO(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function isValidDate(iso: string): boolean {
  return !Number.isNaN(parseDate(iso));
}

/** Add `days` calendar days to an ISO date. */
export function addDays(iso: string, days: number): string {
  return formatISO(parseDate(iso) + days * MS_PER_DAY);
}

/** Whole-day difference b - a (positive when b is after a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b) - parseDate(a)) / MS_PER_DAY);
}

/**
 * The date that is `n` business days (Mon–Fri) before `iso`, inclusive of
 * neither endpoint's weekend. Used for the Closing Disclosure rule: the CD must
 * be received at least 3 business days before closing.
 */
export function businessDaysBefore(iso: string, n: number): string {
  let ts = parseDate(iso);
  let counted = 0;
  while (counted < n) {
    ts -= MS_PER_DAY;
    const dow = new Date(ts).getUTCDay(); // 0 Sun ... 6 Sat
    if (dow !== 0 && dow !== 6) counted += 1;
  }
  return formatISO(ts);
}

/** Status of a milestone relative to "today", with `soon` = within 3 days. */
export function statusFor(
  milestoneISO: string,
  todayISO: string,
  soonWindowDays = 3,
): MilestoneStatus {
  const diff = daysBetween(todayISO, milestoneISO);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= soonWindowDays) return "soon";
  return "upcoming";
}

/**
 * Compute the ordered milestone timeline for a deal. Returns an empty array if
 * either anchor date is invalid. Milestones are sorted by date.
 */
export function computeMilestones(input: DeadlineInput): Milestone[] {
  const { underContractDate: uc, closingDate: close, offsets } = input;
  if (!isValidDate(uc) || !isValidDate(close)) return [];

  const milestones: Milestone[] = [
    {
      id: "earnest-money",
      label: "Earnest money due",
      description: "Wire your good-faith deposit to the escrow holder. Verify wire instructions by phone first.",
      date: addDays(uc, offsets.earnestMoneyDays),
      critical: true,
    },
    {
      id: "inspection",
      label: "Inspection contingency ends",
      description: "Complete inspections and submit any repair/credit requests before this date or you may lose the right to.",
      date: addDays(uc, offsets.inspectionContingencyDays),
      critical: true,
    },
    {
      id: "appraisal",
      label: "Appraisal contingency ends",
      description: "Appraisal should be back; respond if value comes in low.",
      date: addDays(uc, offsets.appraisalContingencyDays),
    },
    {
      id: "title-review",
      label: "Title commitment review",
      description: "Review the title commitment and raise any objections.",
      date: addDays(uc, offsets.titleReviewDays),
    },
    {
      id: "financing",
      label: "Financing contingency ends",
      description: "Loan must be approved (clear to close) or you risk your earnest money if you back out after this.",
      date: addDays(uc, offsets.financingContingencyDays),
      critical: true,
    },
    {
      id: "closing-disclosure",
      label: "Closing Disclosure review (3-day rule)",
      description: "By law the CD must arrive at least 3 business days before closing. Read it line-by-line against your Loan Estimate.",
      date: businessDaysBefore(close, 3),
      critical: true,
    },
    {
      id: "final-walkthrough",
      label: "Final walkthrough",
      description: "Verify the home's condition is unchanged and agreed repairs are done.",
      date: addDays(close, -1),
    },
    {
      id: "closing",
      label: "Closing day",
      description: "Sign, bring certified funds, and get your keys.",
      date: close,
      critical: true,
    },
  ];

  return milestones.sort((a, b) => parseDate(a.date) - parseDate(b.date));
}
