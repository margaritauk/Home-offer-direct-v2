/**
 * Calendar/agenda math for scheduled showings (issue #28).
 *
 * The buyer's tracker (#20) stores an optional `scheduledAt` per listing as a
 * `datetime-local` string (e.g. "2026-06-15T14:30"). This module is the PURE
 * core that turns those records into day-bucketed agenda groups and a month
 * grid — no React, no storage — so the bucketing can be unit-tested in
 * isolation.
 *
 * TIMEZONE SAFETY: a `datetime-local` value has no offset, so it denotes a
 * *local* wall-clock time. We never feed it through `new Date(iso)` for
 * bucketing (that would re-interpret it and can drift a record into the wrong
 * day depending on the runner's TZ). Instead we parse the calendar fields out
 * of the string directly, so "2026-06-15T14:30" always buckets under
 * "2026-06-15" everywhere. Likewise `monthMatrix` builds dates with the local
 * `Date(y, m, d)` constructor and reads `getDate()`/`getDay()` locally, so no
 * UTC conversion happens.
 *
 * GUARDRAIL (FHA): only schedule/location facts flow through here — see
 * `ShowingRecord`. Nothing solicits or stores protected-class signals.
 */

import type { ShowingRecord } from "./types";

/** One calendar day's worth of scheduled showings. */
export interface ShowingDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  /** Records scheduled that day, sorted ascending by time. */
  items: ShowingRecord[];
}

/**
 * Parse the local calendar fields out of a `datetime-local` / ISO-ish string
 * without constructing a `Date` (which would apply a timezone). Returns null
 * when the leading `YYYY-MM-DD` is missing or not a real calendar date.
 *
 * Accepts "2026-06-15", "2026-06-15T14:30", "2026-06-15T14:30:00",
 * "2026-06-15T14:30:00.000Z" — we read only the wall-clock fields.
 */
export function parseLocalDateTime(
  value: string | undefined | null,
): { date: string; minutes: number } | null {
  if (typeof value !== "string") return null;
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/,
  );
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Reject impossible calendar dates (e.g. month 13, day 32, Feb 30).
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }
  const hour = m[4] === undefined ? 0 : Number(m[4]);
  const minute = m[5] === undefined ? 0 : Number(m[5]);
  if (hour > 23 || minute > 59) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  return { date, minutes: hour * 60 + minute };
}

/** Build a local `YYYY-MM-DD` key from a Date's local fields (no UTC). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Bucket showings by local calendar day.
 *
 * - Keeps only records with a valid `scheduledAt` (others are ignored).
 * - Groups same-day records together; days are sorted ascending and items
 *   within a day are sorted ascending by time of day.
 * - Pure and defensive — never throws on malformed input.
 */
export function showingsByDay(showings: ShowingRecord[]): ShowingDay[] {
  const buckets = new Map<string, { minutes: number; record: ShowingRecord }[]>();

  for (const record of showings ?? []) {
    const parsed = parseLocalDateTime(record?.scheduledAt);
    if (!parsed) continue;
    const list = buckets.get(parsed.date) ?? [];
    list.push({ minutes: parsed.minutes, record });
    buckets.set(parsed.date, list);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, list]) => ({
      date,
      items: list
        .sort((a, b) => a.minutes - b.minutes)
        .map((x) => x.record),
    }));
}

/** A single cell in the month grid. */
export interface MonthCell {
  /** Local `YYYY-MM-DD` for this cell. */
  date: string;
  /** Day-of-month number, 1–31. */
  day: number;
  /** True when the cell belongs to the rendered month (not the lead/trail spill). */
  inMonth: boolean;
}

/**
 * Build the Sun–Sat weeks grid for a given month, padded with the trailing days
 * of the previous month and leading days of the next month so every row is a
 * full 7-cell week. `month` is 0-based (0 = January), matching `Date`.
 *
 * Always returns whole weeks (length is a multiple of 7); the first cell is a
 * Sunday and the last a Saturday. Built entirely with the local `Date`
 * constructor so cells never drift across a timezone boundary.
 */
export function monthMatrix(year: number, month: number): MonthCell[][] {
  const first = new Date(year, month, 1);
  // Sunday=0 … Saturday=6 — how many lead cells from the previous month.
  const lead = first.getDay();
  const start = new Date(year, month, 1 - lead);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = lead + daysInMonth;
  const weeks = Math.ceil(total / 7);

  const matrix: MonthCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const row: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      row.push({
        date: toDateKey(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    matrix.push(row);
  }
  return matrix;
}

/** Short month name for a 0-based month index (locale-independent fallback). */
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Weekday header labels for the month grid, Sunday first. */
export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;
