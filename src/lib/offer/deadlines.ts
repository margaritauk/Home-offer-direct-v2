/**
 * Offer-specific deadline mapping (issue #25).
 *
 * Turns an {@link Offer} (its closing date + chosen contingency windows) plus
 * the date the buyer went under contract into a concrete milestone list,
 * including the offer's own RESPONSE / EXPIRATION clock (typically 24–72h; we
 * default to 48h and keep it editable — see research §1.5).
 *
 * Pure functions only; reuses the canonical date helpers from `@/lib/deadlines`
 * (which this module must NOT edit) so the math matches the tracker exactly.
 */

import {
  addDays,
  businessDaysBefore,
  formatISO,
  isValidDate,
  parseDate,
  statusFor,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/deadlines";
import { CONTINGENCIES, type ContingencyId } from "./contingencies";
import type { Offer } from "./types";

/** Default offer response/expiration window, in hours (research §1.5: 24–72h). */
export const DEFAULT_EXPIRATION_HOURS = 48;

export interface OfferDeadlineInput {
  offer: Offer;
  /** Date the offer went / is expected to go under contract (YYYY-MM-DD). */
  underContractDate: string;
  /**
   * Date/time the offer was submitted (YYYY-MM-DD). The expiration milestone is
   * computed from here. Defaults to the under-contract date if omitted.
   */
  submittedDate?: string;
  /** Editable response/expiration window in hours. Defaults to 48h. */
  expirationHours?: number;
}

/** A milestone plus its status relative to a reference "today". */
export interface OfferMilestone extends Milestone {
  status: MilestoneStatus;
}

/** Round an hours value up to whole days for the calendar-based deadline model. */
function hoursToDays(hours: number): number {
  return Math.max(0, Math.ceil(hours / 24));
}

const CONTINGENCY_LABELS = CONTINGENCIES.reduce(
  (acc, c) => {
    acc[c.id] = c.label;
    return acc;
  },
  {} as Record<ContingencyId, string>,
);

/**
 * Build the ordered offer milestone list. Always includes the offer
 * response/expiration milestone. Contingency milestones are included only for
 * contingencies the buyer kept in the offer. Returns an empty array if the
 * required anchor dates are invalid.
 */
export function computeOfferMilestones(input: OfferDeadlineInput): Milestone[] {
  const { offer, underContractDate: uc } = input;
  const submitted = input.submittedDate ?? uc;
  const expirationHours = input.expirationHours ?? DEFAULT_EXPIRATION_HOURS;

  const milestones: Milestone[] = [];

  // Offer response / expiration clock (#25). Anchored on the submitted date.
  if (isValidDate(submitted)) {
    milestones.push({
      id: "offer-expiration",
      label: "Offer response deadline",
      description: `Your offer expires if the seller doesn't respond within ${expirationHours} hours. After that it's void unless you extend it.`,
      date: addDays(submitted, hoursToDays(expirationHours)),
      critical: true,
    });
  }

  if (isValidDate(uc)) {
    // One milestone per INCLUDED contingency, using the buyer's chosen window.
    for (const c of CONTINGENCIES) {
      const sel = offer.contingencies[c.id];
      if (!sel || !sel.included) continue;
      milestones.push({
        id: `contingency-${c.id}`,
        label: `${CONTINGENCY_LABELS[c.id]} deadline`,
        description: c.protects,
        date: addDays(uc, sel.days),
        critical: c.id === "inspection" || c.id === "financing",
      });
    }
  }

  // Closing-side milestones derived from the offer's closing date.
  if (isValidDate(offer.closingDate)) {
    milestones.push(
      {
        id: "closing-disclosure",
        label: "Closing Disclosure review (3-day rule)",
        description:
          "By law the Closing Disclosure must arrive at least 3 business days before closing. Read it against your Loan Estimate.",
        date: businessDaysBefore(offer.closingDate, 3),
        critical: true,
      },
      {
        id: "final-walkthrough",
        label: "Final walkthrough",
        description: "Verify the home's condition is unchanged and agreed repairs are done.",
        date: addDays(offer.closingDate, -1),
      },
      {
        id: "closing",
        label: "Closing day",
        description: "Sign, bring certified funds, and get your keys.",
        date: offer.closingDate,
        critical: true,
      },
    );
  }

  return milestones.sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

/** Same as {@link computeOfferMilestones} but each milestone carries its status. */
export function computeOfferMilestonesWithStatus(
  input: OfferDeadlineInput,
  todayISO: string,
): OfferMilestone[] {
  return computeOfferMilestones(input).map((m) => ({
    ...m,
    status: statusFor(m.date, todayISO),
  }));
}

/** The computed offer-expiration date for preview (or "" if no valid anchor). */
export function offerExpirationDate(input: OfferDeadlineInput): string {
  const submitted = input.submittedDate ?? input.underContractDate;
  const expirationHours = input.expirationHours ?? DEFAULT_EXPIRATION_HOURS;
  if (!isValidDate(submitted)) return "";
  return addDays(submitted, hoursToDays(expirationHours));
}

// Re-export for callers that want to format a timestamp without a second import.
export { formatISO };
