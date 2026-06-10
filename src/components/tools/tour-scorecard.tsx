"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { HomePicker } from "@/components/homes/home-picker";
import { screenText } from "@/lib/ai/screening";
import {
  DEFAULT_CRITERIA,
  rankHomes,
  type ScoredHome,
} from "@/lib/tools/tour-scorecard";
import { ToolDisclaimer } from "./tool-disclaimer";

interface ScorecardState {
  homes: ScoredHome[];
}

const INITIAL: ScorecardState = { homes: [] };

function newHome(): ScoredHome {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `home-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "",
    ratings: {},
    notes: "",
  };
}

const RATINGS = [1, 2, 3, 4, 5];

export function TourScorecard() {
  const { value, hydrated, save, reset } = useStageTool<ScorecardState>(
    "tour-scorecard",
    INITIAL,
  );

  const ranked = useMemo(
    () => rankHomes(value.homes, DEFAULT_CRITERIA),
    [value.homes],
  );

  const addHome = () =>
    save((prev) => ({ homes: [...prev.homes, newHome()] }));

  /** Add a home prefilled with a picked label (from search / showings). */
  const addHomeWithLabel = (label: string) =>
    save((prev) => ({ homes: [...prev.homes, { ...newHome(), label }] }));

  const removeHome = (id: string) =>
    save((prev) => ({ homes: prev.homes.filter((h) => h.id !== id) }));

  const patchHome = (id: string, patch: Partial<ScoredHome>) =>
    save((prev) => ({
      homes: prev.homes.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

  const setRating = (id: string, criterionId: string, rating: number) =>
    save((prev) => ({
      homes: prev.homes.map((h) =>
        h.id === id ? { ...h, ratings: { ...h.ratings, [criterionId]: rating } } : h,
      ),
    }));

  if (!hydrated) {
    return <p className="text-sm text-ink-muted">Loading your scorecard…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Score each home on the same rubric, then compare the weighted totals.
        </p>
        <div className="flex flex-wrap gap-2">
          <HomePicker
            label="Add from search / showings"
            onPick={(home) => addHomeWithLabel(home.label)}
          />
          <button type="button" className="btn-primary" onClick={addHome}>
            Add a home
          </button>
          {value.homes.length > 0 ? (
            <button type="button" className="btn-secondary" onClick={reset}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      {value.homes.length === 0 ? (
        <div className="card text-center text-sm text-ink-soft">
          No homes yet. Add a home you toured to start scoring it.
        </div>
      ) : (
        <div className="space-y-6">
          {value.homes.map((home) => (
            <HomeCard
              key={home.id}
              home={home}
              onLabel={(label) => patchHome(home.id, { label })}
              onRating={(c, r) => setRating(home.id, c, r)}
              onNotes={(notes) => patchHome(home.id, { notes })}
              onRemove={() => removeHome(home.id)}
            />
          ))}
        </div>
      )}

      {ranked.some((h) => h.score.ratedCount > 0) ? (
        <section aria-label="Ranked homes" className="card">
          <h2 className="text-lg font-semibold">Ranked by weighted score</h2>
          <ol className="mt-4 space-y-2">
            {ranked
              .filter((h) => h.score.ratedCount > 0)
              .map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-semibold text-brand-700">#{h.rank}</span>
                    <span className="font-medium text-ink">
                      {h.label || "Untitled home"}
                    </span>
                  </span>
                  <span className="font-semibold text-ink">
                    {h.score.weighted.toFixed(1)} / 5
                  </span>
                </li>
              ))}
          </ol>
        </section>
      ) : null}

      <ToolDisclaimer>
        A scoring aid, not advice. Rate only property and transaction facts —
        keep notes factual. Free-text notes are screened to keep out
        protected-class details under fair-housing rules.
      </ToolDisclaimer>
    </div>
  );
}

function HomeCard({
  home,
  onLabel,
  onRating,
  onNotes,
  onRemove,
}: {
  home: ScoredHome;
  onLabel: (label: string) => void;
  onRating: (criterionId: string, rating: number) => void;
  onNotes: (notes: string) => void;
  onRemove: () => void;
}) {
  // Local note state so screening runs on blur (not every keystroke).
  const [note, setNote] = useState(home.notes ?? "");

  const commitNote = () => {
    const screened = screenText(note).text;
    if (screened !== note) setNote(screened);
    onNotes(screened);
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-ink-soft">Home / address</span>
          <input
            type="text"
            className="field mt-1"
            placeholder="123 Maple St"
            value={home.label}
            onChange={(e) => onLabel(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary mt-6 shrink-0"
          onClick={onRemove}
          aria-label={`Remove ${home.label || "home"}`}
        >
          Remove
        </button>
      </div>

      <div className="space-y-3">
        {DEFAULT_CRITERIA.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">
              <span className="font-medium text-ink">{c.label}</span>
              {c.hint ? (
                <span className="ml-2 text-xs text-ink-muted">{c.hint}</span>
              ) : null}
            </span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label={`${c.label} rating`}
            >
              {RATINGS.map((r) => {
                const active = (home.ratings[c.id] ?? 0) === r;
                const inputId = `rating-${home.id}-${c.id}-${r}`;
                return (
                  <span key={r}>
                    <input
                      type="radio"
                      id={inputId}
                      name={`rating-${home.id}-${c.id}`}
                      value={r}
                      checked={active}
                      aria-label={`${c.label} — ${r}`}
                      onChange={() => onRating(c.id, r)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={inputId}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-ink transition hover:border-brand-300 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1"
                    >
                      {r}
                    </label>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Notes (facts only)</span>
        <textarea
          className="field mt-1"
          rows={2}
          placeholder="Roof recently replaced; busy street; small kitchen…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
        />
      </label>
    </div>
  );
}
