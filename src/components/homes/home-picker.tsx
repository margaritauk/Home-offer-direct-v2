"use client";

import { useMemo, useState } from "react";
import { useMyHomes } from "@/hooks/use-my-homes";
import { screenText } from "@/lib/ai/screening";
import { formatUSD } from "@/lib/savings";
import { ListingImage } from "@/components/listing-image";
import { LocationSearchBox } from "@/components/search/location-search-box";
import { propertyTypeLabels } from "@/lib/listings/types";
import type { HomeSource, MyHome } from "@/lib/homes/my-homes";

/**
 * Reusable "add a home" picker (issue #112; redesigned for UX continuity Item 1
 * phase-1 / S0a).
 *
 * The "Home search" source now renders a PHOTO + FACTS mini-browser (reusing
 * {@link ListingImage} + the `ListingCard` fact line) instead of a text-only
 * list, so the buyer recognizes the home they're adding. On pick it returns the
 * whole {@link MyHome} (listingId + price/beds/baths/sqft) — the host stores the
 * snapshot, the link is no longer discarded.
 *
 * The manual-entry fallback stays, but its address now resolves through the
 * shared {@link LocationSearchBox} (Item 4) so a manually-added home carries
 * structured city/state/zip. The free text is still run through
 * {@link screenText}.
 *
 * GUARDRAIL (FHA): only address/transaction facts are surfaced or collected;
 * the manual free text is screened so a protected-class signal can never enter a
 * tool's persisted state via the picker. Location resolution is geography only.
 */

const SOURCE_TABS: HomeSource[] = [
  "Home search",
  "Your showings",
  "Tour scorecard",
];

function FactLine({ home }: { home: MyHome }) {
  const facts: string[] = [];
  if (typeof home.beds === "number") facts.push(`${home.beds} bd`);
  if (typeof home.baths === "number") facts.push(`${home.baths} ba`);
  if (typeof home.sqft === "number")
    facts.push(`${home.sqft.toLocaleString()} sqft`);
  if (home.propertyType) facts.push(propertyTypeLabels[home.propertyType]);
  if (facts.length === 0) return null;
  return <span className="text-xs text-ink-soft">{facts.join(" · ")}</span>;
}

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

  /** Manual add: screen the label, build a MyHome from the resolved place. */
  const addManual = (label: string, city?: string, state?: string) => {
    const screened = screenText(label).text.trim();
    if (!screened) return;
    pick({
      key: `manual:${screened.toLowerCase()}`,
      label: screened,
      address: screened,
      city,
      state,
      source: "Home search",
    });
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
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {filtered.map((home) => (
            <li key={home.key}>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left hover:border-brand-300"
                onClick={() => pick(home)}
              >
                {home.listingId ? (
                  <ListingImage
                    id={home.listingId}
                    propertyType={home.propertyType ?? "single-family"}
                    className="h-14 w-20 shrink-0 rounded-md"
                  />
                ) : (
                  <span
                    className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-lg"
                    aria-hidden
                  >
                    🏠
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  {typeof home.price === "number" ? (
                    <span className="block text-sm font-bold text-ink">
                      {formatUSD(home.price)}
                    </span>
                  ) : null}
                  <span className="block truncate text-sm font-medium text-ink">
                    {home.label}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {[home.city, home.state].filter(Boolean).join(", ")}
                    {home.city || home.state ? " · " : ""}
                    {home.source}
                  </span>
                  <FactLine home={home} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-ink-soft">
          Or add a home by address
        </p>
        <LocationSearchBox
          label="Home address or city"
          placeholder="123 Maple St, or a ZIP / city"
          onResolve={(value, label) =>
            addManual(label, value.city, value.state)
          }
        />
      </div>
    </div>
  );
}
