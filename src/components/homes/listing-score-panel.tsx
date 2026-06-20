"use client";

import {
  AddToScorecardButton,
  myHomeFromListing,
} from "@/components/homes/add-to-scorecard-button";
import { HomeScoreCard } from "@/components/homes/home-score-card";
import { useScorecard } from "@/hooks/use-scorecard";
import type { MyHome } from "@/lib/homes/my-homes";

/**
 * The `/listings/[id]` "score this home" island (UX continuity, Item 1 phase-2 /
 * S0b). Renders the {@link AddToScorecardButton}; once the listing is on the
 * scorecard, an INLINE {@link HomeScoreCard} lets the buyer score it (rubric,
 * notes, tour photos) without leaving the detail page. Reads/writes the SAME
 * shared scorecard blob via {@link useScorecard}, so the score shows up on
 * `/tools/tour-scorecard` too.
 */
export function ListingScorePanel({
  listing,
}: {
  listing: {
    id: string;
    address: string;
    city?: string;
    state?: string;
    price?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    propertyType?: MyHome["propertyType"];
  };
}) {
  const home = myHomeFromListing(listing);
  const { hydrated, findExisting, patchHome, setRating } = useScorecard();
  const existing = findExisting(home);

  return (
    <div className="space-y-4">
      <AddToScorecardButton home={home} />
      {hydrated && existing ? (
        <div className="card">
          <p className="mb-3 text-sm font-semibold text-ink">Score this home</p>
          <HomeScoreCard
            home={existing}
            bare
            onRating={(c, r) => setRating(existing.id, c, r)}
            onNotes={(notes) => patchHome(existing.id, { notes })}
            onTourPhotos={(photos) =>
              patchHome(existing.id, { tourPhotos: photos })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
