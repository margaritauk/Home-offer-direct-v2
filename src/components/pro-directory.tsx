"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSamplePros,
  proRoleLabels,
  PRO_ROLES,
  sampleProStates,
  type ProRole,
} from "@/lib/pros";
import { getStateOptions } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { ProCard } from "@/components/pro-card";
import { FinderServices } from "@/components/finder-services";

const stateOptions = getStateOptions();

export function ProDirectory({ initialRole }: { initialRole?: ProRole }) {
  const { stateCode, hydrated } = useStateSelection();
  const [role, setRole] = useState<ProRole | "all">(initialRole ?? "all");
  const [state, setState] = useState<string>("");
  const [query, setQuery] = useState("");

  // Default the state filter to the buyer's selected state once hydrated.
  useEffect(() => {
    if (hydrated && stateCode) setState(stateCode);
  }, [hydrated, stateCode]);

  const statesWithSamples = useMemo(() => new Set(sampleProStates()), []);

  const results = useMemo(() => {
    const pros = getSamplePros({
      role: role === "all" ? undefined : role,
      state: state || undefined,
    });
    const q = query.trim().toLowerCase();
    if (!q) return pros;
    return pros.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.location?.toLowerCase().includes(q) ?? false),
    );
  }, [role, state, query]);

  return (
    <div>
      {/* Filters */}
      <div className="card grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Type of pro</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={role}
            onChange={(e) => setRole(e.target.value as ProRole | "all")}
            aria-label="Type of pro"
          >
            <option value="all">All types</option>
            {PRO_ROLES.map((r) => (
              <option key={r} value={r}>
                {proRoleLabels[r].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">State</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={state}
            onChange={(e) => setState(e.target.value)}
            aria-label="State"
            suppressHydrationWarning
          >
            <option value="">All states</option>
            {stateOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
                {statesWithSamples.has(o.code) ? "" : " (samples: nationwide only)"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, location…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            aria-label="Search directory"
          />
        </label>
      </div>

      {/* Sample disclaimer */}
      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Sample listings.</strong> The cards below are illustrative
        examples, not real businesses or endorsements. To find a real, vetted
        professional, use the official finder services in the next section.
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {results.length} sample listing{results.length === 1 ? "" : "s"}
      </p>
      {results.length > 0 ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-ink-muted">
          No sample listings match those filters. Try the official finder
          services below — they cover every state.
        </p>
      )}

      {/* Real finder services */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold">Find a real, vetted pro</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          These official services are the trustworthy way to find a qualified
          professional near you.
        </p>
        <div className="mt-4">
          <FinderServices role={role === "all" ? undefined : role} />
        </div>
      </div>
    </div>
  );
}
