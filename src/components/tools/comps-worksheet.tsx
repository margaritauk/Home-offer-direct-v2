"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { HomePicker } from "@/components/homes/home-picker";
import { isAiCompsEnabled, isCompsDemoEnabled } from "@/lib/ai/config";
import { formatUSD } from "@/lib/savings";
import {
  compsEstimate,
  normalizeCompsState,
  type Comp,
  type CompsState,
  type InterestedHome,
} from "@/lib/tools/comps";
import { SampleCompsDataSource } from "@/lib/tools/comps-source";
import { rankComps } from "@/lib/tools/comps-rank";
import { UndoToast } from "@/components/undo-toast";
import { ToolDisclaimer } from "./tool-disclaimer";

/** Whether the UI is allowed to offer the real AI auto-find button (default false). */
const AI_COMPS_ENABLED = isAiCompsEnabled();

/**
 * Whether the DEMO (illustrative sample comps) auto option is offered. Only
 * consulted when the real AI path is OFF, so the real path always takes
 * precedence (issue #127).
 */
const COMPS_DEMO_ENABLED = isCompsDemoEnabled();

/** True when the auto mode is offered at all (real AI OR sample demo). */
const AUTO_MODE_OFFERED = AI_COMPS_ENABLED || COMPS_DEMO_ENABLED;

const INITIAL: CompsState = { homes: [] };

function freshId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newComp(): Comp {
  return {
    id: freshId("comp"),
    label: "",
    salePrice: 0,
    sqft: 0,
    adjustment: 0,
  };
}

function newHome(): InterestedHome {
  return { id: freshId("home"), label: "", sqft: 0, mode: "manual", comps: [] };
}

function perSqftLabel(v: number | null): string {
  return v === null ? "—" : `${formatUSD(v)}/sqft`;
}

