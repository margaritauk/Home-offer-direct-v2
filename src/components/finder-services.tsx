"use client";

import { getFinderServices, proRoleLabels, type ProRole } from "@/lib/pros";
import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";

/**
 * The trustworthy, real handoff path: official "find a vetted pro" services.
 * Optionally scoped to a single role. Per-state services are personalized with
 * the buyer's selected state when one is set.
 */
export function FinderServices({ role }: { role?: ProRole }) {
  const { stateCode, hydrated } = useStateSelection();
  const stateName =
    hydrated && stateCode ? getStateProfile(stateCode)?.name : undefined;

  const services = getFinderServices(role);

  return (
    <ul className="space-y-3">
      {services.map((s) => (
        <li key={s.id} className="card">
          <div className="flex items-center gap-2">
            <span aria-hidden>{proRoleLabels[s.role].icon}</span>
            <h3 className="font-semibold text-ink">{s.name}</h3>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {s.description}
            {s.perState && stateName ? (
              <span className="font-medium text-ink"> Use {stateName}&apos;s service.</span>
            ) : null}
          </p>
          <a
            href={s.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Open {s.name} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
