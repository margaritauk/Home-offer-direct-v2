"use client";

import { useMemo, useState } from "react";
import type { GlossaryTerm } from "@/lib/journey/types";

export function GlossaryList({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...terms].sort((a, b) => a.term.localeCompare(b.term)),
    [terms],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search terms…"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        aria-label="Search glossary"
      />
      <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
        {filtered.length} term{filtered.length === 1 ? "" : "s"}
      </p>

      <dl className="mt-6 space-y-4">
        {filtered.map((t) => (
          <div key={t.slug} id={t.slug} className="card scroll-mt-24">
            <dt className="text-lg font-semibold text-ink">{t.term}</dt>
            <dd className="mt-1 text-ink-soft">{t.definition}</dd>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="text-ink-muted">No terms match &ldquo;{query}&rdquo;.</p>
        ) : null}
      </dl>
    </div>
  );
}
