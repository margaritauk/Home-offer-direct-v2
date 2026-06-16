/**
 * Reminder scheduling core (S1-R1). See ADR-014.
 *
 * A reminder is "a milestone whose date crosses a lead-time threshold relative to
 * today, not yet acknowledged." This module derives the concrete fire-times from
 * the SHIPPED milestone engine (`computeMilestones`, `lib/deadlines.ts`) as PURE
 * functions, so the whole scheduling policy is unit-testable and the delivery
 * mechanism (in-app banner, Web Push via the cron route) stays dumb.
 *
 * Dates are handled in the same UTC `YYYY-MM-DD` frame as `lib/deadlines.ts`, so a
 * date entered as `YYYY-MM-DD` fires on that calendar day with no timezone drift.
 *
 * Re-fire on date move is just recomputation: when contract/closing dates move,
 * the derived fire-time set changes; {@link dueReminders} naturally surfaces the
 * new ones and stale ones simply stop being derived (no orphan, no mutable
 * scheduler state to migrate).
 *
 * UPL: reminders are PROCESS nudges ("your inspection contingency ends"), never
 * directives; no deadline is "of record" — see {@link REMINDER_FOOTER}.
 */

import { addDays, isValidDate, type Milestone } from "@/lib/deadlines";

/** UPL footer carried by every reminder surface. */
export const REMINDER_FOOTER =
  "We surface your dates; the contract is the source of truth.";

export type ReminderChannel = "in_app" | "push";

/** Default lead-times (calendar days before the milestone) we arm a nudge at. */
export const DEFAULT_LEAD_DAYS = [3, 1, 0] as const;

export interface ReminderOptions {
  /** Lead-times (days before the milestone date) to arm. Default {@link DEFAULT_LEAD_DAYS}. */
  leadDays?: readonly number[];
  /** Stable id for the deal these reminders belong to (drives the dedupe key). */
  dealId: string;
  /** Channels to arm. Default `["in_app"]`. */
  channels?: readonly ReminderChannel[];
}

export interface Reminder {
  /** The milestone this reminder is for. */
  milestoneId: string;
  /** Human label (process-framed), carried for the delivery surface. */
  label: string;
  /** Lead-time (days before the milestone) this reminder represents. */
  leadDays: number;
  /** The calendar date (YYYY-MM-DD) this reminder should fire on. */
  fireAtISO: string;
  channel: ReminderChannel;
  /**
   * Idempotency key on `(deal_id, milestone_id, fired-at-bucket)`. The bucket is
   * the fire date, so a cron that runs many times on the fire day, or a re-entry
   * with identical dates, never double-arms.
   */
  dedupeKey: string;
}

function makeDedupeKey(
  dealId: string,
  milestoneId: string,
  channel: ReminderChannel,
  fireAtISO: string,
): string {
  return `${dealId}:${milestoneId}:${channel}:${fireAtISO}`;
}

/**
 * Derive the full reminder set for a deal's milestones. For each milestone and
 * each lead-time, the fire date is `milestone.date - leadDays`. Pure; the result
 * is deterministic for a given input (so re-entry with the same dates yields the
 * identical set — no double-arm).
 *
 * Milestones with an invalid date are skipped. Duplicate fire-dates within a
 * milestone (e.g. overlapping lead-times) are de-duplicated by `dedupeKey`.
 */
export function computeReminders(
  milestones: readonly Milestone[],
  opts: ReminderOptions,
): Reminder[] {
  const leadDays = opts.leadDays ?? DEFAULT_LEAD_DAYS;
  const channels = opts.channels ?? (["in_app"] as const);
  const seen = new Set<string>();
  const reminders: Reminder[] = [];

  for (const milestone of milestones) {
    if (!isValidDate(milestone.date)) continue;
    for (const lead of leadDays) {
      const fireAtISO = addDays(milestone.date, -lead);
      for (const channel of channels) {
        const dedupeKey = makeDedupeKey(
          opts.dealId,
          milestone.id,
          channel,
          fireAtISO,
        );
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        reminders.push({
          milestoneId: milestone.id,
          label: milestone.label,
          leadDays: lead,
          fireAtISO,
          channel,
          dedupeKey,
        });
      }
    }
  }

  // Sort by fire date so the soonest nudge is first.
  reminders.sort((a, b) => a.fireAtISO.localeCompare(b.fireAtISO));
  return reminders;
}

/** Count of distinct milestones armed (the "armed" badge count). */
export function armedMilestoneCount(reminders: readonly Reminder[]): number {
  return new Set(reminders.map((r) => r.milestoneId)).size;
}
