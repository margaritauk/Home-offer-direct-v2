"use client";

import { LocationSearchBox } from "@/components/search/location-search-box";

export type LocationMode = "current" | "zip" | "city" | "state";

/**
 * The location-relevant slice of the listing filter model (issue #176). Exactly
 * one mode is "active"; the fields for the other modes are cleared so the filter
 * sent to RentCast is unambiguous.
 */
export interface LocationValue {
  mode: LocationMode;
  state?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

/** Radius choices (miles) for a coordinate-anchored search. */
export const RADIUS_OPTIONS = [1, 5, 10, 25] as const;
export const DEFAULT_RADIUS = 10;

/** A human summary of the currently-active location for the "current" chip. */
function summarize(value: LocationValue): string | null {
  if (value.lat != null && value.lng != null) {
    if (value.city) return value.state ? `${value.city}, ${value.state}` : value.city;
    if (value.zip) return `ZIP ${value.zip}`;
    return "Pinned location";
  }
  if (value.zip) return `ZIP ${value.zip}`;
  if (value.city) return value.state ? `${value.city}, ${value.state}` : value.city;
  if (value.state) return value.state;
  return null;
}

/**
 * Location entry for home search (UX continuity, Item 4 / S0b). The old
 * segmented zip/city/state tablist is replaced by the shared S0a
 * {@link LocationSearchBox} — one accessible combobox that resolves a picked
 * place (or "use my current location") into the SAME {@link LocationValue} slice
 * the search/distance code already consumes. The radius selector still appears
 * whenever the active search is coordinate-anchored (lat/lng present), so the
 * near-me distance sort behaves exactly as before.
 *
 * FHA: geography only — the box surfaces zip/address/city/state/county kinds and
 * never a neighborhood typeahead.
 */
export function LocationSelector({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const hasCoords = value.lat != null && value.lng != null;
  const active = summarize(value);

  return (
    <div className="space-y-3">
      <LocationSearchBox
        label="Where do you want to search?"
        placeholder="ZIP, address, city, state, or county"
        onResolve={(next) => onChange(next)}
      />

      {active ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
            <span aria-hidden>📍</span>
            {active}
          </span>
          <button
            type="button"
            onClick={() => onChange({ mode: value.mode })}
            className="text-ink-muted underline hover:text-ink"
          >
            Clear
          </button>
        </div>
      ) : null}

      {hasCoords ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Within
          </span>
          <div
            role="radiogroup"
            aria-label="Search radius (miles)"
            className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
          >
            {RADIUS_OPTIONS.map((r) => {
              const selected = (value.radius ?? DEFAULT_RADIUS) === r;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ ...value, radius: r })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                    selected
                      ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {r} mi
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
