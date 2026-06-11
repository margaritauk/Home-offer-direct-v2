/**
 * Pure number-field validation (issue #149, A1).
 *
 * A small, dependency-free, side-effect-free helper that classifies a numeric
 * value against optional bounds. It is deliberately advisory: it never blocks a
 * computation and never tells the user their number is "wrong" or what to do —
 * soft-range messages only ask them to "double-check" (estimates-not-advice).
 *
 * Empty / NaN decision (documented contract):
 *   - `null` / `undefined`  → "ok". An empty field is NOT an error. The user is
 *     mid-edit or hasn't filled it in yet; flagging that would be noisy. Hosts
 *     that truly require a value should enforce that at submit time, not here.
 *   - a typed non-number (`NaN`, `Infinity`, `-Infinity`) → "error" ("Enter a
 *     number"). This is the only "you typed something that isn't a number"
 *     state. In the component layer an empty string is mapped to `null` (ok),
 *     while a half-typed token like "1-" parses to `NaN` (error).
 */

export interface NumberBounds {
  /** Hard lower bound — values below this are an error. */
  min?: number;
  /** Hard upper bound — values above this are an error. */
  max?: number;
  /** Soft lower bound — values below this (but >= min) are a warning. */
  softMin?: number;
  /** Soft upper bound — values above this (but <= max) are a warning. */
  softMax?: number;
}

export type NumberValidity = {
  state: "ok" | "warn" | "error";
  message?: string;
};

interface ValidateOpts {
  /** Optional field label — currently reserved for future message phrasing. */
  label?: string;
  /** Optional unit shown inline in messages (e.g. "%", "$"). */
  unit?: string;
}

const OK: NumberValidity = { state: "ok" };

/** Format a bound for display, suffixing the unit when one is given. */
function fmt(n: number, unit?: string): string {
  // `$` reads better as a prefix; everything else (%, yrs, …) as a suffix.
  if (unit === "$") return `$${n.toLocaleString("en-US")}`;
  const base = n.toLocaleString("en-US");
  return unit ? `${base}${unit}` : base;
}

/**
 * Classify `value` against `bounds`. Pure: same inputs → same output, no I/O.
 *
 * Order of checks: empty (ok) → non-finite (error) → hard bounds (error) →
 * soft bounds (warn) → ok. Hard bounds always win over soft bounds, and a
 * value can only be flagged soft when it is inside the hard range.
 */
export function validateNumber(
  value: number | null | undefined,
  bounds: NumberBounds,
  opts: ValidateOpts = {},
): NumberValidity {
  const { unit } = opts;

  // Empty isn't an error — see the module-level decision note.
  if (value === null || value === undefined) return OK;

  // A typed token that isn't a finite number (NaN/Infinity).
  if (!Number.isFinite(value)) {
    return { state: "error", message: "Enter a number" };
  }

  const { min, max, softMin, softMax } = bounds;

  // Hard bounds → error. Build the clearest message the available bounds allow.
  const hasMin = typeof min === "number";
  const hasMax = typeof max === "number";
  if (hasMin && value < min) {
    return {
      state: "error",
      message:
        hasMax && typeof max === "number"
          ? `Must be between ${fmt(min, unit)} and ${fmt(max, unit)}`
          : `Must be at least ${fmt(min, unit)}`,
    };
  }
  if (hasMax && value > max) {
    return {
      state: "error",
      message:
        hasMin && typeof min === "number"
          ? `Must be between ${fmt(min, unit)} and ${fmt(max, unit)}`
          : `Must be at most ${fmt(max, unit)}`,
    };
  }

  // Soft bounds → advisory warning (inside the hard range by now).
  if (typeof softMin === "number" && value < softMin) {
    return {
      state: "warn",
      message: "This looks unusually low — double-check.",
    };
  }
  if (typeof softMax === "number" && value > softMax) {
    return {
      state: "warn",
      message: "This looks unusually high — double-check.",
    };
  }

  return OK;
}
