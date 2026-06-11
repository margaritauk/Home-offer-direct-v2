"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { formatUSD } from "@/lib/savings";
import {
  DEFAULT_BACK_CAP_PCT,
  DEFAULT_FRONT_CAP_PCT,
  DEFAULT_PMI_RATE_PCT,
  HIGH_BACK_CAP_PCT,
  maxAffordablePrice,
  monthlyPITI,
  type AffordabilityInput,
  type PitiBreakdown,
  type PitiInput,
} from "@/lib/budget";
import { explainBudget, type BudgetInsight } from "@/lib/budget-explainer";
import { budgetSanity } from "@/lib/tools/sanity";
import { UndoToast } from "@/components/undo-toast";
import { Term } from "@/components/term";
import { SanityNotes } from "./sanity-notes";
import { ToolDisclaimer } from "./tool-disclaimer";
import { ValidatedNumberField } from "./validated-field";

type Mode = "payment" | "affordability";

/** All inputs for both modes plus the active mode, persisted as one blob. */
export interface BudgetState {
  mode: Mode;
  /** Monthly-payment (PITI) mode inputs. */
  piti: PitiInput;
  /** Affordability mode inputs. */
  affordability: AffordabilityInput & {
    frontCapPct: number;
    backCapPct: number;
  };
}

export const INITIAL: BudgetState = {
  mode: "payment",
  piti: {
    price: 400_000,
    downPct: 10,
    ratePct: 6.5,
    termYears: 30,
    propTaxYr: 4_400,
    insuranceYr: 1_500,
    hoaMo: 0,
    pmiRatePct: DEFAULT_PMI_RATE_PCT,
  },
  affordability: {
    grossMonthlyIncome: 9_000,
    monthlyDebts: 500,
    downPayment: 40_000,
    ratePct: 6.5,
    termYears: 30,
    propTaxRatePct: 1.1,
    insuranceYr: 1_500,
    hoaMo: 0,
    pmiRatePct: DEFAULT_PMI_RATE_PCT,
    frontCapPct: DEFAULT_FRONT_CAP_PCT,
    backCapPct: DEFAULT_BACK_CAP_PCT,
  },
};

function formatMonthly(n: number): string {
  return `${formatUSD(n)}/mo`;
}

