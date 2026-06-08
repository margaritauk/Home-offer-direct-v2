"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { formatUSD } from "@/lib/savings";
import { compareLenders, type LenderQuote } from "@/lib/tools/lender-compare";
import { ToolDisclaimer } from "./tool-disclaimer";

interface LenderState {
  horizonMonths: number;
  quotes: LenderQuote[];
}

const INITIAL: LenderState = { horizonMonths: 60, quotes: [] };

function newQuote(): LenderQuote {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `lender-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    loanAmount: 0,
    ratePercent: 0,
    points: 0,
    lenderFees: 0,
    monthlyPI: 0,
    aprPercent: 0,
  };
}

const HORIZONS = [
  { months: 36, label: "3 years" },
  { months: 60, label: "5 years" },
  { months: 84, label: "7 years" },
  { months: 120, label: "10 years" },
];

export function LenderCompare() {
  const { value, hydrated, save, reset } = useStageTool<LenderState>(
    "lender-compare",
    INITIAL,
  );

  const rows = useMemo(
    () => compareLenders(value.quotes, value.horizonMonths),
    [value.quotes, value.horizonMonths],
  );

  const addQuote = () =>
    save((prev) => ({ ...prev, quotes: [...prev.quotes, newQuote()] }));
  const removeQuote = (id: string) =>
    save((prev) => ({ ...prev, quotes: prev.quotes.filter((q) => q.id !== id) }));
  const patchQuote = (id: string, patch: Partial<LenderQuote>) =>
    save((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  const setHorizon = (months: number) =>
    save((prev) => ({ ...prev, horizonMonths: months }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm">
          <span className="mr-2 font-medium text-ink-soft">Compare over</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={value.horizonMonths}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            {HORIZONS.map((h) => (
              <option key={h.months} value={h.months}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={addQuote}>
            Add a lender
          </button>
          {value.quotes.length > 0 ? (
            <button type="button" className="btn-secondary" onClick={reset}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      {value.quotes.length === 0 ? (
        <div className="card text-center text-sm text-ink-soft">
          Add lenders using the numbers from your own Loan Estimates to compare
          them side-by-side.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`card space-y-4 ${row.isLowest ? "border-brand-500 ring-1 ring-brand-500" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <label className="block flex-1">
                  <span className="text-sm font-medium text-ink-soft">Lender</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Lender name"
                    value={row.name}
                    onChange={(e) => patchQuote(row.id, { name: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="btn-secondary mt-6 shrink-0"
                  onClick={() => removeQuote(row.id)}
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <Num label="Loan amount" value={row.loanAmount} onChange={(n) => patchQuote(row.id, { loanAmount: n })} />
                <Num label="Rate %" value={row.ratePercent} onChange={(n) => patchQuote(row.id, { ratePercent: n })} step={0.01} />
                <Num label="Points" value={row.points} onChange={(n) => patchQuote(row.id, { points: n })} step={0.125} />
                <Num label="Lender fees" value={row.lenderFees} onChange={(n) => patchQuote(row.id, { lenderFees: n })} />
                <Num label="Monthly P&I" value={row.monthlyPI} onChange={(n) => patchQuote(row.id, { monthlyPI: n })} />
                <Num label="APR %" value={row.aprPercent} onChange={(n) => patchQuote(row.id, { aprPercent: n })} step={0.01} />
              </div>

              <dl className="grid gap-2 border-t border-slate-200 pt-3 text-sm sm:grid-cols-3">
                <Stat label="Upfront (points + fees)" value={formatUSD(row.upfrontCost)} />
                <Stat label="Payments over horizon" value={formatUSD(row.paymentsOverHorizon)} />
                <Stat
                  label="Total cost"
                  value={formatUSD(row.totalCost)}
                  emphasize
                  badge={row.isLowest ? "Lowest total" : undefined}
                />
              </dl>
            </div>
          ))}
        </div>
      )}

      <ToolDisclaimer>
        Education, not lending advice — and <strong>not a rate offer</strong>.
        Every number here comes from <em>your own</em> Loan Estimates; this tool
        only adds them up over the horizon you choose. Only a lender can make you
        an actual offer. The lowest total cost isn&apos;t always the right loan
        for you.
      </ToolDisclaimer>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Stat({
  label,
  value,
  emphasize,
  badge,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  badge?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={emphasize ? "text-lg font-bold text-brand-700" : "font-medium text-ink"}>
        {value}
        {badge ? (
          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {badge}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
