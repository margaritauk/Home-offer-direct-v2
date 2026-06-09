"use client";

import { useCallback, useEffect, useState } from "react";
import { isDealsEnabled } from "@/lib/supabase/config";
import { ensureOwnDeal, listMyDeals } from "@/lib/deals/queries";
import type { Deal } from "@/lib/deals/types";

export const ACTIVE_DEAL_KEY = "hod:active-deal:v1";

/**
 * In-tab subscribers, mirroring use-state-selection: the browser `storage`
 * event only fires in *other* tabs, so a module-level listener set keeps every
 * hook instance in the same document in sync when the active deal changes.
 */
const listeners = new Set<(id: string | null) => void>();

function readActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_DEAL_KEY);
  } catch {
    return null;
  }
}

function writeActiveId(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(ACTIVE_DEAL_KEY, id);
    else window.localStorage.removeItem(ACTIVE_DEAL_KEY);
  } catch {
    /* best-effort */
  }
  listeners.forEach((l) => l(id));
}

/**
 * Tracks which deal the app is operating on for a signed-in, cloud-enabled
 * user. The active id is persisted at `hod:active-deal:v1` and shared across
 * hook instances in the tab.
 *
 * When the deal layer is disabled (cloud sync off OR the `NEXT_PUBLIC_DEALS_ENABLED`
 * opt-in flag unset) OR the user is signed out, this hook is inert: `deals` is
 * empty, `activeDealId` stays null, and no deal is auto-created — so callers
 * fall back to the existing single-user / local-first behavior. Pass `userId`
 * (from useAuth) so the hook knows when to load deals.
 */
export function useActiveDeal(userId: string | null | undefined) {
  const enabled = isDealsEnabled() && Boolean(userId);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(enabled);

  // Hydrate persisted id + subscribe to in-tab / cross-tab changes.
  useEffect(() => {
    setActiveDealId(readActiveId());

    const listener = (id: string | null) => setActiveDealId(id);
    listeners.add(listener);

    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_DEAL_KEY) setActiveDealId(readActiveId());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Load the user's deals (and auto-create the owned deal if none) once signed
  // in + cloud enabled. No-op when disabled — keeps guest mode untouched.
  useEffect(() => {
    if (!enabled) {
      setDeals([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      await ensureOwnDeal();
      const mine = await listMyDeals();
      if (cancelled) return;
      setDeals(mine);
      // Default to the persisted deal if still valid, else the first deal.
      const persisted = readActiveId();
      const valid = persisted && mine.some((d) => d.id === persisted);
      const next = valid ? persisted : (mine[0]?.id ?? null);
      if (next !== readActiveId()) writeActiveId(next);
      else setActiveDealId(next);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  const switchDeal = useCallback((id: string | null) => {
    writeActiveId(id);
  }, []);

  return { enabled, activeDealId, deals, loading, switchDeal };
}
