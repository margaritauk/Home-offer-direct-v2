"use client";

import { useMemo, useState } from "react";
import { useMyHomes } from "@/hooks/use-my-homes";
import { screenText } from "@/lib/ai/screening";
import type { HomeSource, MyHome } from "@/lib/homes/my-homes";

/**
 * Reusable "add a home" picker (issue #112).
 *
 * Lets the buyer pick a home they already have in the app — from home search
 * (listings), their tracked showings, or the tour scorecard — with a source
 * filter + a search box, plus a manual-entry fallback for a home that isn't in
 * any source yet. Calls back `onPick(home)` with a {@link MyHome}; the host tool
 * decides what to do with it (prefill a label, add a row, set a property field).
 *
 * GUARDRAIL (FHA, #112): only address/transaction facts are surfaced or
 * collected. The manual-entry free text is run through {@link screenText} so a
 * protected-class signal can never enter a tool's persisted state via the
 * picker.
 */

const SOURCE_TABS: HomeSource[] = [
  "Home search",
  "Your showings",
  "Tour scorecard",
];

export function HomePicker({
  onPick,
  label = "Pick a home",
}: {
  onPick: (home: MyHome) => void;
  /** Button text; defaults to "Pick a home". */
  label?: string;
}) {
  const { homes, hydrated } = useMyHomes();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<HomeSource>("Home search");
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return homes.filter((h) => {
      if (h.source !== source) return false;
      if (!q) return true;
      const hay = `${h.label} ${h.city ?? ""} ${h.state ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [homes, source, query]);

  const pick = (home: MyHome) => {
    onPick(home);
    setOpen(false);
    setQuery("");
  };

  const addManual = () => {
    const screened = screenText(manual).text.trim();
    if (!screened) return;
    pick({
      key: `manual:${screened.toLowerCase()}`,
      label: screened,
      address: screened,
      source: "Home search",
    });
    setManual("");
  };

  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Add a home</h3>
        <button
          type="button"
          className="text-sm text-ink-muted hover:text-ink"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Home source">
        {SOURCE_TABS.map((tab) => {
          const active = tab === source;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-ink hover:border-brand-300"
              }`}
              onClick={() => setSource(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="sr-only">Search homes</span>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search by address or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!hydrated ? (
        <p className="text-sm text-ink-muted">Loading your homes…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No homes from {source.toLowerCase()} match. Try another source or add
          one manually below.
        </p>
      ) : (
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {filtered.map((home) => (
            <li key={home.key}>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-300"
                onClick={() => pick(home)}
              >
                <span className="block truncate font-medium text-ink">
                  {home.label}
                </span>
                <span className="block text-xs text-ink-muted">
                  {[home.city, home.state].filter(Boolean).join(", ")}
                  {home.city || home.state ? " · " : ""}
                  {home.source}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-200 pt-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            Or enter an address manually
          </span>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="123 Maple St"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManual();
                }
              }}
            />
            <button
              type="button"
              className="btn-primary shrink-0"
              onClick={addManual}
              disabled={!manual.trim()}
            >
              Add
            </button>
          </div>
        </label>
      </div>
    </div>
  );
}
