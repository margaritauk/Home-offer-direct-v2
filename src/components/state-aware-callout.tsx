"use client";

import Link from "next/link";
import { getStateProfile, closingPathLabels, disclosureRegimeLabels } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { StatePicker } from "@/components/state-picker";

export type StateTopic = "closing" | "disclosure";

/**
 * Renders state-specific guidance for a given topic on a journey step. Reads the
 * buyer's selected state from localStorage; if none is set, it prompts them to
 * pick one inline.
 */
export function StateAwareCallout({ topic }: { topic: StateTopic }) {
  const { stateCode, hydrated } = useStateSelection();

  // Avoid SSR/client mismatch — render a stable placeholder until hydrated.
  if (!hydrated) {
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-hidden />;
  }

  const profile = stateCode ? getStateProfile(stateCode) : undefined;

  if (!profile) {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-800">
          📍 Rules vary by state
        </p>
        <p className="mt-1 text-sm text-brand-900">
          Pick your state to see exactly how this step works where you&apos;re
          buying.
        </p>
        <StatePicker className="mt-3 max-w-xs" label="" />
      </div>
    );
  }

  const closing = closingPathLabels[profile.closingPath];
  const disclosure = disclosureRegimeLabels[profile.disclosureRegime];

  return (
    <div className="rounded-lg border border-brand-300 bg-brand-50 p-4">
      <p className="text-sm font-semibold text-brand-800">
        📍 In {profile.name}
      </p>
      {topic === "closing" ? (
        <div className="mt-1 space-y-1 text-sm text-brand-900">
          <p>
            <strong>{closing.label}.</strong> {profile.closingNote}
          </p>
          {profile.attorneyRequiredAtClosing ? (
            <p className="font-medium">
              ⚖️ An attorney is required at closing here — budget for one.
            </p>
          ) : null}
          <p className="text-brand-800">{profile.transferTaxNote}</p>
        </div>
      ) : (
        <div className="mt-1 space-y-1 text-sm text-brand-900">
          <p>
            <strong>{disclosure.label}.</strong> {profile.disclosureNote}
          </p>
          {profile.disclosureFormName ? (
            <p>
              Look for the <strong>{profile.disclosureFormName}</strong>.
            </p>
          ) : null}
        </div>
      )}
      <Link
        href={`/states/${profile.code.toLowerCase()}`}
        className="mt-2 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
      >
        Full {profile.name} guide →
      </Link>
    </div>
  );
}
