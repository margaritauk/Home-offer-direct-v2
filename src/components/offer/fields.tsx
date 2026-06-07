"use client";

import { type ReactNode } from "react";

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
  return (
    <FieldShell label={label} explainer={explainer}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          value={hydrated ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          suppressHydrationWarning
        />
        {suffix ? <span className="text-sm text-ink-muted">{suffix}</span> : null}
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