export function CompsWorksheet() {
  const { value, hydrated, save, reset, undoReset, canUndoReset } =
    useStageTool<CompsState>("comps", INITIAL);

  // Normalize on every render so both legacy and new blobs render correctly;
  // the first save then persists the new shape. Cheap + pure (issue #103).
  const state = useMemo(() => normalizeCompsState(value), [value]);
  const { homes } = state;

  const addHome = () => save(() => ({ ...state, homes: [...homes, newHome()] }));
  const removeHome = (id: string) =>
    save(() => ({ ...state, homes: homes.filter((h) => h.id !== id) }));
  const patchHome = (id: string, patch: Partial<InterestedHome>) =>
    save(() => ({
      ...state,
      homes: homes.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Homes you&apos;re interested in</h2>
          <p className="text-sm text-ink-soft">
            Add each home you&apos;re weighing and enter its comps to estimate a
            fair value.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={addHome}>
            Add a home
          </button>
          {homes.length > 0 ? (
            <button type="button" className="btn-secondary" onClick={reset}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <UndoToast show={canUndoReset} onUndo={undoReset} label="Cleared" />

      {homes.length === 0 ? (
        <div className="card text-center text-sm text-ink-soft">
          Add a home you&apos;re interested in to get started.
        </div>
      ) : (
        <div className="space-y-10">
          {homes.map((home, index) => (
            <HomeCard
              key={home.id}
              home={home}
              index={index}
              onRemove={() => removeHome(home.id)}
              onPatch={(patch) => patchHome(home.id, patch)}
            />
          ))}
        </div>
      )}

      <ToolDisclaimer>
        This is an <strong>estimate, not an appraisal</strong> and not financial
        advice. A licensed appraiser or your lender produces the official value.
        Results depend entirely on the comps and adjustments you enter.
      </ToolDisclaimer>
    </div>
  );
}

function HomeCard({
  home,
  index,
  onRemove,
  onPatch,
}: {
  home: InterestedHome;
  index: number;
  onRemove: () => void;
  onPatch: (patch: Partial<InterestedHome>) => void;
}) {
  const estimate = useMemo(
    () => compsEstimate({ sqft: home.sqft }, home.comps),
    [home.sqft, home.comps],
  );

  const [autoState, setAutoState] = useState<{
    loading: boolean;
    message: string | null;
    error: string | null;
  }>({ loading: false, message: null, error: null });

  // True once sample (illustrative) comps have been added to this home, so the
  // "not real sales" banner persists alongside the results (issue #127).
  const [sampleShown, setSampleShown] = useState(false);

  /**
   * DEMO path: generate ILLUSTRATIVE sample comps entirely client-side — no API
   * call, no Claude key. Every record is flagged `sample` and rendered behind a
   * prominent "Sample data — illustrative, not real sales" banner.
   */
  const findSampleComps = async () => {
    setAutoState({ loading: true, message: null, error: null });
    try {
      const subject = { label: home.label, sqft: home.sqft };
      const candidates = await SampleCompsDataSource.fetchRecentSales(subject);
      const found = rankComps(subject, candidates);
      if (found.length > 0) {
        onPatch({ comps: [...home.comps, ...found] });
        setSampleShown(true);
      }
      setAutoState({
        loading: false,
        message:
          found.length === 0
            ? "No sample comps could be generated for this home."
            : null,
        error: null,
      });
    } catch {
      setAutoState({
        loading: false,
        message: null,
        error: "Couldn't generate sample comps. Please try again.",
      });
    }
  };

  const findCompsWithAI = async () => {
    setAutoState({ loading: true, message: null, error: null });
    try {
      const res = await fetch("/api/comps/auto-find", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: { label: home.label, sqft: home.sqft },
        }),
      });

      if (res.status === 503) {
        // Not configured server-side — fall back to the Coming-soon experience.
        setAutoState({
          loading: false,
          message: null,
          error:
            "Auto-find isn't available yet — enter comps manually for now.",
        });
        return;
      }

      if (!res.ok) {
        setAutoState({
          loading: false,
          message: null,
          error: "Couldn't find comps right now. Please try again.",
        });
        return;
      }

      const data = (await res.json()) as { comps?: Comp[]; message?: string };
      const found = Array.isArray(data.comps) ? data.comps : [];
      if (found.length > 0) {
        onPatch({ comps: [...home.comps, ...found] });
      }
      setAutoState({
        loading: false,
        message:
          data.message ??
          (found.length === 0
            ? "No comparable sales found for this home."
            : null),
        error: null,
      });
    } catch {
      setAutoState({
        loading: false,
        message: null,
        error: "Couldn't reach the comps service. Please try again.",
      });
    }
  };

  const addComp = () => onPatch({ comps: [...home.comps, newComp()] });
  const removeComp = (id: string) =>
    onPatch({ comps: home.comps.filter((c) => c.id !== id) });
  const patchComp = (id: string, patch: Partial<Comp>) =>
    onPatch({
      comps: home.comps.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 p-5">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            {home.label.trim() || `Home ${index + 1}`}
          </h3>
          <div className="flex gap-2">
            <HomePicker
              label="Pick a home"
              onPick={(picked) =>
                onPatch({
                  label: picked.label,
                  // Prefill sqft from the picked listing when it carries one.
                  ...(picked.sqft ? { sqft: picked.sqft } : {}),
                })
              }
            />
            <button type="button" className="btn-secondary" onClick={onRemove}>
              Remove home
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Address / label
            </span>
            <input
              type="text"
              className="field mt-1"
              placeholder="The home you're considering"
              value={home.label}
              onChange={(e) => onPatch({ label: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Living area (sqft)
            </span>
            <input
              type="number"
              min={0}
              className="field mt-1"
              value={home.sqft || ""}
              onChange={(e) => onPatch({ sqft: Number(e.target.value) })}
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink-soft">
            How do you want to get comps?
          </legend>
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={home.mode === "manual"}
              onClick={() => onPatch({ mode: "manual" })}
            >
              Enter comps manually
            </ModeButton>
            <ModeButton
              active={home.mode === "auto"}
              disabled={!AUTO_MODE_OFFERED}
              onClick={() => onPatch({ mode: "auto" })}
            >
              {AI_COMPS_ENABLED
                ? "Auto-find comps with AI"
                : COMPS_DEMO_ENABLED
                  ? "Auto-find comps (sample data)"
                  : "Auto-find comps with AI"}
              {AUTO_MODE_OFFERED ? null : (
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-ink-soft">
                  Coming soon
                </span>
              )}
            </ModeButton>
          </div>
          {home.mode === "auto" ? (
            AI_COMPS_ENABLED ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={autoState.loading}
                    onClick={findCompsWithAI}
                  >
                    {autoState.loading ? "Finding comps…" : "Find comps"}
                  </button>
                  <span className="text-sm text-ink-soft">
                    We&apos;ll suggest comps from real recent sales. This is an{" "}
                    <strong>estimate, not an appraisal</strong>; you can edit
                    them.
                  </span>
                </div>
                {autoState.message ? (
                  <p className="text-sm text-ink-soft">{autoState.message}</p>
                ) : null}
                {autoState.error ? (
                  <p className="text-sm text-amber-700">{autoState.error}</p>
                ) : null}
              </div>
            ) : COMPS_DEMO_ENABLED ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={autoState.loading}
                    onClick={findSampleComps}
                  >
                    {autoState.loading
                      ? "Generating sample comps…"
                      : "Generate sample comps"}
                  </button>
                  <span className="text-sm text-ink-soft">
                    Demo mode adds <strong>illustrative sample comps</strong> so
                    you can try the flow. This is an{" "}
                    <strong>estimate, not an appraisal</strong>; you can edit
                    them.
                  </span>
                </div>
                <SampleDataBanner />
                {autoState.message ? (
                  <p className="text-sm text-ink-soft">{autoState.message}</p>
                ) : null}
                {autoState.error ? (
                  <p className="text-sm text-amber-700">{autoState.error}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">
                Coming soon — enter comps manually for now.
              </p>
            )
          ) : null}
        </fieldset>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Comparable sales</h4>
          <button type="button" className="btn-secondary" onClick={addComp}>
            Add a comp
          </button>
        </div>

        {sampleShown && home.comps.length > 0 ? <SampleDataBanner /> : null}

        {home.comps.length === 0 ? (
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
                      className="field mt-1"
                      placeholder="A recently sold comparable"
                      value={comp.label}
                      onChange={(e) =>
                        patchComp(comp.id, { label: e.target.value })
                      }
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
            Estimated fair-value range for{" "}
            {home.label.trim() || `Home ${index + 1}`}
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
              Enter this home&apos;s square footage to see a value range.
              Adjusted comps average {formatUSD(estimate.avgPricePerSqft ?? 0)}
              /sqft.
            </p>
          )}
        </section>
      ) : null}
    </section>
  );
}

/**
 * Prominent, persistent honesty banner for the demo path (issue #127): the
 * comps it produces are illustrative sample data, never real recorded sales.
 */
function SampleDataBanner() {
  return (
    <p
      role="note"
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
    >
      Sample data — illustrative, not real sales.
    </p>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-300 bg-white text-ink hover:border-brand-300"
      } ${disabled ? "cursor-not-allowed opacity-60 hover:border-slate-300" : ""}`}
    >
      {children}
    </button>
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
        className="field mt-1"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
