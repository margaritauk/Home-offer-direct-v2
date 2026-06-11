"use client";

import { CurrencyField } from "@/components/offer/fields";

export interface PriceBounds {
  lo: number;
  hi: number;
}

/**
 * Canonical min/max for the price filter. A value of 0 (or undefined) means
 * "unbounded" on that side — i.e. the user has not set that bound.
 */
export interface RangeValue {
  min: number;
  max: number;
}

/** Clamp a raw value into the data bounds. */
export function clampToBounds(n: number, bounds: PriceBounds): number {
  if (n <= 0) return 0;
  return Math.min(Math.max(n, bounds.lo), bounds.hi);
}

/**
 * Enforce a coherent range. Empty (0) on either side stays unbounded. When both
 * sides are set and min > max, we clamp min DOWN to max so the user's most
 * recent edit is respected without silently widening the other bound.
 *
 * `edited` says which field the user just changed, so we know which side to
 * correct when they cross:
 *  - editing "min" above max  -> pull min down to max
 *  - editing "max" below min  -> push max up to min
 */
export function clampRange(
  min: number,
  max: number,
  bounds: PriceBounds,
  edited: "min" | "max" = "min",
): RangeValue {
  let lo = clampToBounds(min, bounds);
  let hi = clampToBounds(max, bounds);
  if (lo > 0 && hi > 0 && lo > hi) {
    if (edited === "min") hi = lo;
    else lo = hi;
  }
  return { min: lo, max: hi };
}

/**
 * Resolve a *manually typed* range. Unlike {@link clampRange} this does NOT snap
 * values into the dataset's price bounds — a typed price is taken at face value
 * (otherwise typing "3" would jump to the cheapest listing's price). It only
 * floors negatives to 0 and, when both sides are set and min > max, pulls the
 * just-edited side to meet the other so the range stays coherent.
 */
export function cohereRange(
  min: number,
  max: number,
  edited: "min" | "max" = "min",
): RangeValue {
  const lo = min > 0 ? min : 0;
  let hi = max > 0 ? max : 0;
  let loOut = lo;
  if (lo > 0 && hi > 0 && lo > hi) {
    if (edited === "min") hi = lo;
    else loOut = hi;
  }
  return { min: loOut, max: hi };
}

/** Slider position for a side: unbounded snaps to the relevant bound edge. */
export function sliderValue(n: number, side: "min" | "max", bounds: PriceBounds): number {
  if (n <= 0) return side === "min" ? bounds.lo : bounds.hi;
  return clampToBounds(n, bounds);
}

export function PriceRange({
  min,
  max,
  onChange,
  bounds,
  hydrated = true,
}: {
  min: number;
  max: number;
  onChange: (next: RangeValue) => void;
  bounds: PriceBounds;
  hydrated?: boolean;
}) {
  const minThumb = sliderValue(min, "min", bounds);
  const maxThumb = sliderValue(max, "max", bounds);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <CurrencyField
          label="Min price"
          explainer=""
          value={min}
          // Take the typed value at face value while editing; resolve min/max
          // coherence only on blur so multi-digit entry never jumps.
          onChange={(n) => onChange({ min: n, max })}
          onCommit={() => onChange(cohereRange(min, max, "min"))}
          hydrated={hydrated}
        />
        <CurrencyField
          label="Max price"
          explainer=""
          value={max}
          onChange={(n) => onChange({ min, max: n })}
          onCommit={() => onChange(cohereRange(min, max, "max"))}
          hydrated={hydrated}
        />
      </div>

      {/* Dual-range slider: two thumbs sharing one track. */}
      <div className="relative h-6">
        <input
          type="range"
          className="dual-range pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 w-full accent-brand-600"
          min={bounds.lo}
          max={bounds.hi}
          step={Math.max(1, Math.round((bounds.hi - bounds.lo) / 100))}
          value={minThumb}
          onChange={(e) => {
            const v = Number(e.target.value);
            // Snapping to the low edge means "no min".
            const next = v <= bounds.lo ? 0 : v;
            onChange(clampRange(next, max, bounds, "min"));
          }}
          aria-label="Minimum price"
          aria-valuetext={min > 0 ? `$${min.toLocaleString("en-US")}` : "No minimum"}
        />
        <input
          type="range"
          className="dual-range pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 w-full accent-brand-600"
          min={bounds.lo}
          max={bounds.hi}
          step={Math.max(1, Math.round((bounds.hi - bounds.lo) / 100))}
          value={maxThumb}
          onChange={(e) => {
            const v = Number(e.target.value);
            // Snapping to the high edge means "no max".
            const next = v >= bounds.hi ? 0 : v;
            onChange(clampRange(min, next, bounds, "max"));
          }}
          aria-label="Maximum price"
          aria-valuetext={max > 0 ? `$${max.toLocaleString("en-US")}` : "No maximum"}
        />
      </div>
    </div>
  );
}