export function BudgetCalculator() {
  const { value, hydrated, save, reset, undoReset, canUndoReset } =
    useStageTool<BudgetState>("budget", INITIAL);

  const setMode = (mode: Mode) => save((prev) => ({ ...prev, mode }));
  const patchPiti = (patch: Partial<PitiInput>) =>
    save((prev) => ({ ...prev, piti: { ...prev.piti, ...patch } }));
  const patchAfford = (patch: Partial<BudgetState["affordability"]>) =>
    save((prev) => ({
      ...prev,
      affordability: { ...prev.affordability, ...patch },
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full border border-slate-300 p-1"
          role="tablist"
          aria-label="Calculator mode"
        >
          <ModeTab
            active={value.mode === "payment"}
            onClick={() => setMode("payment")}
          >
            Monthly payment
          </ModeTab>
          <ModeTab
            active={value.mode === "affordability"}
            onClick={() => setMode("affordability")}
          >
            Affordability
          </ModeTab>
        </div>
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>

      <UndoToast show={canUndoReset} onUndo={undoReset} />

      {value.mode === "payment" ? (
        <PaymentMode input={value.piti} onPatch={patchPiti} />
      ) : (
        <AffordabilityMode
          input={value.affordability}
          onPatch={patchAfford}
        />
      )}

      <ToolDisclaimer>
        These are <strong>estimates only — not financial advice</strong>. A
        lender or underwriter determines what you actually qualify for, and your
        real rate, taxes, insurance, and PMI will vary by location, credit, and
        loan program.
      </ToolDisclaimer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly-payment (PITI) mode
// ---------------------------------------------------------------------------

function PaymentMode({
  input,
  onPatch,
}: {
  input: PitiInput;
  onPatch: (patch: Partial<PitiInput>) => void;
}) {
  const breakdown = useMemo(() => monthlyPITI(input), [input]);
  const [exporting, setExporting] = useState<null | "xlsx" | "csv">(null);

  // ExcelJS is large — dynamically import the export module inside the handler
  // so it stays out of the /tools/budget initial bundle.
  const handleExportExcel = async () => {
    setExporting("xlsx");
    try {
      const mod = await import("@/lib/tools/budget-export");
      const wb = mod.buildBudgetWorkbook(input);
      await mod.downloadWorkbook(wb, "homeoffer-budget.xlsx");
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const mod = await import("@/lib/tools/budget-export");
      const csv = mod.budgetToCsv(input, breakdown);
      mod.downloadCsv(csv, "homeoffer-budget.csv");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-6">
        <SliderField
          label="Home price"
          suffix="$"
          value={input.price}
          onChange={(price) => onPatch({ price })}
          min={50_000}
          max={2_000_000}
          step={5_000}
        />
        <SliderField
          label="Down payment"
          suffix="%"
          value={input.downPct}
          onChange={(downPct) => onPatch({ downPct })}
          min={0}
          max={100}
          step={1}
          hint="Below 20% adds PMI."
        />
        <SliderField
          label="Interest rate"
          suffix="%"
          value={input.ratePct}
          onChange={(ratePct) => onPatch({ ratePct })}
          min={0}
          max={12}
          step={0.05}
        />
        <SliderField
          label="Loan term"
          suffix=" yrs"
          value={input.termYears}
          onChange={(termYears) => onPatch({ termYears })}
          min={5}
          max={40}
          step={5}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedNumberField
            label="Property tax (annual)"
            unit="$"
            value={input.propTaxYr}
            onChange={(propTaxYr) => onPatch({ propTaxYr })}
            bounds={{ min: 0, max: 200_000, softMax: 50_000 }}
          />
          <ValidatedNumberField
            label="Insurance (annual)"
            unit="$"
            value={input.insuranceYr}
            onChange={(insuranceYr) => onPatch({ insuranceYr })}
            bounds={{ min: 0, max: 100_000, softMax: 20_000 }}
          />
          <ValidatedNumberField
            label="HOA (monthly)"
            unit="$"
            value={input.hoaMo}
            onChange={(hoaMo) => onPatch({ hoaMo })}
            bounds={{ min: 0, max: 10_000, softMax: 2_000 }}
          />
          <ValidatedNumberField
            label="PMI rate (%)"
            unit="%"
            value={input.pmiRatePct}
            onChange={(pmiRatePct) => onPatch({ pmiRatePct })}
            step={0.05}
            bounds={{ min: 0, max: 5, softMax: 2 }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">
            Estimated monthly payment
          </p>
          <p
            className="mt-1 text-4xl font-bold"
            data-testid="piti-total"
          >
            {formatMonthly(breakdown.total)}
          </p>
          <p className="mt-2 text-sm text-brand-100">
            {formatUSD(breakdown.loanAmount)} loan ·{" "}
            {Math.round(breakdown.ltv)}% <Term slug="loan-to-value">LTV</Term>
            {breakdown.pmi > 0 ? (
              <span
                data-testid="pmi-badge"
                className="ml-2 inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950"
              >
                PMI applies
              </span>
            ) : null}
          </p>
        </div>

        <dl className="card space-y-3 text-sm">
          <Row label="Principal & interest" value={formatMonthly(breakdown.pi)} />
          <Row label="Property tax" value={formatMonthly(breakdown.tax)} />
          <Row label="Insurance" value={formatMonthly(breakdown.insurance)} />
          <Row label="HOA" value={formatMonthly(breakdown.hoa)} />
          <Row label="PMI" value={formatMonthly(breakdown.pmi)} />
          <div className="border-t border-slate-200 pt-3">
            <Row
              label="Total monthly (PITI)"
              value={formatMonthly(breakdown.total)}
              emphasize
            />
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportExcel}
            disabled={exporting !== null}
          >
            {exporting === "xlsx" ? "Exporting…" : "Export Excel (.xlsx)"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            disabled={exporting !== null}
          >
            {exporting === "csv" ? "Exporting…" : "Export CSV"}
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          The spreadsheet uses live formulas — edit the inputs in Excel and the
          payment recalculates.
        </p>

        <BudgetInsights insights={explainBudget(breakdown)} />
        <SanityNotes notes={budgetSanity(input)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Affordability mode
// ---------------------------------------------------------------------------

function AffordabilityMode({
  input,
  onPatch,
}: {
  input: BudgetState["affordability"];
  onPatch: (patch: Partial<BudgetState["affordability"]>) => void;
}) {
  const result = useMemo(() => maxAffordablePrice(input), [input]);
  const bindingLabel =
    result.bindingConstraint === "front"
      ? "Your housing-payment (front-end) cap is the limit."
      : "Your total-debt (back-end) cap is the limit.";

  // The 43% back-end option toggles the higher Qualified-Mortgage ceiling.
  const highBack = input.backCapPct >= HIGH_BACK_CAP_PCT;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card space-y-6">
        <ValidatedNumberField
          label="Gross monthly income"
          unit="$"
          value={input.grossMonthlyIncome}
          onChange={(grossMonthlyIncome) => onPatch({ grossMonthlyIncome })}
          bounds={{ min: 0, max: 1_000_000, softMax: 100_000 }}
        />
        <ValidatedNumberField
          label="Monthly debts (cars, cards, loans)"
          unit="$"
          value={input.monthlyDebts}
          onChange={(monthlyDebts) => onPatch({ monthlyDebts })}
          bounds={{ min: 0, max: 100_000, softMax: 20_000 }}
        />
        <ValidatedNumberField
          label="Down payment ($)"
          unit="$"
          value={input.downPayment}
          onChange={(downPayment) => onPatch({ downPayment })}
          bounds={{ min: 0, max: 5_000_000, softMax: 1_000_000 }}
        />
        <SliderField
          label="Interest rate"
          suffix="%"
          value={input.ratePct}
          onChange={(ratePct) => onPatch({ ratePct })}
          min={0}
          max={12}
          step={0.05}
        />
        <SliderField
          label="Loan term"
          suffix=" yrs"
          value={input.termYears}
          onChange={(termYears) => onPatch({ termYears })}
          min={5}
          max={40}
          step={5}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedNumberField
            label="Property-tax rate (%/yr)"
            unit="%"
            value={input.propTaxRatePct}
            onChange={(propTaxRatePct) => onPatch({ propTaxRatePct })}
            step={0.05}
            bounds={{ min: 0, max: 10, softMax: 3 }}
          />
          <ValidatedNumberField
            label="Insurance (annual)"
            unit="$"
            value={input.insuranceYr}
            onChange={(insuranceYr) => onPatch({ insuranceYr })}
            bounds={{ min: 0, max: 100_000, softMax: 20_000 }}
          />
          <ValidatedNumberField
            label="HOA (monthly)"
            unit="$"
            value={input.hoaMo}
            onChange={(hoaMo) => onPatch({ hoaMo })}
            bounds={{ min: 0, max: 10_000, softMax: 2_000 }}
          />
          <ValidatedNumberField
            label="PMI rate (%)"
            unit="%"
            value={input.pmiRatePct}
            onChange={(pmiRatePct) => onPatch({ pmiRatePct })}
            step={0.05}
            bounds={{ min: 0, max: 5, softMax: 2 }}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink-soft">
            <Term slug="debt-to-income">DTI</Term> caps (front / back)
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <ValidatedNumberField
              label="Front-end cap (%)"
              unit="%"
              value={input.frontCapPct}
              onChange={(frontCapPct) => onPatch({ frontCapPct })}
              bounds={{ min: 0, max: 60 }}
            />
            <ValidatedNumberField
              label="Back-end cap (%)"
              unit="%"
              value={input.backCapPct}
              onChange={(backCapPct) => onPatch({ backCapPct })}
              bounds={{ min: 0, max: 60 }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="accent-brand-600"
              checked={highBack}
              onChange={(e) =>
                onPatch({
                  backCapPct: e.target.checked
                    ? HIGH_BACK_CAP_PCT
                    : DEFAULT_BACK_CAP_PCT,
                })
              }
            />
            Allow {HIGH_BACK_CAP_PCT}% back-end DTI (Qualified-Mortgage ceiling)
          </label>
        </fieldset>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">
            Estimated max home price
          </p>
          <p className="mt-1 text-4xl font-bold" data-testid="max-price">
            {formatUSD(result.maxPrice)}
          </p>
          <p className="mt-2 text-sm text-brand-100">
            {formatUSD(result.maxLoan)} max loan ·{" "}
            <span data-testid="binding-constraint">{bindingLabel}</span>
            {result.piti.pmi > 0 ? (
              <span
                data-testid="pmi-badge"
                className="ml-2 inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950"
              >
                PMI applies
              </span>
            ) : null}
          </p>
        </div>

        <dl className="card space-y-3 text-sm">
          <Row
            label="Principal & interest"
            value={formatMonthly(result.piti.pi)}
          />
          <Row label="Property tax" value={formatMonthly(result.piti.tax)} />
          <Row label="Insurance" value={formatMonthly(result.piti.insurance)} />
          <Row label="HOA" value={formatMonthly(result.piti.hoa)} />
          <Row label="PMI" value={formatMonthly(result.piti.pmi)} />
          <div className="border-t border-slate-200 pt-3">
            <Row
              label="Total monthly (PITI)"
              value={formatMonthly(result.piti.total)}
              emphasize
            />
          </div>
        </dl>

        <BudgetInsights
          insights={explainBudget(result.piti, {
            grossMonthlyIncome: input.grossMonthlyIncome,
          })}
        />
        <SanityNotes
          notes={budgetSanity(
            {
              // Anchor the price at the solved max so the down-payment-vs-price
              // check has a price to compare against; the rest of the fields are
              // ignored when the affordability arg is supplied.
              price: result.maxPrice,
              downPct: 0,
              ratePct: input.ratePct,
              termYears: input.termYears,
              propTaxYr: 0,
              insuranceYr: input.insuranceYr,
              hoaMo: input.hoaMo,
              pmiRatePct: input.pmiRatePct,
            },
            input,
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deterministic budget explainer (#125)
// ---------------------------------------------------------------------------

const INSIGHT_TONES: Record<BudgetInsight["tone"], string> = {
  info: "border-slate-200 bg-slate-50 text-ink-soft",
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
};

function BudgetInsights({ insights }: { insights: BudgetInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <section aria-label="What your numbers mean" className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">What your numbers mean</h3>
      {insights.map((i) => (
        <div
          key={i.id}
          className={`rounded-lg border p-3 text-sm ${INSIGHT_TONES[i.tone]}`}
        >
          <p className="font-medium">{i.title}</p>
          <p className="mt-0.5">{i.body}</p>
        </div>
      ))}
      <p className="text-xs text-ink-muted">
        These notes explain your own numbers — they don&apos;t recommend a loan
        or lender.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared field primitives (mirrors savings-calculator + comps-worksheet)
// ---------------------------------------------------------------------------

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand-600 text-white" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SliderField({
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
      {hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
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
      <dt className={emphasize ? "font-semibold text-ink" : "text-ink-soft"}>
        {label}
      </dt>
      <dd
        className={
          emphasize
            ? "text-lg font-bold text-brand-700"
            : "font-medium text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}

// Re-export for downstream typing/tests.
export type { PitiBreakdown };
