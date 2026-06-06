"use client";

import Link from "next/link";
import {
  getSamplePros,
  proRoleLabels,
  type ProRole,
} from "@/lib/pros";
import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { FinderServices } from "@/components/finder-services";

/**
 * Contextual "bring in a pro" card shown on the journey step where a given role
 * matters most. State-aware: highlights when an attorney is required in the
 * buyer's state and counts matching sample listings.
 */
export function ProHandoff({ role }: { role: ProRole }) {
  const { stateCode, hydrated } = useStateSelection();
  const meta = proRoleLabels[role];
  const profile = hydrated && stateCode ? getStateProfile(stateCode) : undefined;

  const attorneyRequired =
    role === "attorney" && profile?.attorneyRequiredAtClosing;

  const sampleCount = hydrated
    ? getSamplePros({ role, state: stateCode ?? undefined }).length
    : 0;

  const href = `/pros?role=${role}`;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl">{meta.icon}</span>
        <h3 className="font-semibold text-ink">Bring in a {meta.label.toLowerCase()}</h3>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{meta.blurb}</p>

      {attorneyRequired && profile ? (
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          ⚖️ {profile.name} requires an attorney at closing — you&apos;ll need one
          regardless, so engage them early.
        </p>
      ) : null}

      <div className="mt-3">
        <FinderServices role={role} />
      </div>

      <Link href={href} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
        Browse {meta.plural.toLowerCase()} in the directory
        {hydrated && profile ? ` (${sampleCount} sample${sampleCount === 1 ? "" : "s"} for ${profile.name})` : ""} →
      </Link>
    </div>
  );
}
