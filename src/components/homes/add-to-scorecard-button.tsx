"use client";

import Link from "next/link";
import { useScorecard } from "@/hooks/use-scorecard";
import type { MyHome } from "@/lib/homes/my-homes";

/**
 * "+ Add to scorecard" / "✓ On scorecard" toggle (UX continuity, Item 1
 * phase-2 / S0b). Reads/writes the SHARED tour-scorecard blob via
 * {@link useScorecard}, so a home added here shows up on `/tools/tour-scorecard`
 * with its facts snapshot.
 *
 * Used in two places:
 *  - on `ListingCard`, INSIDE the wrapping `<Link>` — so its onClick MUST
 *    `preventDefault`/`stopPropagation` (the `compact` variant) to avoid
 *    navigating the card.
 *  - on `/listings/[id]` (the aside), as a full-width button.
 *
 * UPL: copy is "+ Add to scorecard", never directive ("pick this one"). ≥44px.
 */
export function AddToScorecardButton({
  home,
  compact = false,
}: {
  /** The home to add, built from the in-scope `Listing` (facts only). */
  home: MyHome;
  /** Compact card-footer variant (inside a `<Link>`). */
  compact?: boolean;
}) {
  const { hydrated, isOnScorecard, addHome, removeHome } = useScorecard();
  const on = isOnScorecard(home);

  const toggle = (e: React.MouseEvent) => {
    // Inside the card's wrapping <Link>, don't navigate.
    e.preventDefault();
    e.stopPropagation();
    if (on) removeHome(home);
    else addHome(home);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={!hydrated}
        aria-pressed={on}
        className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
          on
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-slate-300 bg-white text-ink hover:border-brand-300"
        }`}
      >
        {on ? "✓ On scorecard" : "+ Scorecard"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={!hydrated}
        aria-pressed={on}
        className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
          on
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-slate-300 bg-white text-ink hover:border-brand-300"
        }`}
      >
        {on ? "✓ On your scorecard" : "+ Add to scorecard"}
      </button>
      {on ? (
        <Link
          href="/tools/tour-scorecard"
          className="block text-center text-sm font-medium text-brand-700 hover:underline"
        >
          View scorecard →
        </Link>
      ) : null}
    </div>
  );
}

/** Build the facts-only {@link MyHome} for a listing the buyer is viewing. */
export function myHomeFromListing(listing: {
  id: string;
  address: string;
  city?: string;
  state?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  propertyType?: MyHome["propertyType"];
}): MyHome {
  return {
    key: `listing:${listing.id}`,
    label: listing.address,
    address: listing.address,
    city: listing.city,
    state: listing.state ? listing.state.toUpperCase() : undefined,
    listingId: listing.id,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft,
    propertyType: listing.propertyType,
    source: "Home search",
  };
}
