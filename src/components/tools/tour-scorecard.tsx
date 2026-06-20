"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { HomePicker } from "@/components/homes/home-picker";
import { HomeScoreCard } from "@/components/homes/home-score-card";
import { homeFromPick, type ScorecardState } from "@/hooks/use-scorecard";
import type { MyHome } from "@/lib/homes/my-homes";
import {
  DEFAULT_CRITERIA,
  rankHomes,
  sortScoredHomes,
  type ScorecardSort,
  type ScoredHome,
  type TourPhoto,
} from "@/lib/tools/tour-scorecard";
import { ToolDisclaimer } from "./tool-disclaimer";

const INITIAL: ScorecardState = { homes: [] };

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `home-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newHome(): ScoredHome {
  return {
    id: newId(),
    label: "",
    ratings: {},
    notes: "",
    addedAt: new Date().toISOString(),
  };
}

export function TourScorecard() {
  const { value, hydrated, save, reset } = useStageTool<ScorecardState>(
    "tour-scorecard",
    INITIAL,
  );
  const [sort, setSort] = useState<ScorecardSort>("score");

  const ranked = useMemo(
    () => rankHomes(value.homes, DEFAULT_CRITERIA),
    [value.homes],
  );
  // Cards render sorted (default by weighted score; alt: recently added).
  const sortedHomes = useMemo(
    () => sortScoredHomes(value.homes, DEFAULT_CRITERIA, sort),
    [value.homes, sort],
  );
  // Map id → 1-based rank so a card can show its #rank under "By score".
  const rankById = useMemo(() => {
    const m = new Map<string, number>();
    ranked.forEach((h) => m.set(h.id, h.rank));
    return m;
  }, [ranked]);

  const addHome = () =>
    save((prev) => ({ homes: [...prev.homes, newHome()] }));

  /** Add a home from the picker, carrying its listingId + snapshot + addedAt. */
  const addHomeFromPick = (home: MyHome) =>
    save((prev) => ({ homes: [...prev.homes, homeFromPick(home)] }));

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

  const setTourPhotos = (id: string, photos: TourPhoto[]) =>
    patchHome(id, { tourPhotos: photos });

  if (!hydrated) {
    return <p className="text-sm text-ink-muted">Loading your scorecard…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Score each home on the same rubric, then compare the weighted totals.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {value.homes.length > 1 ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-ink-soft">Sort</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                value={sort}
                onChange={(e) => setSort(e.target.value as ScorecardSort)}
                aria-label="Sort homes"
              >
                <option value="score">By score</option>
                <option value="recent">Recently added</option>
              </select>
            </label>
          ) : null}
          <HomePicker
            label="Add from search / showings"
            onPick={addHomeFromPick}
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
          No homes yet. Add one from your search, your showings, or by address.
        </div>
      ) : (
        <div className="space-y-6" aria-live="polite">
          {sortedHomes.map((home) => (
            <div key={home.id} className="space-y-2">
              {sort === "score" && rankById.get(home.id) ? (
                <p className="text-xs font-semibold text-brand-700">
                  #{rankById.get(home.id)}
                </p>
              ) : null}
              <HomeScoreCard
                home={home}
                onLabel={(label) => patchHome(home.id, { label })}
                onRating={(c, r) => setRating(home.id, c, r)}
                onNotes={(notes) => patchHome(home.id, { notes })}
                onTourPhotos={(photos) => setTourPhotos(home.id, photos)}
                onRemove={() => removeHome(home.id)}
              />
            </div>
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
                      {h.snapshot?.address || h.label || "Untitled home"}
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
        keep notes factual. Free-text notes and photo captions are screened to
        keep out protected-class details under fair-housing rules.
      </ToolDisclaimer>
    </div>
  );
}
