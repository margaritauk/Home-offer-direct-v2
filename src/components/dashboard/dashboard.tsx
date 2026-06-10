"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { useShowings } from "@/hooks/use-showings";
import { useOfferStatus } from "@/hooks/use-offer-status";
import { useTracker } from "@/hooks/use-tracker";
import { totalTasks } from "@/lib/journey";
import { formatISO } from "@/lib/deadlines";
import { buildHomeRollups } from "@/lib/homes/rollup";
import { HomeRollupCard } from "./home-rollup-card";
import { DashboardEmptyState } from "./empty-state";
import { JourneyProgressSummary } from "@/components/journey/journey-progress-summary";

/**
 * Client dashboard (#38). Reads every existing store via its hook and feeds them
 * to the pure {@link buildHomeRollups} aggregator. Degrades gracefully when the
 * offer store is empty (per the #38 ⇢ #39 dependency note).
 */
export function Dashboard() {
  const { completed, hydrated: pHydrated } = useProgress();
  const { showings, hydrated: sHydrated } = useShowings();
  const { offers, hydrated: oHydrated } = useOfferStatus();
  const { state: tracker, hydrated: tHydrated } = useTracker();

  const hydrated = pHydrated && sHydrated && oHydrated && tHydrated;

  const rollups = useMemo(() => {
    if (!hydrated) return [];
    return buildHomeRollups({
      progress: completed,
      totalJourneyTasks: totalTasks(),
      showings,
      offers,
      tracker: {
        underContractDate: tracker.underContractDate,
        closingDate: tracker.closingDate,
        offsets: tracker.offsets,
        docs: tracker.docs,
      },
      today: formatISO(Date.now()),
    });
  }, [hydrated, completed, showings, offers, tracker]);

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="card">
            <div className="h-6 w-40 rounded bg-slate-100" />
            <div className="mt-4 h-2 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (rollups.length === 0) {
    return (
      <div>
        <JourneyProgressSummary className="mb-6" />
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div>
      <JourneyProgressSummary className="mb-6" />
      <p className="mb-4 text-sm text-ink-muted" aria-live="polite">
        {rollups.length} home{rollups.length === 1 ? "" : "s"} in progress
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {rollups.map((r) => (
          <HomeRollupCard key={r.listingId} rollup={r} />
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-muted">
        Manage offers in the{" "}
        <Link href="/offer-status" className="text-brand-700 hover:underline">
          offer-status tracker
        </Link>{" "}
        and showings in the{" "}
        <Link href="/showings" className="text-brand-700 hover:underline">
          showings tracker
        </Link>
        .
      </p>
    </div>
  );
}
