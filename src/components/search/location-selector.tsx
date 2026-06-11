"use client";

import { useEffect } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getStateOptions } from "@/lib/states";

const stateOptions = getStateOptions();

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

/** Radius choices (miles) for the "current location" mode. */
export const RADIUS_OPTIONS = [1, 5, 10, 25] as const;
export const DEFAULT_RADIUS = 10;

const MODES: { id: LocationMode; label: string }[] = [
  { id: "current", label: "Current location" },
  { id: "zip", label: "ZIP" },
  { id: "city", label: "City" },
  { id: "state", label: "State" },
];

export function LocationSelector({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const geo = useGeolocation();

  // Switching modes preserves only the new mode's fields, clearing the rest so
  // the geographic query is never ambiguous (e.g. ZIP wins over lat/lng).
  const setMode = (mode: LocationMode) => {
    if (mode === value.mode) return;
    if (mode === "current") {
      onChange({ mode, radius: value.radius ?? DEFAULT_RADIUS });
    } else {
      onChange({ mode });
    }
  };

  const useMyLocation = () => {
    geo.request();
  };

  // Geolocation resolved → fold coords into the value (keep radius). Done in an
  // effect so onChange isn't called during render.
  useEffect(() => {
    if (
      value.mode === "current" &&
      geo.status === "granted" &&
      geo.coords &&
      (value.lat !== geo.coords.lat || value.lng !== geo.coords.lng)
    ) {
      onChange({
        mode: "current",
        lat: geo.coords.lat,
        lng: geo.coords.lng,
        radius: value.radius ?? DEFAULT_RADIUS,
      });
    }
  }, [geo.status, geo.coords, value, onChange]);

  const hasCoords = value.lat != null && value.lng != null;
  const fallbackMessage =
    geo.status === "denied" || geo.status === "insecure" || geo.status === "unsupported"
      ? geo.error
      : null;

  const loading = geo.status === "loading";

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Location search mode"
        className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        {MODES.map((m) => {
          const active = value.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                active
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {value.mode === "current" ? (
        <div className="space-y-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={useMyLocation}
            disabled={loading}
          >
            {loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
                aria-hidden
              />
            ) : (
              <span aria-hidden>📍</span>
            )}
            {loading
              ? "Locating…"
              : hasCoords
                ? "Update my location"
                : "Use my location"}
          </button>

          {fallbackMessage ? (
            <p className="text-sm text-red-600" role="status">
              {fallbackMessage}
            </p>
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
      ) : null}

      {value.mode === "zip" ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">ZIP code</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={value.zip ?? ""}
            onChange={(e) => {
              const zip = e.target.value.replace(/\D/g, "").slice(0, 5);
              onChange({ mode: "zip", zip: zip || undefined });
            }}
            placeholder="e.g. 78704"
            className="field bg-white"
            aria-label="ZIP code"
          />
        </label>
      ) : null}

      {value.mode === "city" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">City</span>
            <input
              type="text"
              value={value.city ?? ""}
              onChange={(e) =>
                onChange({
                  mode: "city",
                  city: e.target.value || undefined,
                  state: value.state,
                })
              }
              placeholder="e.g. Austin"
              className="field bg-white"
              aria-label="City"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">
              State <span className="font-normal text-ink-muted">(optional)</span>
            </span>
            <select
              className="field bg-white"
              value={value.state ?? ""}
              onChange={(e) =>
                onChange({
                  mode: "city",
                  city: value.city,
                  state: e.target.value || undefined,
                })
              }
              aria-label="State (optional)"
            >
              <option value="">Any state</option>
              {stateOptions.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {value.mode === "state" ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">State</span>
          <select
            className="field bg-white"
            value={value.state ?? ""}
            onChange={(e) =>
              onChange({ mode: "state", state: e.target.value || undefined })
            }
            aria-label="State"
            suppressHydrationWarning
          >
            <option value="">All states</option>
            {stateOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
