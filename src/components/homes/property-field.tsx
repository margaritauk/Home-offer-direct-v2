"use client";

import { HomePicker } from "./home-picker";

/**
 * Lightweight "Property" field (issue #112) for the under-contract tools
 * (inspection, counter-offer, clear-to-close, escrow). It just LABELS which home
 * the tool is about — picked via the shared {@link HomePicker} or typed by hand —
 * and reports the label string back via `onChange`. It does not restructure the
 * tool or change its math.
 *
 * GUARDRAIL (FHA, #112): the picker only surfaces address/transaction facts and
 * screens manual free text, so no protected-class signal enters tool state here.
 */
export function PropertyField({
  value,
  onChange,
}: {
  /** The current property label stored on the tool's state (may be empty). */
  value: string;
  /** Called with the new label (or "" when cleared). */
  onChange: (label: string) => void;
}) {
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Property</h2>
          <p className="text-sm text-ink-soft">
            {value
              ? value
              : "Optional — label which home this tool is tracking."}
          </p>
        </div>
        <div className="flex gap-2">
          <HomePicker
            label={value ? "Change home" : "Pick a home"}
            onPick={(home) => onChange(home.label)}
          />
          {value ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onChange("")}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
