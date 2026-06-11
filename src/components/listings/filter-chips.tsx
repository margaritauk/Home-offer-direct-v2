"use client";

export interface FilterChip {
  /** Stable id identifying which filter this chip represents (e.g. "state"). */
  id: string;
  /** Human-readable label shown in the pill (e.g. "State: CA"). */
  label: string;
}

/**
 * Active-filter chips (issue #172). Each chip is a removable pill; a "Clear all"
 * button appears whenever any chip is present. Renders nothing when empty.
 */
export function FilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemove(chip.id)}
          aria-label={`Remove ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 transition hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true" className="text-base leading-none">
            &times;
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        Clear all
      </button>
    </div>
  );
}
