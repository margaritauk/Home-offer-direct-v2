"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { calculateSavings, formatUSD, type SavingsInput } from "@/lib/savings";
import { savingsSanity } from "@/lib/tools/sanity";
import { SanityNotes } from "./tools/sanity-notes";

/**
 * Persisted savings-calculator inputs (issue #150, A2). Migrated from local
 * `useState` to `useStageTool` so the inputs persist + sync like every other
 * tool. Defaults are unchanged from the previous local state so the existing
 * E2E ($10,000 captured at 100% on a $400k home, 2.5% commission) stays green.
 */
export const INITIAL: SavingsInput = {
  homePrice: 400_000,
  downPaymentPercent: 10,
  buyerCommissionPercent: 2.5,
  captureRatePercent: 100,
  closingCostPercent: 3,
};

function Field({
  label,
  suffix,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-ink-soft">
        {label}
        <span className="font-semibold text-ink">
          {suffix === "$" ? formatUSD(value) : `${value}${suffix}`}
        </span>
      </span>
      <input
        type="range"
        className="mt-2 w-full accent-brand-600"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function SavingsCalculator() {
  const { value, hydrated, save } = useStageTool<SavingsInput>(
    "savings",
    INITIAL,
  );

  const patch = (p: Partial<SavingsInput>) =>
    save((prev) => ({ ...prev, ...p }));

  const result = useMemo(() => calculateSavings(value), [value]);

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-6">
        <Field
          label="Home price"
          suffix="$"
          value={value.homePrice}
          onChange={(homePrice) => patch({ homePrice })}
          min={100_000}
          max={2_000_000}
          step={5_000}
        />
        <Field
          label="Down payment"
          suffix="%"
          value={value.downPaymentPercent}
          onChange={(downPaymentPercent) => patch({ downPaymentPercent })}
          min={0}
          max={100}
          step={1}
          hint="Median is around 10% in 2025."
        />
        <Field
          label="Buyer-side commission on the table"
          suffix="%"
          value={value.buyerCommissionPercent}
          onChange={(buyerCommissionPercent) => patch({ buyerCommissionPercent })}
          min={0}
          max={4}
          step={0.1}
          hint="National average is ~2.5% of price."
        />
        <Field
          label="How much of it you negotiate to capture"
          suffix="%"
          value={value.captureRatePercent}
          onChange={(captureRatePercent) => patch({ captureRatePercent })}
          min={0}
          max={100}
          step={5}
          hint="0% = the seller keeps it. 100% = you negotiate all of it into a price cut or credit."
        />
        <Field
          label="Estimated closing costs"
          suffix="%"
          value={value.closingCostPercent}
          onChange={(closingCostPercent) => patch({ closingCostPercent })}
          min={0}
          max={6}
          step={0.5}
          hint="Buyer closing costs typically run 2–5% of the loan."
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">
            Estimated savings you capture
          </p>
          <p className="mt-1 text-4xl font-bold" data-testid="captured-savings">
            {formatUSD(result.capturedSavings)}
          </p>
          <p className="mt-2 text-sm text-brand-100">
            of {formatUSD(result.negotiableCommission)} potentially negotiable
          </p>
        </div>

        <dl className="card space-y-3 text-sm">
          <Row label="Down payment" value={formatUSD(result.downPayment)} />
          <Row label="Loan amount" value={formatUSD(result.loanAmount)} />
          <Row label="Estimated closing costs" value={formatUSD(result.closingCosts)} />
          <div className="border-t border-slate-200 pt-3">
            <Row
              label="Cash to close (before savings)"
              value={formatUSD(result.cashToCloseBefore)}
            />
            <Row
              label="Cash to close (after savings credit)"
              value={formatUSD(result.cashToCloseAfter)}
              emphasize
            />
          </div>
        </dl>
        <SanityNotes notes={savingsSanity(value)} />
        <p className="text-xs text-ink-muted">
          Estimates only — not financial advice. Actual costs, commission, and
          what you can negotiate vary by market, lender, and deal.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasize ? "font-semibold text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={emphasize ? "text-lg font-bold text-brand-700" : "font-medium text-ink"}>
        {value}
      </dd>
    </div>
  );
}
