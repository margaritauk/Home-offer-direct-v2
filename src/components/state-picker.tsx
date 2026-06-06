"use client";

import { getStateOptions } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";

const options = getStateOptions();

/**
 * Lets the buyer choose their state. Selection persists to localStorage and
 * drives state-aware guidance across the journey.
 */
export function StatePicker({
  label = "Your state",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const { stateCode, hydrated, selectState } = useStateSelection();

  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        value={hydrated && stateCode ? stateCode : ""}
        onChange={(e) => selectState(e.target.value || null)}
        suppressHydrationWarning
        aria-label={label}
      >
        <option value="">Select your state…</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
