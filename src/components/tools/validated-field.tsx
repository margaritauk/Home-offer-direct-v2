"use client";

import { useId, useState } from "react";
import {
  validateNumber,
  type NumberBounds,
} from "@/lib/tools/validation";

/**
 * Shared validated number input (issue #149, A1).
 *
 * Mirrors the draft-state pattern from `src/components/offer/fields.tsx`: the
 * raw string the user types is held in local `draft` state so they can clear
 * the box or type freely ("1.", "", "-") without us silently rewriting it. We
 * parse to a number on each change and call `onChange` with the parsed value —
 * an out-of-range value is NEVER blocked, so the host calculator keeps
 * computing; we just surface an advisory message below the field.
 *
 * Validation is delegated to the pure `validateNumber` helper. Messages are
 * advisory ("double-check"), never prescriptive (estimates-not-advice).
 */
export function ValidatedNumberField({
  label,
  value,
  onChange,
  bounds = {},
  step,
  unit,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  bounds?: NumberBounds;
  step?: number;
  /** Unit shown in messages and as an inline suffix (e.g. "%", "$"). */
  unit?: string;
  /** Optional always-on helper text below the input. */
  hint?: string;
}) {
  // Local draft lets the user clear/type freely; when null we show the
  // canonical numeric value. We never coerce the draft back into the box.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : value === 0 ? "" : String(value);

  // Parse the *currently shown* text for validation: empty → null (ok), a
  // half-typed/garbage token → NaN (error). This matches the helper contract.
  const trimmed = shown.trim();
  const parsedForValidation =
    trimmed === "" ? null : Number(trimmed);
  const validity = validateNumber(parsedForValidation, bounds, { label, unit });

  const messageId = useId();
  const hintId = useId();
  const showMessage = validity.state !== "ok" && validity.message;
  const describedBy =
    [showMessage ? messageId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          className="field"
          value={shown}
          aria-label={label}
          aria-invalid={validity.state === "error" ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            // Empty draft → hand the host a 0 so its math stays defined, but
            // keep the box empty (draft preserved). A parseable number flows
            // through even when out of range; unparseable tokens are held back.
            if (raw.trim() === "") {
              onChange(0);
            } else {
              const n = Number(raw);
              if (Number.isFinite(n)) onChange(n);
            }
          }}
          onBlur={() => setDraft(null)}
        />
        {unit ? (
          <span className="text-sm text-ink-muted">{unit}</span>
        ) : null}
      </div>

      {showMessage ? (
        <span
          id={messageId}
          role={validity.state === "error" ? "alert" : undefined}
          className={`mt-1 block text-xs ${
            validity.state === "error" ? "text-red-600" : "text-amber-600"
          }`}
        >
          {validity.message}
        </span>
      ) : null}

      {hint ? (
        <span id={hintId} className="mt-1 block text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
