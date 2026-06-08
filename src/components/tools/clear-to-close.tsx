"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { formatUSD } from "@/lib/savings";
import {
  CLEAR_TO_CLOSE_STEPS,
  appraisalGap,
  clearToCloseProgress,
  type ClearToCloseStep,
  type StepState,
} from "@/lib/tools/clear-to-close";
import { ToolDisclaimer } from "./tool-disclaimer";

interface ClearToCloseState {
  steps: ClearToCloseStep[];
  contractPrice: number;
  appraisedValue: number;
  plannedDownPayment: number;
}

const INITIAL: ClearToCloseState = {
  steps: CLEAR_TO_CLOSE_STEPS.map((s) => ({ ...s, state: "not-started", date: "" })),
  contractPrice: 0,
  appraisedValue: 0,
  plannedDownPayment: 0,
};

const STATE_LABEL: Record<StepState, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
};

export function ClearToClose() {
  const { value, hydrated, save, reset } = useStageTool<ClearToCloseState>(
    "clear-to-close",
    INITIAL,
  );

  // Re-merge against canonical steps so a future step change still appears,
  // matched by id and preserving the buyer's saved state/date.
  const steps = useMemo<ClearToCloseStep[]>(
    () =>
      CLEAR_TO_CLOSE_STEPS.map((canonical) => {
        const saved = value.steps.find((s) => s.id === canonical.id);
        return {
          ...canonical,
          state: saved?.state ?? "not-started",
          date: saved?.date ?? "",
        };
      }),
    [value.steps],
  );

  const progress = useMemo(() => clearToCloseProgress(steps), [steps]);
  const gap = useMemo(
    () =>
      appraisalGap({
        contractPrice: value.contractPrice,
        appraisedValue: value.appraisedValue,
        plannedDownPayment: value.plannedDownPayment,
      }),
    [value.contractPrice, value.appraisedValue, value.plannedDownPayment],
  );

  const patchStep = (id: string, patch: Partial<ClearToCloseStep>) =>
    save((prev) => ({
      ...prev,
      steps: CLEAR_TO_CLOSE_STEPS.map((canonical) => {
        const saved = prev.steps.find((s) => s.id === canonical.id);
        const base: ClearToCloseStep = {
          ...canonical,
          state: saved?.state ?? "not-started",
          date: saved?.date ?? "",
        };
        return canonical.id === id ? { ...base, ...patch } : base;
      }),
    }));

  const setField = (
    patch: Partial<Pick<ClearToCloseState, "contractPrice" | "appraisedValue" | "plannedDownPayment">>,
  ) => save((prev) => ({ ...prev, ...patch }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Clear-to-close tracker</h2>
          <span className="text-sm text-ink-soft">
            {progress.done}/{progress.total} done · {progress.percent}%
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="grid items-end gap-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="text-sm font-medium text-ink">{step.label}</span>
              <label className="block">
                <span className="sr-only">Status for {step.label}</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={step.state}
                  onChange={(e) =>
                    patchStep(step.id, { state: e.target.value as StepState })
                  }
                >
                  {(Object.keys(STATE_LABEL) as StepState[]).map((s) => (
                    <option key={s} value={s}>
                      {STATE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Date for {step.label}</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={step.date}
                  onChange={(e) => patchStep(step.id, { date: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Low-appraisal calculator</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Contract price</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.contractPrice || ""}
              onChange={(e) => setField({ contractPrice: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Appraised value</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.appraisedValue || ""}
              onChange={(e) => setField({ appraisedValue: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Planned down payment
            </span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.plannedDownPayment || ""}
              onChange={(e) => setField({ plannedDownPayment: Number(e.target.value) })}
            />
          </label>
        </div>

        {value.contractPrice > 0 && value.appraisedValue > 0 ? (
          gap.isLow ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-600 p-6 text-white">
                <p className="text-sm font-medium text-brand-100">
                  Appraisal gap
                </p>
                <p className="mt-1 text-3xl font-bold">{formatUSD(gap.gap)}</p>
                <p className="mt-2 text-sm text-brand-100">
                  The lender bases your loan on the lower appraised value, so
                  this gap is yours to address.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <OptionCard title="Bring more cash">
                  Add {formatUSD(gap.optionMoreCash.extraCash)} in cash to keep
                  your loan-to-value. Total cash for down payment + gap:{" "}
                  <strong>{formatUSD(gap.optionMoreCash.totalCashNeeded)}</strong>.
                </OptionCard>
                <OptionCard title="Renegotiate price">
                  Ask the seller to reduce the price by{" "}
                  {formatUSD(gap.optionRenegotiate.priceReductionToClose)} to the
                  appraised value. Extra cash needed:{" "}
                  <strong>{formatUSD(gap.optionRenegotiate.extraCash)}</strong>.
                </OptionCard>
                <OptionCard title="Appraisal-contingency exit">
                  If your contract has an appraisal contingency, you may be able
                  to exit. Extra cash:{" "}
                  <strong>{formatUSD(gap.optionContingencyExit.extraCash)}</strong>.
                </OptionCard>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              The appraisal meets or exceeds the contract price — no gap to
              cover.
            </p>
          )
        ) : null}
      </section>

      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset tool
        </button>
      </div>

      <ToolDisclaimer>
        These are <strong>estimates, not lending advice</strong>, and the
        options are not recommendations. Your lender and your purchase contract
        determine your actual choices and numbers.
      </ToolDisclaimer>
    </div>
  );
}

function OptionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-1">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
