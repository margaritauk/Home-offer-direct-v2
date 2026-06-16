/**
 * Active next-actions cockpit core (S1-R3). Pure ranking over the SHIPPED
 * selectors only — `buildHomeRollups` / `deriveNextAction` (`lib/homes/rollup.ts`)
 * and `statusFor` (`lib/deadlines.ts`). No new data model, no I/O, no React, so
 * the whole ranking policy is unit-testable; the `CockpitBand` component is a thin
 * shell over this.
 *
 * The cockpit answers "the 1–3 things to do this week and why" by turning each
 * home's rollup into at most one ranked {@link NextAction} (verb-led title, a
 * one-line "why now", an urgency derived via `statusFor`, and the rollup's
 * existing deep link), then taking the top N across all homes.
 *
 * UPL: every action is PROCESS, never a directive ("schedule your inspection by
 * the contingency date", never "you should waive…"). Any action carrying a date
 * surfaces the contract-governs note ({@link CONTRACT_GOVERNS_NOTE}); no deadline
 * here is "of record."
 */

import { statusFor, type MilestoneStatus } from "@/lib/deadlines";
import type { HomeRollup } from "@/lib/homes/rollup";

/** UPL guardrail: shown on every date-bearing action. */
export const CONTRACT_GOVERNS_NOTE =
  "The contract governs — no deadline here is of record.";

/** Default number of action cards the cockpit shows. */
export const MAX_NEXT_ACTIONS = 3;

export interface NextAction {
  /** Stable id (the originating home's listing id). */
  id: string;
  /** Verb-led title, e.g. "Schedule your inspection". */
  title: string;
  /** One-line "why this matters now." */
  why: string;
  /** Deep link into the exact tool/stage (from the rollup). */
  href: string;
  /** ISO date the action is anchored to, when it carries one. */
  dueISO?: string;
  /** Urgency for the chip (text + icon, never color alone). Absent = no date. */
  urgency?: MilestoneStatus;
  /** Whether this action carries a date (drives the contract-governs note). */
  hasDate: boolean;
}

/**
 * Numeric weight per urgency so the most time-critical action sorts first.
 * Lower = more urgent. Dateless actions sort after any dated one.
 */
const URGENCY_RANK: Record<MilestoneStatus, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  upcoming: 3,
};
const NO_DATE_RANK = 4;

function rankValue(action: NextAction): number {
  return action.urgency ? URGENCY_RANK[action.urgency] : NO_DATE_RANK;
}

/**
 * Turn a single home rollup into at most one cockpit action. Prefers the home's
 * nearest deadline (so the cockpit leads with time-critical, contract-driven
 * work) and falls back to the rollup's existing one-line next-action otherwise.
 *
 * `today` (YYYY-MM-DD) anchors the urgency computation.
 */
export function computeNextActions(
  rollups: readonly HomeRollup[],
  today: string,
): NextAction[] {
  const actions: NextAction[] = [];

  for (const rollup of rollups) {
    const deadline = rollup.nextDeadline;

    if (deadline) {
      // Process-framed, verb-led title from the milestone label.
      actions.push({
        id: rollup.listingId,
        title: titleForDeadline(deadline.label),
        why: whyForDeadline(deadline.label, deadline.daysAway),
        href: rollup.nextHref || "/tracker",
        dueISO: deadline.date,
        urgency: statusFor(deadline.date, today),
        hasDate: true,
      });
      continue;
    }

    // No dated milestone — surface the rollup's existing next-action hint.
    actions.push({
      id: rollup.listingId,
      title: rollup.nextAction,
      why: whyForHome(rollup),
      href: rollup.nextHref || "/dashboard",
      hasDate: false,
    });
  }

  return actions;
}

/**
 * Rank the actions across all homes and return the top {@link MAX_NEXT_ACTIONS}
 * (most-urgent first). Sort is stable on (urgency, soonest date). Pure.
 */
export function rankNextActions(
  rollups: readonly HomeRollup[],
  today: string,
  limit: number = MAX_NEXT_ACTIONS,
): NextAction[] {
  const actions = computeNextActions(rollups, today);

  actions.sort((a, b) => {
    const byUrgency = rankValue(a) - rankValue(b);
    if (byUrgency !== 0) return byUrgency;
    // Same urgency bucket: soonest date first; dateless preserve input order.
    if (a.dueISO && b.dueISO) return a.dueISO.localeCompare(b.dueISO);
    return 0;
  });

  return actions.slice(0, Math.max(0, limit));
}

/** Number of ranked actions whose urgency needs attention (for the aria-live count). */
export function attentionCount(actions: readonly NextAction[]): number {
  return actions.filter(
    (a) => a.urgency === "overdue" || a.urgency === "today" || a.urgency === "soon",
  ).length;
}

// --- copy helpers (process-framed, never directive) -------------------------

/** Verb-led, process-framed title for a milestone label. */
function titleForDeadline(label: string): string {
  const map: Record<string, string> = {
    "Earnest money due": "Wire your earnest money",
    "Inspection contingency ends": "Schedule your inspection",
    "Appraisal contingency ends": "Track your appraisal",
    "Title commitment review": "Review the title commitment",
    "Financing contingency ends": "Confirm your financing is clear",
    "Closing Disclosure review (3-day rule)": "Review your Closing Disclosure",
    "Final walkthrough": "Do your final walkthrough",
    "Closing day": "Prepare to close",
  };
  return map[label] ?? label;
}

/** One-line process "why now" for a dated milestone. */
function whyForDeadline(label: string, daysAway: number): string {
  const when =
    daysAway < 0
      ? `was due ${Math.abs(daysAway)} day${Math.abs(daysAway) === 1 ? "" : "s"} ago`
      : daysAway === 0
        ? "is due today"
        : `is due in ${daysAway} day${daysAway === 1 ? "" : "s"}`;
  return `${label} ${when}.`;
}

/** "Why now" for a home with no dated milestone — reuse the rollup hint. */
function whyForHome(rollup: HomeRollup): string {
  if (rollup.offerStatus) return `Your offer on ${rollup.title} needs a move.`;
  if (rollup.showingStatus) return `Keep ${rollup.title} moving through your search.`;
  return "Keep your home search moving.";
}
