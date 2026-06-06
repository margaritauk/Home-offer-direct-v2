"use client";

import { useMemo, useState } from "react";
import { calculateSavings, formatUSD } from "@/lib/savings";

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
  const [homePrice, setHomePrice] = useState(400_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [buyerCommissionPercent, setBuyerCommissionPercent] = useState(2.5);
  const [captureRatePercent, setCaptureRatePercent] = useState(100);
  const [closingCostPercent, setClosingCostPercent] = useState(3);

  const result = useMemo(
    () =>
      calculateSavings({
        homePrice,
        downPaymentPercent,
        buyerCommissionPercent,
        captureRatePercent,
        closingCostPercent,
      }),
    [homePrice, downPaymentPercent, buyerCommissionPercent, captureRatePercent, closingCostPercent],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-6">
        <Field
          label="Home price"
          suffix="$"
          value={homePrice}
          onChange={setHomePrice}
          min={100_000}
          max={2_000_000}
          step={5_000}
        />
        <Field
          label="Down payment"
          suffix="%"
          value={downPaymentPercent}
          onChange={setDownPaymentPercent}
          min={0}
          max={100}
          step={1}
          hint="Median is around 10% in 2025."
        />
        <Field
          label="Buyer-side commission on the table"
          suffix="%"
          value={buyerCommissionPercent}
          onChange={setBuyerCommissionPercent}
          min={0}
          max={4}
          step={0.1}
          hint="National average is ~2.5% of price."
        />
        <Field
          label="How much of it you negotiate to capture"
          suffix="%"
          value={captureRatePercent}
          onChange={setCaptureRatePercent}
          min={0}
          max={100}
          step={5}
          hint="0% = the seller keeps it. 100% = you negotiate all of it into a price cut or credit."
        />
        <Field
          label="Estimated closing costs"
          suffix="%"
          value={closingCostPercent}
          onChange={setClosingCostPercent}
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
