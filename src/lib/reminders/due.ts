/**
 * Reminder delivery deriver (S1-R1). See ADR-014.
 *
 * Pure "what should have fired since last check" so the delivery mechanism — the
 * in-app banner and the Vercel Cron push route — is dumb and stateless. Given the
 * derived reminder set plus a `lastSeenISO` watermark and `nowISO`, return the
 * reminders whose fire date falls in the window `(lastSeen, now]`, de-duplicated
 * by `dedupeKey` so a cron that overlaps itself never double-fires.
 *
 * Past-due suppression: when a contract date moves to the past, the recomputed
 * reminders carry past fire-dates. We only surface reminders whose fire date is
 * AFTER the watermark, so moving a date backwards never fires a historical burst.
 *
 * Re-fire diffing on date move: {@link diffReminders} compares a prior armed set
 * to a freshly computed one and reports which to add (new/rescheduled) and which
 * to cancel (stale), keyed by `dedupeKey` — the cron cancels stale rows and arms
 * the new ones with no orphan.
 */

import { isValidDate } from "@/lib/deadlines";
import type { Reminder } from "./schedule";

/**
 * Reminders due in `(lastSeenISO, nowISO]`, de-duplicated by `dedupeKey`.
 * Idempotent: calling it repeatedly with the same watermark yields the same set,
 * and advancing `lastSeenISO` to `nowISO` after delivery means nothing re-fires.
 *
 * - A reminder fires when `lastSeen < fireAt <= now` (calendar-day comparison in
 *   the UTC `YYYY-MM-DD` frame — string compare is correct for that format).
 * - `lastSeenISO` empty/invalid ⇒ treat as "never seen" ⇒ everything up to now
 *   is eligible (a first visit catches up, but still respects `<= now`).
 * - Reminders with a fire date strictly after `now` are NOT yet due.
 */
export function dueReminders(
  reminders: readonly Reminder[],
  lastSeenISO: string,
  nowISO: string,
): Reminder[] {
  if (!isValidDate(nowISO)) return [];
  const hasWatermark = isValidDate(lastSeenISO);

  const seen = new Set<string>();
  const due: Reminder[] = [];

  for (const r of reminders) {
    if (!isValidDate(r.fireAtISO)) continue;
    // Not yet due if it fires after now.
    if (r.fireAtISO > nowISO) continue;
    // Already delivered if at/under the watermark (past-due suppression).
    if (hasWatermark && r.fireAtISO <= lastSeenISO) continue;
    if (seen.has(r.dedupeKey)) continue;
    seen.add(r.dedupeKey);
    due.push(r);
  }

  due.sort((a, b) => a.fireAtISO.localeCompare(b.fireAtISO));
  return due;
}

export interface ReminderDiff {
  /** Reminders in `next` not present in `prev` (arm these). */
  toArm: Reminder[];
  /** Reminders in `prev` no longer present in `next` (cancel these). */
  toCancel: Reminder[];
}

/**
 * Diff a previously armed reminder set against a freshly computed one (after a
 * contract date moves). Keyed by `dedupeKey`. The scheduler arms `toArm` and
 * cancels `toCancel`, so a date move reschedules affected reminders and cancels
 * stale ones with no orphan and no double-arm of unchanged ones.
 */
export function diffReminders(
  prev: readonly Reminder[],
  next: readonly Reminder[],
): ReminderDiff {
  const prevByKey = new Map(prev.map((r) => [r.dedupeKey, r]));
  const nextByKey = new Map(next.map((r) => [r.dedupeKey, r]));

  const toArm = next.filter((r) => !prevByKey.has(r.dedupeKey));
  const toCancel = prev.filter((r) => !nextByKey.has(r.dedupeKey));

  return { toArm, toCancel };
}
