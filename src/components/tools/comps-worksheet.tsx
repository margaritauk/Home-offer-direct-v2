"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { HomePicker } from "@/components/homes/home-picker";
import { formatUSD } from "@/lib/savings";
import { compsEstimate, type Comp } from "@/lib/tools/comps";
import { ToolDisclaimer } from "./tool-disclaimer";

interface CompsState {
  subjectLabel: string;
  subjectSqft: number;
  comps: Comp[];
}

const INITIAL: CompsState = { subjectLabel: "", subjectSqft: 0, comps: [] };

function newComp(): Comp {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `comp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "",
    salePrice: 0,
    sqft: 0,
    adjustment: 0,
  };
}

function perSqftLabel(v: number | null): string {
  return v === null ? "—" : `${formatUSD(v)}/sqft`;
}

export function CompsWorksheet() {
  const { value, hydrated, save, reset } = useStageTool<CompsState>(
    "comps",
    INITIAL,
  );

  const estimate = useMemo(
    () => compsEstimate({ sqft: value.subjectSqft }, value.comps),
    [value.subjectSqft, value.comps],
  );

  const setSubject = (patch: Partial<Pick<CompsState, "subjectLabel" | "subjectSqft">>) =>
    save((prev) => ({ ...prev, ...patch }));

  const addComp = () => save((prev) => ({ ...prev, comps: [...prev.comps, newComp()] }));
  const removeComp = (id: string) =>
    save((prev) => ({ ...prev, comps: prev.comps.filter((c) => c.id !== id) }));
  const patchComp = (id: string, patch: Partial<Comp>) =>
    save((prev) => ({
      ...prev,
      comps: prev.comps.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Subject home</h2>
          <HomePicker
            label="Pick a home"
            onPick={(home) =>
              setSubject({
                subjectLabel: home.label,
                // Prefill sqft from the picked listing when it carries one.
                ...(home.sqft ? { subjectSqft: home.sqft } : {}),
              })
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Address / label</span>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="The home you're considering"
              value={value.subjectLabel}
              onChange={(e) => setSubject({ subjectLabel: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Living area (sqft)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.subjectSqft || ""}
              onChange={(e) => setSubject({ subjectSqft: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comparable sales</h2>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={addComp}>
              Add a comp
            </button>
            {value.comps.length > 0 ? (
              <button type="button" className="btn-secondary" onClick={reset}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {value.comps.length === 0 ? (
          <div className="card text-center text-sm text-ink-soft">
            Add recent comparable sales to estimate a fair value.
          </div>
        ) : (
          <div className="space-y-3">
            {estimate.comps.map((comp) => (
              <div key={comp.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <label className="block flex-1">
                    <span className="text-sm font-medium text-ink-soft">
                      Comp address / label
                    </span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="A recently sold comparable"
                      value={comp.label}
                      onChange={(e) => patchComp(comp.id, { label: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary mt-6 shrink-0"
                    onClick={() => removeComp(comp.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField
                    label="Sale price"
                    value={comp.salePrice}
                    onChange={(n) => patchComp(comp.id, { salePrice: n })}
                  />
                  <NumberField
                    label="Sqft"
                    value={comp.sqft}
                    onChange={(n) => patchComp(comp.id, { sqft: n })}
                  />
                  <NumberField
                    label="Adjustment (+ if superior)"
                    value={comp.adjustment ?? 0}
                    onChange={(n) => patchComp(comp.id, { adjustment: n })}
                    allowNegative
                  />
                </div>
                <p className="text-sm text-ink-soft">
                  Adjusted:{" "}
                  <span className="font-semibold text-ink">
                    {formatUSD(comp.adjustedPrice)}
                  </span>{" "}
                  · {perSqftLabel(comp.adjustedPricePerSqft)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {estimate.usableCount > 0 ? (
        <section
          aria-label="Estimated fair value"
          className="rounded-xl bg-brand-600 p-6 text-white"
        >
          <p className="text-sm font-medium text-brand-100">
            Estimated fair-value range for {value.subjectLabel || "the subject"}
          </p>
          {estimate.estimatedMid !== null ? (
            <>
              <p className="mt-1 text-3xl font-bold">
                {formatUSD(estimate.estimatedLow ?? 0)} –{" "}
                {formatUSD(estimate.estimatedHigh ?? 0)}
              </p>
              <p className="mt-2 text-sm text-brand-100">
                Midpoint {formatUSD(estimate.estimatedMid)} · based on{" "}
                {estimate.usableCount} comp
                {estimate.usableCount === 1 ? "" : "s"} averaging{" "}
                {formatUSD(estimate.avgPricePerSqft ?? 0)}/sqft
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-brand-100">
              Enter the subject home&apos;s square footage to see a value range.
              Adjusted comps average {formatUSD(estimate.avgPricePerSqft ?? 0)}/sqft.
            </p>
          )}
        </section>
      ) : null}

      <ToolDisclaimer>
        This is an <strong>estimate, not an appraisal</strong> and not financial
        advice. A licensed appraiser or your lender produces the official value.
        Results depend entirely on the comps and adjustments you enter.
      </ToolDisclaimer>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  allowNegative,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  allowNegative?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        type="number"
        min={allowNegative ? undefined : 0}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
