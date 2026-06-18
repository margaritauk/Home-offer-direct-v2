/**
 * Single "all milestones for this deal" source (S5-F1 integration).
 *
 * S1 shipped the reminder banner (R1) and the cockpit (R3) reading ONLY the
 * deadline-engine tracker milestones (`computeMilestones`). S5 adds a second
 * milestone producer — the financing tool (`computeFinancingMilestones`). Rather
 * than teach every consumer about both producers, this module is the ONE place
 * that unions them, so `ReminderBanner` and `CockpitBand` (via `buildHomeRollups`)
 * both surface financing milestones with no new plumbing concept.
 *
 * Pure: no I/O, no React. The union is de-duplicated by milestone id (a financing
 * milestone never shares an id with a deadline-engine one — financing ids are
 * `financing-*` — but de-duping keeps the source robust) and sorted by date.
 */

import {
  computeMilestones,
  isValidDate,
  parseDate,
  type DeadlineOffsets,
  type Milestone,
} from "@/lib/deadlines";
import {
  computeFinancingMilestones,
  type FinancingDates,
} from "@/lib/financing/milestones";

export interface AllMilestonesInput {
  /** The deal-date tracker dates + contingency offsets. */
  underContractDate: string;
  closingDate: string;
  offsets: DeadlineOffsets;
  /** The financing tool's persisted dates (omit when the tool is untouched). */
  financing?: FinancingDates;
}

/**
 * Every milestone for a deal: the deadline-engine tracker milestones unioned with
 * the financing-tool milestones, de-duplicated by id and sorted by date. Either
 * source may be empty (tracker dates unset, or no financing dates entered) and the
 * union degrades gracefully to whatever IS available.
 */
export function allDealMilestones(input: AllMilestonesInput): Milestone[] {
  const tracker = computeMilestones({
    underContractDate: input.underContractDate,
    closingDate: input.closingDate,
    offsets: input.offsets,
  });

  const financing = input.financing
    ? computeFinancingMilestones({
        dates: input.financing,
        underContractDate: input.underContractDate,
        financingContingencyDays: input.offsets.financingContingencyDays,
      })
    : [];

  const byId = new Map<string, Milestone>();
  for (const m of [...tracker, ...financing]) {
    if (!isValidDate(m.date)) continue;
    if (!byId.has(m.id)) byId.set(m.id, m);
  }

  return [...byId.values()].sort((a, b) => parseDate(a.date) - parseDate(b.date));
}
