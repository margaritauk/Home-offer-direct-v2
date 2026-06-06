"use client";

import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { StatePicker } from "@/components/state-picker";
import { StateGuide } from "@/components/state-guide";

/** Picker + the guide for whichever state is currently selected. */
export function SelectedStateGuide() {
  const { stateCode, hydrated } = useStateSelection();
  const profile = hydrated && stateCode ? getStateProfile(stateCode) : undefined;

  return (
    <div className="space-y-6">
      <div className="card">
        <StatePicker className="max-w-sm" />
        <p className="mt-2 text-xs text-ink-muted">
          Your choice is saved on this device and personalizes guidance across
          the whole journey.
        </p>
      </div>

      {profile ? (
        <div>
          <h2 className="mb-4 text-2xl font-bold">{profile.name}</h2>
          <StateGuide profile={profile} />
        </div>
      ) : (
        <p className="text-ink-muted" suppressHydrationWarning>
          Select your state above to see its closing process, disclosure rules,
          and official resources.
        </p>
      )}
    </div>
  );
}
