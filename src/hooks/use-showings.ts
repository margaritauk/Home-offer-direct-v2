"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";
import type {
  ShowingMap,
  ShowingRecord,
  ShowingStatus,
} from "@/lib/showings/types";

const STORAGE_KEY = "hod:showings:v1";

/**
 * In-tab subscribers. The browser `storage` event only fires in *other* tabs,
 * so a module-level listener set keeps every hook instance in the same document
 * in sync — e.g. the tracker list and each card both call useShowings.
 * localStorage stays the single source of truth: mutations read fresh and every
 * instance re-reads on change (fixes the scheduled-date and rating not sticking).
 */
const listeners = new Set<() => void>();
function notifyAll() {
  listeners.forEach((l) => l());
}

/** Fields a caller may supply when first tracking a listing. */
export interface TrackInput {
  listingId: string;
  address: string;
  city: string;
  state: string;
  /** Defaults to "interested". */
  status?: ShowingStatus;
  /** True for properties the buyer added by hand (no real listing page). */
  manual?: boolean;
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

function write(next: ShowingMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
  notifyAll();
  emitLocalChange();
}

/**
 * Persists the buyer's per-listing showing pipeline in localStorage (issue #20).
 * Shared across instances in the tab so every card/list reflects writes
 * immediately. Mutations are computed from fresh storage, never stale state.
 */
export function useShowings() {
  const [showings, setShowings] = useState<ShowingMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setShowings(read());
    setHydrated(true);
    const sync = () => setShowings(read());
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setShowings(read());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /** Start tracking a listing (idempotent — keeps an existing record). */
  const track = useCallback((input: TrackInput) => {
    const cur = read();
    if (cur[input.listingId]) return;
    const now = new Date().toISOString();
    cur[input.listingId] = {
      listingId: input.listingId,
      address: input.address,
      city: input.city,
      state: input.state.toUpperCase(),
      status: input.status ?? "interested",
      manual: input.manual,
      createdAt: now,
      updatedAt: now,
    };
    write({ ...cur });
  }, []);

  /** Patch an existing record. No-op if the listing isn't tracked. */
  const update = useCallback((listingId: string, patch: ShowingPatch) => {
    const cur = read();
    const existing = cur[listingId];
    if (!existing) return;
    cur[listingId] = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    write({ ...cur });
  }, []);

  const setStatus = useCallback(
    (listingId: string, status: ShowingStatus) => update(listingId, { status }),
    [update],
  );

  /** Stop tracking a listing entirely. */
  const remove = useCallback((listingId: string) => {
    const cur = read();
    if (!cur[listingId]) return;
    delete cur[listingId];
    write({ ...cur });
  }, []);

  const clear = useCallback(() => write({}), []);

  const records = useMemo(
    () =>
      Object.values(showings).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
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
