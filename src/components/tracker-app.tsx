"use client";

import { useMemo, useState } from "react";
import {
  computeMilestones,
  formatISO,
  statusFor,
  daysBetween,
  isValidDate,
  type DeadlineOffsets,
  type MilestoneStatus,
} from "@/lib/deadlines";
import { useTracker } from "@/hooks/use-tracker";
import { DocumentChecklist } from "@/components/document-checklist";
import { TrackerClosingCountdown } from "@/components/tracker-closing-countdown";
import { TrackerIcsExport } from "@/components/tracker-ics-export";
import { UndoToast } from "@/components/undo-toast";

const statusStyles: Record<MilestoneStatus, { dot: string; chip: string; label: (d: number) => string }> = {
  overdue: { dot: "bg-red-500", chip: "bg-red-100 text-red-800", label: (d) => `${Math.abs(d)}d overdue` },
  today: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800", label: () => "Today" },
  soon: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800", label: (d) => `in ${d}d` },
  upcoming: { dot: "bg-brand-500", chip: "bg-brand-50 text-brand-700", label: (d) => `in ${d}d` },
};

const offsetFields: { key: keyof DeadlineOffsets; label: string }[] = [
  { key: "earnestMoneyDays", label: "Earnest money due (days)" },
  { key: "inspectionContingencyDays", label: "Inspection contingency (days)" },
  { key: "appraisalContingencyDays", label: "Appraisal contingency (days)" },
  { key: "financingContingencyDays", label: "Financing contingency (days)" },
  { key: "titleReviewDays", label: "Title review (days)" },
];

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

export function TrackerApp() {
  const {
    state,
    hydrated,
    setDates,
    setOffset,
    toggleDoc,
    reset,
    undoReset,
    canUndoReset,
  } = useTracker();
  const [showOffsets, setShowOffsets] = useState(false);

  const today = formatISO(Date.now());

  const hasDates =
    isValidDate(state.underContractDate) && isValidDate(state.closingDate);

  const milestones = useMemo(
    () =>
      hasDates
        ? computeMilestones({
            underContractDate: state.underContractDate,
            closingDate: state.closingDate,
            offsets: state.offsets,
          })
        : [],
    [hasDates, state.underContractDate, state.closingDate, state.offsets],
  );

  const datesOutOfOrder =
    hasDates && daysBetween(state.underContractDate, state.closingDate) < 0;

  return (
    <div className="space-y-12">
      {/* Closing countdown + compact timeline (#165) */}
      <TrackerClosingCountdown
        underContractDate={state.underContractDate}
        closingDate={state.closingDate}
        offsets={state.offsets}
        today={today}
        hydrated={hydrated}
      />

      {/* Inputs */}
      <section className="card">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">
              Date you went under contract
            </span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              value={hydrated ? state.underContractDate : ""}
              onChange={(e) => setDates({ underContractDate: e.target.value })}
              suppressHydrationWarning
              aria-label="Date you went under contract"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">
              Target closing date
            </span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              value={hydrated ? state.closingDate : ""}
              onChange={(e) => setDates({ closingDate: e.target.value })}
              suppressHydrationWarning
              aria-label="Target closing date"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() => setShowOffsets((v) => !v)}
          >
            {showOffsets ? "Hide" : "Adjust"} contingency periods
          </button>
          {hydrated && (state.underContractDate || state.closingDate) ? (
            <button
              type="button"
              className="text-sm font-medium text-ink-muted hover:text-ink"
              onClick={reset}
            >
              Reset tracker
            </button>
          ) : null}
        </div>

        {hydrated ? (
          <div className="mt-4">
            <UndoToast
              show={canUndoReset}
              onUndo={undoReset}
              label="Tracker reset"
            />
          </div>
        ) : null}

        {showOffsets ? (
          <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {offsetFields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm text-ink-soft">{f.label}</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={hydrated ? state.offsets[f.key] : 0}
                  onChange={(e) => setOffset(f.key, Number(e.target.value))}
                  suppressHydrationWarning
                />
              </label>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-ink-muted">
          These are typical defaults, not your legal terms — your signed contract
          governs. Edit any period to match it.
        </p>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-2xl font-bold">Your deadlines</h2>
        {datesOutOfOrder ? (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            Your closing date is before your under-contract date — double-check
            them.
          </p>
        ) : null}

        {hasDates && !datesOutOfOrder ? (
          <ol className="mt-6 space-y-3">
            {milestones.map((m) => {
              const status = statusFor(m.date, today);
              const styles = statusStyles[status];
              const diff = daysBetween(today, m.date);
              return (
                <li key={m.id} className="card flex items-start gap-4">
                  <span className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${styles.dot}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{m.label}</h3>
                      {m.critical ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-soft">
                          critical
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.chip}`}>
                        {styles.label(diff)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-ink-soft">
                      {formatHuman(m.date)}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : !datesOutOfOrder ? (
          <p className="mt-3 text-ink-muted" suppressHydrationWarning>
            Enter your under-contract and closing dates above to see your
            personalized deadline timeline.
          </p>
        ) : null}
      </section>

      {/* Calendar export (A8) */}
      <TrackerIcsExport milestones={datesOutOfOrder ? [] : milestones} />

      {/* Documents */}
      <DocumentChecklist docs={state.docs} onToggle={toggleDoc} hydrated={hydrated} />
    </div>
  );
}
