"use client";

import { CONTINGENCIES, type ContingencyId } from "@/lib/offer/contingencies";
import type { ContingencySelection } from "@/lib/offer/types";

/**
 * Contingencies explainer & selection step (issue #13).
 *
 * Each of the five contingencies is explained — what it protects, its typical
 * window, and the risk of waiving — and the buyer toggles include/exclude and
 * sets the window. UPL guardrail (#17): we LABEL the risk of waiving but never
 * advise WHETHER to waive.
 */
export function ContingenciesStep({
  contingencies,
  onChange,
  hydrated,
}: {
  contingencies: Record<ContingencyId, ContingencySelection>;
  onChange: (id: ContingencyId, patch: Partial<ContingencySelection>) => void;
  hydrated: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Contingencies are conditions that let you exit and recover your earnest
        money if something goes wrong. We explain what each protects and the
        trade-off of leaving it out — the choice is yours to make with your
        attorney.
      </p>

      <div className="space-y-4">
        {CONTINGENCIES.map((c) => {
          const sel = contingencies[c.id];
          const included = sel?.included ?? false;
          return (
            <div key={c.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-ink">{c.label}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{c.protects}</p>
                </div>
                <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={hydrated ? included : false}
                    onChange={(e) => onChange(c.id, { included: e.target.checked })}
                    aria-label={`Include ${c.label}`}
                    suppressHydrationWarning
                  />
                  Include
                </label>
              </div>

              <p className="text-xs text-ink-muted">{c.typicalWindow}</p>

              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <span className="font-semibold">If you waive it: </span>
                {c.riskOfWaiving}
              </p>

              {included ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-ink-soft">Window</span>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5"
                    value={hydrated ? sel.days : 0}
                    onChange={(e) => onChange(c.id, { days: Number(e.target.value) })}
                    aria-label={`${c.label} window in days`}
                    suppressHydrationWarning
                  />
                  <span className="text-ink-muted">days from acceptance</span>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
