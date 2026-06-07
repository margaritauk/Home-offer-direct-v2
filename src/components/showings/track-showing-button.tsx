"use client";

import { useState } from "react";
import Link from "next/link";
import { useShowings } from "@/hooks/use-showings";
import { showingStatusLabels } from "@/lib/showings/types";
import { MessageComposer } from "@/components/showings/message-composer";

/**
 * Per-listing entry point (issues #20 + #18): "Track this showing" adds the
 * listing to the buyer's tracker, and "Request a showing" reveals the
 * Fair-Housing-safe message composer pre-filled with this listing's address.
 */
export function TrackShowingButton({
  listingId,
  address,
  city,
  state,
}: {
  listingId: string;
  address: string;
  city: string;
  state: string;
}) {
  const { showings, hydrated, track, setStatus } = useShowings();
  const [showComposer, setShowComposer] = useState(false);

  const tracked = hydrated ? showings[listingId] : undefined;

  const handleTrack = () => {
    track({ listingId, address, city, state });
  };

  const handleRequest = () => {
    // Contacting the agent logs the home and advances it to "requested"
    // (without downgrading a home that's already further along).
    if (tracked) {
      if (tracked.status === "interested") setStatus(listingId, "requested");
    } else {
      track({ listingId, address, city, state, status: "requested" });
    }
    setShowComposer((v) => !v);
  };

  return (
    <div className="space-y-2">
      {tracked ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          ✓ Tracking this showing —{" "}
          <span className="font-medium">{showingStatusLabels[tracked.status]}</span>.{" "}
          <Link href="/showings" className="font-medium underline">
            View tracker
          </Link>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleTrack}
          disabled={!hydrated}
          className="btn-secondary w-full"
        >
          + Track this showing
        </button>
      )}

      <button
        type="button"
        onClick={handleRequest}
        disabled={!hydrated}
        className="btn-secondary w-full"
        aria-expanded={showComposer}
      >
        {showComposer ? "Hide message" : "Contact listing agent / request a showing"}
      </button>

      {showComposer ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-ink-muted">
            Pick a template — ask for more info or request a showing. Copy it into
            your email; this home is now saved in your tracker.
          </p>
          <MessageComposer
            initialTemplateId="request-showing"
            initialValues={{ address: `${address}, ${city}, ${state}` }}
          />
        </div>
      ) : null}
    </div>
  );
}
