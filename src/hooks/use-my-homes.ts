"use client";

import { useMemo } from "react";
import { useShowings } from "@/hooks/use-showings";
import { useStageTool } from "@/hooks/use-stage-tool";
import { allListings } from "@/lib/listings";
import { aggregateHomes, type MyHome } from "@/lib/homes/my-homes";
import type { ScoredHome } from "@/lib/tools/tour-scorecard";

/**
 * Client hook (issue #112) that aggregates the buyer's candidate homes from the
 * three sources the picker offers: home search (listings), tracked showings, and
 * the tour scorecard (read from the `tour-scorecard` `useStageTool` blob). The
 * merge/dedupe lives in the pure {@link aggregateHomes}; this hook just reads the
 * live data and feeds it in.
 *
 * Returns the deduped {@link MyHome} list plus a `hydrated` flag so callers can
 * wait for localStorage-backed sources (showings, scorecard) before rendering.
 */
export function useMyHomes(): { homes: MyHome[]; hydrated: boolean } {
  const { records, hydrated: showingsHydrated } = useShowings();
  const { value: scorecard, hydrated: scorecardHydrated } = useStageTool<{
    homes: ScoredHome[];
  }>("tour-scorecard", { homes: [] });

  const homes = useMemo(
    () =>
      aggregateHomes({
        listings: allListings().map((l) => ({
          id: l.id,
          address: l.address,
          city: l.city,
          state: l.state,
          sqft: l.sqft,
        })),
        showings: records.map((r) => ({
          listingId: r.listingId,
          address: r.address,
          city: r.city,
          state: r.state,
        })),
        scorecard: scorecard.homes.map((h) => ({
          id: h.id,
          label: h.label,
        })),
      }),
    [records, scorecard.homes],
  );

  return { homes, hydrated: showingsHydrated && scorecardHydrated };
}
