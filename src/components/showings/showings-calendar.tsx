"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShowings } from "@/hooks/use-showings";
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  monthMatrix,
  parseLocalDateTime,
  showingsByDay,
  toDateKey,
} from "@/lib/showings/calendar";
import type { ShowingRecord } from "@/lib/showings/types";

/** Where a calendar entry links: the listing's card in the tracker. */
function recordHref(record: ShowingRecord) {
  return `/showings#showing-${record.listingId}`;
}

/** Friendly time-of-day from a `datetime-local` value (no TZ math). */
function formatTime(scheduledAt: string | undefined): string {
  const parsed = parseLocalDateTime(scheduledAt);
  if (!parsed) return "";
  // No HH:MM in the value → treat as all-day.
  if (typeof scheduledAt === "string" && !scheduledAt.includes("T")) return "";
  const h24 = Math.floor(parsed.minutes / 60);
  const min = parsed.minutes % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

/** Friendly long day label from a `YYYY-MM-DD` key (built local-safe). */
function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  return `${weekday}, ${MONTH_NAMES[m - 1]} ${d}`;
}

function CalendarEntry({ record }: { record: ShowingRecord }) {
  const time = formatTime(record.scheduledAt);
  return (
    <Link
      href={recordHref(record)}
      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-brand-300 hover:bg-brand-50/50 focus:outline-none focus:ring-2 focus:ring-brand-200"
    >
      <span className="font-medium text-brand-700">{record.address}</span>
      <span className="ml-2 text-ink-muted">
        {record.city}, {record.state}
      </span>
      {time ? (
        <span className="mt-0.5 block text-xs font-medium text-ink-soft">
          {time}
        </span>
      ) : null}
    </Link>
  );
}

/** Agenda list grouped by day — the small-screen primary view. */
function AgendaView({ records }: { records: ShowingRecord[] }) {
  const days = useMemo(() => showingsByDay(records), [records]);

  if (days.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        None of your tracked showings have a scheduled date/time yet. Add one in
        the tracker to see it here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.date}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {formatDayLabel(day.date)}{" "}
            <span className="font-normal">({day.items.length})</span>
          </h3>
          <div className="grid gap-2">
            {day.items.map((r) => (
              <CalendarEntry key={r.listingId} record={r} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Month grid — the desktop view with prev/next controls. */
function MonthView({ records }: { records: ShowingRecord[] }) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  // Index scheduled records by local day for quick per-cell lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, ShowingRecord[]>();
    for (const day of showingsByDay(records)) {
      map.set(day.date, day.items);
    }
    return map;
  }, [records]);

  const weeks = useMemo(
    () => monthMatrix(view.year, view.month),
    [view.year, view.month],
  );

  const todayKey = toDateKey(today);

  const step = (delta: number) => {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">
          {MONTH_NAMES[view.month]} {view.year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() =>
              setView({ year: today.getFullYear(), month: today.getMonth() })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-slate-50 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            {label}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const items = byDay.get(cell.date) ?? [];
          const isToday = cell.date === todayKey;
          return (
            <div
              key={cell.date}
              className={`min-h-[5.5rem] bg-white p-1.5 text-left align-top ${
                cell.inMonth ? "" : "bg-slate-50/60 text-ink-muted"
              }`}
            >
              <div
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-brand-600 font-semibold text-white"
                    : cell.inMonth
                      ? "text-ink"
                      : "text-ink-muted"
                }`}
              >
                {cell.day}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((r) => (
                  <Link
                    key={r.listingId}
                    href={recordHref(r)}
                    title={`${formatTime(r.scheduledAt) || "Scheduled"} — ${r.address}`}
                    className="block truncate rounded bg-brand-50 px-1.5 py-0.5 text-[11px] leading-tight text-brand-700 hover:bg-brand-100 focus:outline-none focus:ring-1 focus:ring-brand-300"
                  >
                    {formatTime(r.scheduledAt)
                      ? `${formatTime(r.scheduledAt)} · `
                      : ""}
                    {r.address}
                  </Link>
                ))}
                {items.length > 3 ? (
                  <span className="block px-1.5 text-[11px] text-ink-muted">
                    +{items.length - 3} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Calendar/agenda view of the buyer's scheduled showings (issue #28).
 *
 * Desktop renders a month grid with prev/next controls; small screens render an
 * agenda list grouped by day. Only records with a valid `scheduledAt` appear.
 * Clicking an entry jumps to that listing's card in the tracker.
 */
export function ShowingsCalendar() {
  const { records, hydrated } = useShowings();

  const scheduled = useMemo(
    () => records.filter((r) => parseLocalDateTime(r.scheduledAt) !== null),
    [records],
  );

  if (!hydrated) {
    return (
      <div className="card" aria-hidden>
        <div className="h-6 w-40 rounded bg-slate-100" />
      </div>
    );
  }

  if (scheduled.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-ink-soft">No showings scheduled yet</p>
        <p className="mt-1 text-sm text-ink-muted">
          Schedule one from a listing or the showings tracker — set a date/time
          on a tracked showing and it will appear here.
        </p>
        <Link href="/listings" className="btn-primary mt-4 inline-flex">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="mb-4 text-sm text-ink-muted" aria-live="polite">
        {scheduled.length} scheduled showing{scheduled.length === 1 ? "" : "s"}
      </p>

      {/* Month grid on desktop. */}
      <div className="hidden md:block">
        <MonthView records={scheduled} />
      </div>

      {/* Agenda list on small screens. */}
      <div className="md:hidden">
        <AgendaView records={scheduled} />
      </div>
    </div>
  );
}
