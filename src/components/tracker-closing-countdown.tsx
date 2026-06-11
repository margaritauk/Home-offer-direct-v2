"use client";

import { useMemo } from "react";
import {
  closingCountdownLabel,
  computeMilestones,
  daysBetween,
  daysToClosing,
  formatISO,
  isValidDate,
  statusFor,
  type DeadlineOffsets,
  type MilestoneStatus,
} from "@/lib/deadlines";

/**
 * Days-to-closing countdown + compact milestone timeline (issue #165).
 *
 * Reuses the deadline engine for all date math and the shared status tone scale
 * so the countdown urgency matches the rest of the tracker. Renders nothing
 * fabricated: with no valid closing date it shows a friendly prompt pointing at
 * the date inputs below.
 */

/** Tone scale shared with the tracker timeline (see tracker-app statusStyles). */
const countdownTone: Record<MilestoneStatus, string> = {
  overdue: "bg-red-50 text-red-900 ring-red-200",
  today: "bg-amber-50 text-amber-900 ring-amber-200",
  soon: "bg-amber-50 text-amber-900 ring-amber-200",
  upcoming: "bg-brand-50 text-brand-800 ring-brand-100",
};

const markerDot: Record<MilestoneStatus, string> = {
  overdue: "bg-red-500",
  today: "bg-amber-500",
  soon: "bg-amber-500",
  upcoming: "bg-brand-500",
};

function formatHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shortLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface TrackerClosingCountdownProps {
  underContractDate: string;
  closingDate: string;
  offsets: DeadlineOffsets;
  /** Reference date (YYYY-MM-DD); defaults to today. Injectable for tests. */
  today?: string;
  /** Hide until hydrated so SSR markup matches (mirrors tracker inputs). */
  hydrated?: boolean;
}

export function TrackerClosingCountdown({
  underContractDate,
  closingDate,
  offsets,
  today,
  hydrated = true,
}: TrackerClosingCountdownProps) {
  const todayISO = today ?? formatISO(Date.now());
  const hasClosing = isValidDate(closingDate);

  const days = useMemo(
    () => daysToClosing(closingDate, todayISO),
    [closingDate, todayISO],
  );

  // Treat out-of-order dates (closing before under-contract) as "no timeline",
  // mirroring the tracker's own guard, so we don't render a nonsensical strip.
  const outOfOrder =
    isValidDate(underContractDate) &&
    isValidDate(closingDate) &&
    daysBetween(underContractDate, closingDate) < 0;

  const milestones = useMemo(
    () =>
      outOfOrder
        ? []
        : computeMilestones({
            underContractDate,
            closingDate,
            offsets,
          }),
    [outOfOrder, underContractDate, closingDate, offsets],
  );

  // Avoid SSR/client mismatch: the closing date comes from localStorage.
  if (!hydrated) {
    return (
      <section className="card" aria-hidden suppressHydrationWarning>
        <p className="text-ink-muted">Loading your countdown…</p>
      </section>
    );
  }

  // Empty state — never fabricate a date.
  if (!hasClosing || days === null) {
    return (
      <section className="card" suppressHydrationWarning>
        <h2 className="text-lg font-semibold text-ink">Closing countdown</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Add your closing date below to see the countdown and a timeline of
          your key deadlines.
        </p>
      </section>
    );
  }

  const tone = statusFor(closingDate, todayISO);
  const label = closingCountdownLabel(days);

  return (
    <section
      className="card"
      aria-label="Closing countdown"
      suppressHydrationWarning
    >
      <div
        className={`flex flex-col gap-1 rounded-xl px-5 py-4 ring-1 ring-inset sm:flex-row sm:items-baseline sm:justify-between ${countdownTone[tone]}`}
      >
        <p className="text-3xl font-bold tracking-tight">{label}</p>
        <p className="text-sm font-medium opacity-80">
          Closing {formatHuman(closingDate)}
        </p>
      </div>

      {milestones.length > 0 ? (
        <div className="mt-5">
          <h3 className="sr-only">Milestone timeline</h3>
          <ol
            className="flex gap-3 overflow-x-auto pb-2 sm:gap-4"
            aria-label="Milestone timeline"
          >
            {milestones.map((m) => {
              const status = statusFor(m.date, todayISO);
              const isToday = status === "today";
              return (
                <li
                  key={m.id}
                  className="flex min-w-[7rem] flex-shrink-0 flex-col items-center text-center"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${markerDot[status]} ${
                      isToday ? "ring-2 ring-amber-300 ring-offset-1" : ""
                    }`}
                    aria-label={
                      isToday
                        ? `${m.label} — today`
                        : `${m.label}, ${formatHuman(m.date)}`
                    }
                  />
                  <span className="mt-1.5 text-xs font-medium text-ink">
                    {shortLabel(m.date)}
                  </span>
                  <span className="mt-0.5 text-[0.7rem] leading-tight text-ink-muted">
                    {m.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {outOfOrder
            ? "We can show the countdown, but couldn’t build a timeline — check that your closing date isn’t before your under-contract date."
            : "We can show the countdown, but couldn’t build a timeline — add your under-contract date below to map out your deadlines."}
        </p>
      )}
    </section>
  );
}
