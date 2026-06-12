/**
 * iCalendar (.ics) generator for the deadline tracker (A8).
 *
 * Turns the tracker's computed milestones (`computeMilestones()` from
 * `src/lib/deadlines.ts`) into a valid RFC 5545 VCALENDAR string the buyer can
 * download and import into Apple/Google/Outlook calendars. This is a convenience
 * export, not a legal deadline of record — the signed contract governs. The copy
 * stays factual ("verify against your contract"), never advice (UPL).
 *
 * Design choices (per the A8 spike):
 *  - **All-day events** (`DTSTART;VALUE=DATE:YYYYMMDD`, no time/TZ) — matches the
 *    calendar-day model in `deadlines.ts` and avoids a deadline slipping a day
 *    across timezones.
 *  - **Hand-rolled string** (no library) with CRLF line endings, line-folding at
 *    75 octets, and proper escaping of `, ; \` and newlines.
 *  - **Stable UID per milestone** (derived from the milestone id + its date) so
 *    re-exporting updates the same event rather than duplicating it.
 *  - A day-before **VALARM** reminder on each event.
 *
 * Pure functions only — no I/O, no DOM. Fully unit-testable. The Blob download is
 * wired in the tracker component, not here.
 */

import type { Milestone } from "@/lib/deadlines";

export interface ICSOptions {
  /** PRODID identifier. Defaults to the HomeOffer Direct product id. */
  prodId?: string;
  /**
   * Fixed timestamp (ms since epoch) for DTSTAMP, for deterministic output in
   * tests. Defaults to `Date.now()`.
   */
  now?: number;
  /** Calendar name (X-WR-CALNAME). */
  calendarName?: string;
}

const DEFAULT_PRODID = "-//HomeOffer Direct//Deadline Tracker//EN";
const CRLF = "\r\n";

/**
 * Escape a text value per RFC 5545 §3.3.11: backslash, comma, semicolon, and
 * newlines. (Colons are not escaped in TEXT values.)
 */
export function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Fold a content line to <=75 octets per RFC 5545 §3.1, using a CRLF followed by
 * a single space for continuation lines. We fold on octet (UTF-8 byte) count to
 * be safe with multi-byte characters, but split on character boundaries.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  // First line budget 75 octets; continuation lines budget 74 (1 for the leading
  // space).
  let budget = 75;

  for (const ch of line) {
    const chBytes = encoder.encode(ch).length;
    if (currentBytes + chBytes > budget) {
      out.push(current);
      current = ch;
      currentBytes = chBytes;
      budget = 74;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  out.push(current);

  return out.join(`${CRLF} `);
}

/** Format a YYYY-MM-DD ISO date to an all-day DATE value (YYYYMMDD). */
function toDateValue(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Format a ms timestamp to a UTC DATE-TIME value (YYYYMMDDTHHMMSSZ). */
function toUtcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Stable UID for a milestone: combines its id and date so a re-export of the
 * same deal produces the same UID (no duplicates), but a changed date produces a
 * new event.
 */
export function milestoneUID(milestone: Milestone): string {
  return `${milestone.id}-${toDateValue(milestone.date)}@homeofferdirect`;
}

/**
 * Build the VEVENT lines (unfolded) for a single milestone. All-day event with a
 * day-before VALARM. The DESCRIPTION carries the milestone's own description plus
 * the neutral "verify against your contract" guard.
 */
export function milestoneToVEvent(milestone: Milestone, dtstamp: string): string[] {
  const summary = milestone.critical
    ? `${milestone.label} (critical)`
    : milestone.label;
  const description = `${milestone.description} Verify against your contract; this calendar export is a convenience, not the legal deadline of record.`;

  return [
    "BEGIN:VEVENT",
    `UID:${milestoneUID(milestone)}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${toDateValue(milestone.date)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(`Reminder: ${summary}`)}`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

/**
 * Build a complete, valid VCALENDAR string from a milestone list.
 *
 * An empty milestone list still yields a valid (event-free) VCALENDAR rather
 * than throwing — the caller decides whether to offer the download.
 */
export function buildICS(milestones: Milestone[], opts: ICSOptions = {}): string {
  const prodId = opts.prodId ?? DEFAULT_PRODID;
  const dtstamp = toUtcStamp(opts.now ?? Date.now());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeICS(prodId)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  if (opts.calendarName) {
    lines.push(`X-WR-CALNAME:${escapeICS(opts.calendarName)}`);
  }

  for (const m of milestones) {
    lines.push(...milestoneToVEvent(m, dtstamp));
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** MIME type for an .ics download. */
export const ICS_MIME = "text/calendar;charset=utf-8";

/** A safe filename for the exported calendar. */
export function icsFilename(label = "deadlines"): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "deadlines"}.ics`;
}
