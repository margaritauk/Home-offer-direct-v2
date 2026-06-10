"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { useMyHomes } from "@/hooks/use-my-homes";
import { getListingById } from "@/lib/listings";
import { formatUSD } from "@/lib/savings";
import {
  buildComparison,
  type ComparableHome,
} from "@/lib/tools/compare-homes";
import { rankHomes, type ScoredHome } from "@/lib/tools/tour-scorecard";
import { DEFAULT_CRITERIA } from "@/lib/tools/tour-scorecard";
import { ToolDisclaimer } from "./tool-disclaimer";

interface CompareState {
  /** Selected source ids, in pick order. */
  selectedIds: string[];
}

const INITIAL: CompareState = { selectedIds: [] };
const MAX_HOMES = 4;

/** A pickable home from listings, showings, or the tour scorecard. */
interface SourceHome {
  id: string;
  label: string;
  location?: string;
  price?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  daysOnMarket?: number;
  source: string;
}

function formatValue(metric: string, v: number | null): string {
  if (v === null) return "—";
  if (metric === "price") return formatUSD(v);
  if (metric === "pricePerSqft") return `${formatUSD(v)}`;
  if (metric === "sqft") return v.toLocaleString();
  if (metric === "tourScore") return `${v.toFixed(1)} / 5`;
  if (metric === "daysOnMarket") return `${v} days`;
  return String(v);
}

export function CompareHomes() {
  const { value, hydrated, save, reset } = useStageTool<CompareState>(
    "compare-homes",
    INITIAL,
  );
  // All candidate homes (listings + showings + scorecard), deduped (#112).
  const { homes: myHomes, hydrated: homesHydrated } = useMyHomes();
  // Tour scores live in the #94 tool's storage; read them to enrich the table.
  const { value: scorecard } = useStageTool<{ homes: ScoredHome[] }>(
    "tour-scorecard",
    { homes: [] },
  );

  const tourScoreByLabel = useMemo(() => {
    const ranked = rankHomes(scorecard.homes, DEFAULT_CRITERIA);
    const map = new Map<string, number>();
    for (const h of ranked) {
      const key = h.label.trim().toLowerCase();
      if (key && h.score.ratedCount > 0) map.set(key, h.score.weighted);
    }
    return map;
  }, [scorecard.homes]);

  // Build the pickable set from the deduped aggregate (#112): listings,
  // showings, AND tour-scorecard homes. Listing-backed homes are enriched with
  // full listing facts (price/beds/baths/days) for the comparison table.
  const sources = useMemo<SourceHome[]>(
    () =>
      myHomes.map((home) => {
        const listing = home.listingId ? getListingById(home.listingId) : undefined;
        const location =
          home.city || home.state
            ? [home.city, home.state].filter(Boolean).join(", ")
            : undefined;
        return {
          id: home.key,
          label: home.label,
          location,
          price: listing?.price,
          sqft: listing?.sqft ?? home.sqft,
          beds: listing?.beds,
          baths: listing?.baths,
          daysOnMarket: listing?.daysOnMarket,
          source: home.source,
        };
      }),
    [myHomes],
  );

  const selected = useMemo<ComparableHome[]>(() => {
    const byId = new Map(sources.map((s) => [s.id, s]));
    return value.selectedIds
      .map((id) => byId.get(id))
      .filter((s): s is SourceHome => Boolean(s))
      .map((s) => {
        const tourScore = tourScoreByLabel.get(s.label.trim().toLowerCase());
        return {
          id: s.id,
          label: s.label,
          location: s.location,
          price: s.price,
          sqft: s.sqft,
          beds: s.beds,
          baths: s.baths,
          daysOnMarket: s.daysOnMarket,
          ...(tourScore !== undefined ? { tourScore } : {}),
        };
      });
  }, [sources, value.selectedIds, tourScoreByLabel]);

  const { rows } = useMemo(() => buildComparison(selected), [selected]);

  const toggle = (id: string) =>
    save((prev) => {
      if (prev.selectedIds.includes(id)) {
        return { selectedIds: prev.selectedIds.filter((x) => x !== id) };
      }
      if (prev.selectedIds.length >= MAX_HOMES) return prev;
      return { selectedIds: [...prev.selectedIds, id] };
    });

  if (!hydrated || !homesHydrated) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <section aria-label="Pick homes" className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Pick 2–{MAX_HOMES} homes ({value.selectedIds.length} selected)
          </h2>
          {value.selectedIds.length > 0 ? (
            <button type="button" className="btn-secondary" onClick={reset}>
              Clear
            </button>
          ) : null}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {sources.map((s) => {
            const checked = value.selectedIds.includes(s.id);
            const atLimit = !checked && value.selectedIds.length >= MAX_HOMES;
            return (
              <li key={s.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                    checked ? "border-brand-500 bg-brand-50" : "border-slate-200"
                  } ${atLimit ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={checked}
                    disabled={atLimit}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{s.label}</span>
                    <span className="block text-xs text-ink-muted">
                      {s.location} · {s.source}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {selected.length >= 2 ? (
        <section aria-label="Comparison" className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 p-3 text-left font-semibold">
                  Fact
                </th>
                {selected.map((h) => (
                  <th
                    key={h.id}
                    className="border-b border-slate-200 p-3 text-left font-semibold"
                  >
                    {h.label}
                    {h.location ? (
                      <span className="block text-xs font-normal text-ink-muted">
                        {h.location}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metric}>
                  <th className="border-b border-slate-100 p-3 text-left font-medium text-ink-soft">
                    {row.label}
                  </th>
                  {row.values.map((v, i) => {
                    const best = row.bestIndexes.includes(i);
                    return (
                      <td
                        key={selected[i].id}
                        className={`border-b border-slate-100 p-3 ${
                          best ? "font-semibold text-brand-700" : "text-ink"
                        }`}
                      >
                        {formatValue(row.metric, v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-sm text-ink-soft">
          Select at least two homes to see the side-by-side comparison.
        </p>
      )}

      <ToolDisclaimer>
        Facts only — this compares numbers you can verify and your own tour
        scores. It does <strong>not</strong> rank neighborhoods or steer you
        toward or away from any area. Highlights mark the best number per row,
        not the &ldquo;right&rdquo; home for you.
      </ToolDisclaimer>
    </div>
  );
}
