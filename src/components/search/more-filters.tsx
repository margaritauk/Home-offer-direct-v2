"use client";

import { useId, useState } from "react";
import {
  propertyTypeLabels,
  type PropertyType,
} from "@/lib/listings";
import { ValidatedNumberField } from "@/components/tools/validated-field";

const ALL_TYPES = Object.keys(propertyTypeLabels) as PropertyType[];

/**
 * The home-facts filter set (issue #178 — Search P1-3): sqft min/max, year-built
 * min/max, max days on market, max beds, and a multi-select property type. This
 * is the controlled "More filters" panel — collapsible on desktop, an always-open
 * section in the mobile filter area (the host decides which via `collapsible`).
 *
 * Every value is lifted to the host so the chips, the async fetch, and Clear-all
 * stay the single source of truth; this component only renders + emits changes.
 */
export interface MoreFiltersValue {
  minSqft: number;
  maxSqft: number;
  minYearBuilt: number;
  maxYearBuilt: number;
  maxDaysOnMarket: number;
  maxBeds: number;
  propertyTypes: PropertyType[];
}

export const EMPTY_MORE_FILTERS: MoreFiltersValue = {
  minSqft: 0,
  maxSqft: 0,
  minYearBuilt: 0,
  maxYearBuilt: 0,
  maxDaysOnMarket: 0,
  maxBeds: 0,
  propertyTypes: [],
};

/** How many of the panel's filters are currently active (non-empty). */
export function moreFiltersActiveCount(v: MoreFiltersValue): number {
  return (
    (v.minSqft ? 1 : 0) +
    (v.maxSqft ? 1 : 0) +
    (v.minYearBuilt ? 1 : 0) +
    (v.maxYearBuilt ? 1 : 0) +
    (v.maxDaysOnMarket ? 1 : 0) +
    (v.maxBeds ? 1 : 0) +
    (v.propertyTypes.length > 0 ? 1 : 0)
  );
}

export function MoreFilters({
  value,
  onChange,
  collapsible = true,
}: {
  value: MoreFiltersValue;
  onChange: (next: MoreFiltersValue) => void;
  /** When true (desktop), render a toggleable disclosure; else an open section. */
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const panelId = useId();
  const set = <K extends keyof MoreFiltersValue>(
    key: K,
    next: MoreFiltersValue[K],
  ) => onChange({ ...value, [key]: next });

  const toggleType = (t: PropertyType) => {
    const has = value.propertyTypes.includes(t);
    set(
      "propertyTypes",
      has
        ? value.propertyTypes.filter((x) => x !== t)
        : [...value.propertyTypes, t],
    );
  };

  const activeCount = moreFiltersActiveCount(value);

  const body = (
    <div id={panelId} className="grid gap-4 sm:grid-cols-2">
      <ValidatedNumberField
        label="Min sqft"
        value={value.minSqft}
        onChange={(n) => set("minSqft", n)}
        bounds={{ min: 0 }}
        unit="sqft"
      />
      <ValidatedNumberField
        label="Max sqft"
        value={value.maxSqft}
        onChange={(n) => set("maxSqft", n)}
        bounds={{ min: 0 }}
        unit="sqft"
      />
      <ValidatedNumberField
        label="Min year built"
        value={value.minYearBuilt}
        onChange={(n) => set("minYearBuilt", n)}
        bounds={{ min: 1800, max: 2100 }}
      />
      <ValidatedNumberField
        label="Max year built"
        value={value.maxYearBuilt}
        onChange={(n) => set("maxYearBuilt", n)}
        bounds={{ min: 1800, max: 2100 }}
      />
      <ValidatedNumberField
        label="Max days on market"
        value={value.maxDaysOnMarket}
        onChange={(n) => set("maxDaysOnMarket", n)}
        bounds={{ min: 0 }}
        unit="days"
      />
      <ValidatedNumberField
        label="Max beds"
        value={value.maxBeds}
        onChange={(n) => set("maxBeds", n)}
        bounds={{ min: 0 }}
      />

      <fieldset className="sm:col-span-2">
        <legend className="mb-1 block text-sm font-medium text-ink-soft">
          Property type
        </legend>
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map((t) => {
            const selected = value.propertyTypes.includes(t);
            return (
              <label
                key={t}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-1 ${
                  selected
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-300 bg-white text-ink hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected}
                  onChange={() => toggleType(t)}
                  aria-label={propertyTypeLabels[t]}
                />
                <span aria-hidden="true">{selected ? "✓" : "+"}</span>
                {propertyTypeLabels[t]}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <span className="block text-sm font-medium text-ink-soft">
          More filters
        </span>
        {body}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn-secondary w-full justify-between sm:w-auto"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          More filters
          {activeCount > 0 ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open ? body : null}
    </div>
  );
}
