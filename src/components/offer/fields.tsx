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
 * formatted with thousands separators as you type (e.g. 700,000). */
export function CurrencyField({
  label,
  explainer,
  value,
  onChange,
  placeholder = "0",
  hydrated,
}: {
  label: string;
  explainer: ReactNode;
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  hydrated: boolean;
}) {
  const display = !hydrated ? "" : value > 0 ? value.toLocaleString("en-US") : "";
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
            onChange(digits ? parseInt(digits, 10) : 0);
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
