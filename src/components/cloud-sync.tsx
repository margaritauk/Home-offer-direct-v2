"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useActiveDeal } from "@/hooks/use-active-deal";
import { mergeSyncData } from "@/lib/sync/merge";
import {
  fetchDealData,
  fetchRemote,
  pushDealData,
  pushRemote,
} from "@/lib/sync/remote";
import { LOCAL_CHANGE_EVENT, readLocal, writeLocal } from "@/lib/sync/local-store";
import { claimInvites } from "@/lib/deals/invites";
import { isDealsEnabled } from "@/lib/supabase/config";

/**
 * Invisible orchestrator that keeps the local stores in sync with Supabase.
 * No-ops entirely when cloud sync is unconfigured or signed out.
 *
 * Routing (the deal-vs-user decision):
 * - Signed in + Supabase configured + the deal layer enabled + an ACTIVE deal →
 *   sync the deal's `deal_data` row. On first activation, single-user data is
 *   migrated into the deal (issue #70) so nothing is lost. When the deal layer
 *   is disabled (the default), `useActiveDeal` never selects a deal, so this
 *   branch is unreachable and sync always targets the legacy `user_data` row.
 * - Signed in but no active deal (deals off, or deals still loading) → the
 *   legacy `user_data` sync, exactly as before.
 * - Signed out / no keys → completely inert. Byte-for-byte today's behavior.
 *
 * On first sync (per tab, per target) it merges the device's data with the
 * remote, writes the merged result locally, pushes it up, then reloads once so
 * the individual hooks pick up the merged data. Afterwards it debounce-pushes
 * any local change.
 */
export function CloudSync() {
  const { enabled, user } = useAuth();
  const { activeDealId } = useActiveDeal(user?.id ?? null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Issue #74 — auto-join: once signed in, claim any pending invites addressed
  // to this user's email so they become active members of the deals they were
  // invited to. Idempotent server-side; runs once per (tab, user). Gated on the
  // deal layer (NOT just cloud sync): with deals off (the default) we never
  // claim invites or create memberships, preserving the single-user path.
  useEffect(() => {
    if (!enabled || !user || !isDealsEnabled()) return;
    const claimedFlag = `hod:invites-claimed:${user.id}`;
    if (sessionStorage.getItem(claimedFlag)) return;
    let cancelled = false;
    void claimInvites().then(() => {
      if (!cancelled) sessionStorage.setItem(claimedFlag, "1");
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Target key distinguishes the user row from each deal so the per-tab
    // "already synced" flag is scoped correctly.
    const target = activeDealId ? `deal:${activeDealId}` : `user:${user.id}`;
    const mergedFlag = `hod:synced:${user.id}:${target}`;
    let cancelled = false;

    const fetchTarget = () =>
      activeDealId
        ? fetchDealData(supabase!, activeDealId)
        : fetchRemote(supabase!, user!.id);

    const pushTarget = (data: ReturnType<typeof readLocal>) =>
      activeDealId
        ? pushDealData(supabase!, activeDealId, data)
        : pushRemote(supabase!, user!.id, data);

    async function initialSync() {
      if (sessionStorage.getItem(mergedFlag)) return;

      const remote = await fetchTarget();
      if (cancelled) return;

      // Issue #70 — migrate single-user → deal #1. When this is the first time
      // we touch the deal and the deal has no data yet, seed it from the user's
      // existing data: prefer the cloud `user_data` row, else the local stores.
      // Idempotent: only runs while the deal row is empty, never duplicates.
      let seed = remote;
      if (activeDealId && remote === null) {
        const userRemote = await fetchRemote(supabase!, user!.id);
        if (cancelled) return;
        seed = userRemote; // null → mergeSyncData falls back to local below
      }

      const merged = mergeSyncData(readLocal(), seed);
      writeLocal(merged);
      await pushTarget(merged);
      if (cancelled) return;
      sessionStorage.setItem(mergedFlag, "1");
      // Reload so useProgress/useStateSelection/useTracker read merged data.
      window.location.reload();
    }

    function schedulePush() {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void pushTarget(readLocal());
      }, 1200);
    }

    void initialSync();
    window.addEventListener(LOCAL_CHANGE_EVENT, schedulePush);
    return () => {
      cancelled = true;
      window.removeEventListener(LOCAL_CHANGE_EVENT, schedulePush);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [enabled, user, activeDealId]);

  return null;
}
