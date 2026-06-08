"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { formatUSD } from "@/lib/savings";
import { CREDIT_CHECKLIST, savingsGoal } from "@/lib/tools/get-ready";
import { ToolDisclaimer } from "./tool-disclaimer";

interface GetReadyState {
  checked: Record<string, boolean>;
  homePrice: number;
  downPaymentPercent: number;
  closingCostPercent: number;
  currentSaved: number;
}

const INITIAL: GetReadyState = {
  checked: {},
  homePrice: 400_000,
  downPaymentPercent: 10,
  closingCostPercent: 3,
  currentSaved: 0,
};

export function GetReady() {
  const { value, hydrated, save, reset } = useStageTool<GetReadyState>(
    "get-ready",
    INITIAL,
  );

  const goal = useMemo(
    () =>
      savingsGoal({
        homePrice: value.homePrice,
        downPaymentPercent: value.downPaymentPercent,
        closingCostPercent: value.closingCostPercent,
        currentSaved: value.currentSaved,
      }),
    [value.homePrice, value.downPaymentPercent, value.closingCostPercent, value.currentSaved],
  );

  const doneCount = CREDIT_CHECKLIST.filter((i) => value.checked[i.id]).length;

  const toggle = (id: string) =>
    save((prev) => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }));

  const setField = (patch: Partial<GetReadyState>) =>
    save((prev) => ({ ...prev, ...patch }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-label="Credit-readiness checklist" className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Credit-readiness checklist</h2>
          <span className="text-sm text-ink-muted">
            {doneCount} / {CREDIT_CHECKLIST.length}
          </span>
        </div>
        <ul className="space-y-3">
          {CREDIT_CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 accent-brand-600"
                  checked={Boolean(value.checked[item.id])}
                  onChange={() => toggle(item.id)}
                />
                <span>
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="block text-sm text-ink-soft">{item.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-muted">
          Educational steps only — we never collect or estimate a credit score
          and this isn&apos;t credit advice.
        </p>
      </section>

      <section aria-label="Savings goal" className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Savings goal</h2>
          <Field
            label="Target home price"
            value={value.homePrice}
            onChange={(n) => setField({ homePrice: n })}
            suffix="$"
          />
          <Field
            label="Down payment %"
            value={value.downPaymentPercent}
            onChange={(n) => setField({ downPaymentPercent: n })}
            suffix="%"
          />
          <Field
            label="Estimated closing costs %"
            value={value.closingCostPercent}
            onChange={(n) => setField({ closingCostPercent: n })}
            suffix="%"
          />
          <Field
            label="Saved so far"
            value={value.currentSaved}
            onChange={(n) => setField({ currentSaved: n })}
            suffix="$"
          />
          <button type="button" className="btn-secondary" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">
            Cash target (down payment + closing costs)
          </p>
          <p className="mt-1 text-3xl font-bold">{formatUSD(goal.totalTarget)}</p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-800">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${goal.percentComplete}%` }}
              role="progressbar"
              aria-valuenow={Math.round(goal.percentComplete)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-sm text-brand-100">
            {goal.reached
              ? "Goal reached — you've saved enough for this target."
              : `${goal.percentComplete.toFixed(0)}% there · ${formatUSD(goal.gap)} to go`}
          </p>
        </div>
      </section>

      <div className="lg:col-span-2">
        <ToolDisclaimer>
          Education, not financial or credit advice. Targets are estimates based
          on the numbers you enter; your actual down payment, closing costs, and
          loan program will vary by lender and market.
        </ToolDisclaimer>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix: "$" | "%";
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-ink-soft">
        {label}
        <span className="font-semibold text-ink">
          {suffix === "$" ? formatUSD(value) : `${value}%`}
        </span>
      </span>
      <input
        type="number"
        min={0}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
