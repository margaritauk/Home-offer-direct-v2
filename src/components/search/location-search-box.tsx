"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  suggestionToLocationValue,
  type GeocodeKind,
  type GeocodeSuggestion,
} from "@/lib/geocode";
import type { LocationValue } from "@/components/search/location-selector";
import { DEFAULT_RADIUS } from "@/components/search/location-selector";

/**
 * Shared accessible place-search box (UX continuity, Item 4 / S0a).
 *
 * One WAI-ARIA combobox + listbox that replaces segmented mode-switch location
 * inputs: a single debounced typeahead returns mixed-kind suggestions
 * (zip · address · city · state · county — geography only, FHA), each tagged
 * with its kind. Picking one resolves into the existing {@link LocationValue}
 * slice via the pure {@link suggestionToLocationValue}. A "📍 Use my current
 * location" button reuses {@link useGeolocation}. Degrades gracefully to free
 * text (Enter commits the raw query as a city search) when there are no
 * suggestions or the geocoder is unreachable.
 *
 * A11y: `role="combobox"` + `aria-expanded`/`aria-controls`/
 * `aria-activedescendant`; listbox `role="option"`s; Up/Down/Enter/Escape;
 * `aria-live` result-count status; ≥44px targets.
 */

const KIND_LABELS: Record<GeocodeKind, string> = {
  zip: "ZIP",
  address: "Address",
  city: "City",
  state: "State",
  county: "County",
};

export function LocationSearchBox({
  onResolve,
  label = "Search a place",
  placeholder = "ZIP, address, city, state, or county",
  showCurrentLocation = true,
}: {
  /**
   * Called with the resolved location slice when the buyer picks a place. The
   * second arg is the human display label of the pick (the suggestion label, or
   * the raw free text) — handy for callers that store a home label.
   */
  onResolve: (value: LocationValue, label: string) => void;
  label?: string;
  placeholder?: string;
  showCurrentLocation?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const listboxId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const geo = useGeolocation();

  // Debounced fetch against the server geocode route. The route never 500s, so a
  // failure simply yields no suggestions (free-text fallback stays usable).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { suggestions?: GeocodeSuggestion[] };
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setActiveIndex(-1);
      } catch {
        // Aborted or network error → degrade to free text.
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  // Fold resolved geolocation coords into the slice (effect, not during render).
  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      onResolve(
        {
          mode: "current",
          lat: geo.coords.lat,
          lng: geo.coords.lng,
          radius: DEFAULT_RADIUS,
        },
        "Current location",
      );
      setOpen(false);
    }
    // onResolve identity is the caller's responsibility; we only react to coords.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.coords]);

  const pick = (suggestion: GeocodeSuggestion) => {
    onResolve(suggestionToLocationValue(suggestion), suggestion.label);
    setQuery(suggestion.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  /** Free-text fallback: commit the raw query as a city search. */
  const commitFreeText = () => {
    const q = query.trim();
    if (!q) return;
    onResolve({ mode: "city", city: q }, q);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        pick(suggestions[activeIndex]);
      } else {
        commitFreeText();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showList = open && suggestions.length > 0;
  const activeId =
    showList && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  const statusText = loading
    ? "Searching…"
    : query.trim().length >= 2
      ? suggestions.length === 0
        ? "No matches — press Enter to search this text, or try a ZIP or city."
        : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} available.`
      : "";

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
        {/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props */}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby={statusId}
          autoComplete="off"
          className="field bg-white"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
      </label>

      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Place suggestions"
          className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          {suggestions.map((s, i) => {
            const active = i === activeIndex;
            return (
              <li
                key={s.id}
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={active}
                className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  active ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
                onMouseDown={(e) => {
                  // mousedown (not click) so the input doesn't blur first.
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {s.label}
                  </span>
                  {s.context ? (
                    <span className="block truncate text-xs text-ink-muted">
                      {s.context}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-soft">
                  {KIND_LABELS[s.kind]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showCurrentLocation ? (
        <div>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-brand-700 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
            onClick={() => geo.request()}
            disabled={geo.status === "loading"}
          >
            {geo.status === "loading" ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
                aria-hidden
              />
            ) : (
              <span aria-hidden>📍</span>
            )}
            {geo.status === "loading" ? "Locating…" : "Use my current location"}
          </button>
          {geo.error ? (
            <p className="mt-1 text-sm text-red-600" role="status">
              {geo.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
