"use client";

import { useCallback } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { normalizeAddress, type MyHome } from "@/lib/homes/my-homes";
import type { ScoredHome } from "@/lib/tools/tour-scorecard";

/**
 * Shared read/write access to the tour-scorecard blob (UX continuity, Item 1
 * phase-2 / S0b). Used by the from-search `AddToScorecardButton` (card + detail)
 * and the inline scoring panel so they all mutate the SAME `useStageTool` store
 * the tool page renders — no second source of truth.
 *
 * Dedupe mirrors `aggregateHomes`' key rule: a home is "on the scorecard" when a
 * stored entry shares its `listingId`, OR (when there's no id) its normalized
 * address. Adding an already-present home is idempotent.
 */

export interface ScorecardState {
  homes: ScoredHome[];
}

export const SCORECARD_INITIAL: ScorecardState = { homes: [] };

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `home-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Build a {@link ScoredHome} from a picked {@link MyHome}, carrying the link. */
export function homeFromPick(home: MyHome): ScoredHome {
  const hasFacts =
    Boolean(home.address) ||
    home.price != null ||
    home.beds != null ||
    home.baths != null ||
    home.sqft != null;
  return {
    id: newId(),
    label: home.label,
    ...(home.listingId ? { listingId: home.listingId } : {}),
    ...(hasFacts
      ? {
          snapshot: {
            address: home.address ?? home.label,
            ...(home.city ? { city: home.city } : {}),
            ...(home.state ? { state: home.state } : {}),
            ...(home.price != null ? { price: home.price } : {}),
            ...(home.beds != null ? { beds: home.beds } : {}),
            ...(home.baths != null ? { baths: home.baths } : {}),
            ...(home.sqft != null ? { sqft: home.sqft } : {}),
            ...(home.propertyType ? { propertyType: home.propertyType } : {}),
          },
        }
      : {}),
    ratings: {},
    notes: "",
    addedAt: new Date().toISOString(),
  };
}

/** Whether a stored home matches a candidate (by listingId, else address). */
function sameHome(stored: ScoredHome, candidate: MyHome): boolean {
  if (candidate.listingId && stored.listingId) {
    return stored.listingId === candidate.listingId;
  }
  const a = normalizeAddress(stored.snapshot?.address ?? stored.label);
  const b = normalizeAddress(candidate.address ?? candidate.label);
  return Boolean(a) && a === b;
}

export function useScorecard() {
  const { value, hydrated, save } = useStageTool<ScorecardState>(
    "tour-scorecard",
    SCORECARD_INITIAL,
  );

  const findExisting = useCallback(
    (home: MyHome): ScoredHome | undefined =>
      value.homes.find((h) => sameHome(h, home)),
    [value.homes],
  );

  const isOnScorecard = useCallback(
    (home: MyHome): boolean => Boolean(findExisting(home)),
    [findExisting],
  );

  /** Add a home if not already present (idempotent). Returns the entry id. */
  const addHome = useCallback(
    (home: MyHome): string => {
      const existing = value.homes.find((h) => sameHome(h, home));
      if (existing) return existing.id;
      const entry = homeFromPick(home);
      save((prev) => {
        if (prev.homes.some((h) => sameHome(h, home))) return prev;
        return { homes: [...prev.homes, entry] };
      });
      return entry.id;
    },
    [value.homes, save],
  );

  /** Remove any home matching the candidate (by the same dedupe rule). */
  const removeHome = useCallback(
    (home: MyHome) => {
      save((prev) => ({ homes: prev.homes.filter((h) => !sameHome(h, home)) }));
    },
    [save],
  );

  /** Patch a stored home by id (rubric/notes/photos from the inline panel). */
  const patchHome = useCallback(
    (id: string, partial: Partial<ScoredHome>) => {
      save((prev) => ({
        homes: prev.homes.map((h) => (h.id === id ? { ...h, ...partial } : h)),
      }));
    },
    [save],
  );

  /** Set a single rubric rating on a stored home. */
  const setRating = useCallback(
    (id: string, criterionId: string, rating: number) => {
      save((prev) => ({
        homes: prev.homes.map((h) =>
          h.id === id
            ? { ...h, ratings: { ...h.ratings, [criterionId]: rating } }
            : h,
        ),
      }));
    },
    [save],
  );

  return {
    homes: value.homes,
    hydrated,
    isOnScorecard,
    findExisting,
    addHome,
    removeHome,
    patchHome,
    setRating,
  };
}
