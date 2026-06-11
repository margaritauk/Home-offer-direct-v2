"use client";

import { type ReactNode, useState } from "react";

/** A labelled field with a plain-English explainer (issue #12 AC). */
export function FieldShell({
  label,
  explainer,
  children,
}: {
  label: string;
  explainer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-soft">{label}</label>
      {children}
      <p className="text-xs text-ink-muted">{explainer}</p>
    </div>
  );
}

export function NumberField({
  label,
  explainer,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hydrated: boolean;
}) {
  // Local draft lets the user clear the box (delete the "0") while typing;
  // on blur we resync to the canonical numeric value.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : hydrated ? String(value) : "";

  return (
    <FieldShell label={label} explainer={explainer}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          value={shown}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            if (raw === "") onChange(0);
            else {
              const n = Number(raw);
              if (!Number.isNaN(n)) onChange(n);
            }
          }}
          onBlur={() => setDraft(null)}
          aria-label={label}
          suppressHydrationWarning
        />
        {suffix ? <span className="text-sm text-ink-muted">{suffix}</span> : null}
      </div>
    </FieldShell>
  );
}

/** Whole-dollar currency input: empty when 0 (so the "0" is deletable) and
 * formatted with thousands separators as you type (e.g. 700,000).
 *
 * While focused, a local `draft` mirrors exactly what the user typed, so any
 * reformatting/clamping a parent applies to `value` never fights their keystrokes
 * mid-entry — the box always shows their own digits until they leave it. Use the
 * optional `onCommit` to resolve cross-field rules (e.g. min/max coherence) on
 * blur rather than on every keystroke. */
export function CurrencyField({
  label,
  explainer,
  value,
  onChange,
  onCommit,
  placeholder = "0",
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: number;
  onChange: (n: number) => void;
  onCommit?: () => void;
  placeholder?: string;
  hydrated: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = value > 0 ? value.toLocaleString("en-US") : "";
  // Honor the draft only while it still represents the current value. If the
  // parent resets `value` out from under us (e.g. "Clear all"), the draft is
  // stale and we fall back to the canonical formatted value.
  const draftNum =
    draft !== null ? Number(draft.replace(/[^0-9]/g, "")) || 0 : null;
  const useDraft = draft !== null && draftNum === value;
  const display = !hydrated ? "" : useDraft ? draft : formatted;
  return (
    <FieldShell label={label} explainer={explainer}>
      <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
        <span className="text-ink-muted">$</span>
        <input
          type="text"
          inputMode="numeric"
          className="w-full border-0 px-2 py-2.5 focus:outline-none focus:ring-0"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, "");
            const n = digits ? parseInt(digits, 10) : 0;
            // Echo the user's own digits (comma-grouped) until they blur.
            setDraft(n > 0 ? n.toLocaleString("en-US") : "");
            onChange(n);
          }}
          onBlur={() => {
            setDraft(null);
            onCommit?.();
          }}
          aria-label={label}
          suppressHydrationWarning
        />
      </div>
    </FieldShell>
  );
}

export function TextField({
  label,
  explainer,
  value,
  onChange,
  placeholder,
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  hydrated: boolean;
}) {
  return (
    <FieldShell label={label} explainer={explainer}>
      <input
        type="text"
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
        value={hydrated ? value : ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        suppressHydrationWarning
      />
    </FieldShell>
  );
}

export function DateField({
  label,
  explainer,
  value,
  onChange,
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: string;
  onChange: (s: string) => void;
  hydrated: boolean;
}) {
  return (
    <FieldShell label={label} explainer={explainer}>
      <input
        type="date"
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
        value={hydrated ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        suppressHydrationWarning
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  explainer,
  value,
  onChange,
  options,
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hydrated: boolean;
}) {
  return (
    <FieldShell label={label} explainer={explainer}>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
        value={hydrated ? value : options[0]?.value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        suppressHydrationWarning
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
