"use client";

import { documentGroups, totalDocuments } from "@/lib/documents";

/**
 * Presentational document checklist. State is owned by the parent (TrackerApp)
 * so it shares a single useTracker instance and never clobbers the deal dates.
 */
export function DocumentChecklist({
  docs,
  onToggle,
  hydrated,
}: {
  docs: Record<string, boolean>;
  onToggle: (id: string) => void;
  hydrated: boolean;
}) {
  const done = hydrated ? Object.values(docs).filter(Boolean).length : 0;
  const total = totalDocuments();

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Document checklist</h2>
        <span className="text-sm font-medium text-ink-muted" suppressHydrationWarning>
          {done}/{total} gathered
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {documentGroups.map((group) => (
          <div key={group.id} className="card">
            <h3 className="text-lg font-semibold">{group.title}</h3>
            <ul className="mt-3 space-y-3">
              {group.items.map((item) => {
                const checked = hydrated && Boolean(docs[item.id]);
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 flex-shrink-0 rounded border-slate-300 accent-brand-600"
                        checked={checked}
                        onChange={() => onToggle(item.id)}
                        suppressHydrationWarning
                      />
                      <span>
                        <span
                          className={`font-medium ${checked ? "text-ink-muted line-through" : "text-ink"}`}
                        >
                          {item.label}
                        </span>
                        {item.note ? (
                          <span className="mt-0.5 block text-sm text-ink-muted">
                            {item.note}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
