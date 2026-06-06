"use client";

import Link from "next/link";
import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";

/**
 * Banner on the journey overview. Reflects the persisted state selection: once a
 * state is chosen it confirms personalization (rather than nagging again), and
 * otherwise prompts the buyer to pick one.
 */
export function JourneyStateBanner() {
  const { stateCode, hydrated } = useStateSelection();
  const profile = hydrated && stateCode ? getStateProfile(stateCode) : undefined;

  if (profile) {
    return (
      <Link
        href="/states"
        className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-brand-300 bg-brand-50 px-5 py-4 transition hover:border-brand-400"
      >
        <span className="text-sm text-brand-900">
          📍 Personalized for <strong>{profile.name}</strong> — closing,
          disclosure, and transfer-tax guidance is tailored to your state.
        </span>
        <span className="hidden whitespace-nowrap font-medium text-brand-700 sm:inline">
          Change state →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/states"
      className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-brand-200 bg-brand-50 px-5 py-4 transition hover:border-brand-300"
    >
      <span className="text-sm text-brand-900">
        📍 <strong>Tell us your state</strong> to personalize closing,
        disclosure, and transfer-tax guidance throughout your journey.
      </span>
      <span className="hidden whitespace-nowrap font-medium text-brand-700 sm:inline">
        Pick your state →
      </span>
    </Link>
  );
}
