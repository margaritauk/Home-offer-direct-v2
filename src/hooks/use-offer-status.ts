"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";
import {
  offerStatusReducer,
  type OfferStatusPatch,
  type UpsertOfferInput,
} from "@/lib/offer-status/reducer";
import type {
  OfferStatus,
  OfferStatusMap,
} from "@/lib/offer-status/types";

const STORAGE_KEY = "hod:offer-status:v1";

function read(): OfferStatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OfferStatusMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persists the buyer's per-home offer-status pipeline in localStorage (#39).
 *
 * Follows the hydrate-after-mount pattern of {@link useShowings}, runs every
 * mutation through the pure {@link offerStatusReducer}, and emits a local-change
 * event on each write so the cloud-sync layer (owned by the lead) can pick it
 * up via the `hod:offer-status:v1` key.
 */
export function useOfferStatus() {
  const [offers, setOffers] = useState<OfferStatusMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOffers(read());
    setHydrated(true);
  }, []);

  // Keep in sync across tabs (mirrors useProgress).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setOffers(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dispatch = useCallback(
    (action: Parameters<typeof offerStatusReducer>[1]) => {
      setOffers((prev) => {
        const next = offerStatusReducer(prev, action);
        if (next === prev) return prev;
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

  /** Start tracking (or patch, if it exists) an offer for a home. */
  const upsert = useCallback(
    (input: UpsertOfferInput) => dispatch({ type: "upsert", input }),
    [dispatch],
  );

  /** Patch an existing record. No-op if the home isn't tracked. */
  const patch = useCallback(
    (listingId: string, p: OfferStatusPatch) =>
      dispatch({ type: "patch", listingId, patch: p }),
    [dispatch],
  );

  /** Advance / set the status, optionally with a note. */
  const setStatus = useCallback(
    (listingId: string, status: OfferStatus, note?: string) =>
      dispatch({ type: "setStatus", listingId, status, note }),
    [dispatch],
  );

  /** Stop tracking an offer entirely. */
  const remove = useCallback(
    (listingId: string) => dispatch({ type: "remove", listingId }),
    [dispatch],
  );

  const clear = useCallback(() => dispatch({ type: "clear" }), [dispatch]);

  const records = useMemo(
    () =>
      Object.values(offers).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [offers],
  );

  return {
    offers,
    records,
    hydrated,
    upsert,
    patch,
    setStatus,
    remove,
    clear,
  };
}
