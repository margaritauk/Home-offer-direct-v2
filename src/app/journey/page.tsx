import type { Metadata } from "next";
import { getStages, totalSteps, totalTasks } from "@/lib/journey";
import { JourneyOverview } from "@/components/journey-overview";
import { JourneyStateBanner } from "@/components/journey-state-banner";

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
      <JourneyStateBanner />

      <div className="mt-10">
        <JourneyOverview stages={stages} />
      </div>
    </div>
  );
}
