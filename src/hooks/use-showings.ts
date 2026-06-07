"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";
import type {
  ShowingMap,
  ShowingRecord,
  ShowingStatus,
} from "@/lib/showings/types";

const STORAGE_KEY = "hod:showings:v1";

/** Fields a caller may supply when first tracking a listing. */
export interface TrackInput {
  listingId: string;
  address: string;
  city: string;
  state: string;
  /** Defaults to "interested". */
  status?: ShowingStatus;
}

/** Mutable fields on an existing record (location snapshot is fixed). */
export type ShowingPatch = Partial<
  Pick<ShowingRecord, "status" | "scheduledAt" | "notes" | "rating">
>;

function read(): ShowingMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ShowingMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persists the buyer's per-listing showing pipeline in localStorage (issue #20).
 * Follows the hydrate-after-mount pattern of {@link useTracker} and emits a
 * local-change event on every write so the cloud-sync layer can pick it up.
 */
export function useShowings() {
  const [showings, setShowings] = useState<ShowingMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setShowings(read());
    setHydrated(true);
  }, []);

  const commit = useCallback((next: ShowingMap) => {
    setShowings(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* best-effort */
    }
    emitLocalChange();
  }, []);

  /** Start tracking a listing (idempotent — keeps an existing record). */
  const track = useCallback(
    (input: TrackInput) => {
      setShowings((prev) => {
        if (prev[input.listingId]) return prev;
        const now = new Date().toISOString();
        const record: ShowingRecord = {
          listingId: input.listingId,
          address: input.address,
          city: input.city,
          state: input.state.toUpperCase(),
          status: input.status ?? "interested",
          createdAt: now,
          updatedAt: now,
        };
        const next = { ...prev, [input.listingId]: record };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* best-effort */
        }
        emitLocalChange();
        return next;
      });
    },
    [],
  );

  /** Patch an existing record. No-op if the listing isn't tracked. */
  const update = useCallback((listingId: string, patch: ShowingPatch) => {
    setShowings((prev) => {
      const existing = prev[listingId];
      if (!existing) return prev;
      const next = {
        ...prev,
        [listingId]: {
          ...existing,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      emitLocalChange();
      return next;
    });
  }, []);

  /** Convenience wrapper for the most common update. */
  const setStatus = useCallback(
    (listingId: string, status: ShowingStatus) => update(listingId, { status }),
    [update],
  );

  /** Stop tracking a listing entirely. */
  const remove = useCallback((listingId: string) => {
    setShowings((prev) => {
      if (!prev[listingId]) return prev;
      const next = { ...prev };
      delete next[listingId];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      emitLocalChange();
      return next;
    });
  }, []);

  const clear = useCallback(() => commit({}), [commit]);

  const records = useMemo(
    () =>
      Object.values(showings).sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      ),
    [showings],
  );

  return {
    showings,
    records,
    hydrated,
    track,
    update,
    setStatus,
    remove,
    clear,
  };
}
