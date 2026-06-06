import type { Metadata } from "next";
import Link from "next/link";
import { getStages, totalSteps, totalTasks } from "@/lib/journey";
import { JourneyOverview } from "@/components/journey-overview";

export const metadata: Metadata = {
  title: "The home-buying journey",
  description:
    "Every stage of buying a home without an agent — from getting ready to closing — as a trackable, plain-English checklist.",
};

export default function JourneyPage() {
  const stages = getStages();
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Your roadmap
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          The home-buying journey
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          {stages.length} stages · {totalSteps()} steps · {totalTasks()} checklist
          items. Work through them in order, or jump to wherever you are. Your
          progress saves automatically on this device — no account needed.
        </p>
      </div>
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

      <div className="mt-10">
        <JourneyOverview stages={stages} />
      </div>
    </div>
  );
}
