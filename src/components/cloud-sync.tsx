"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { mergeSyncData } from "@/lib/sync/merge";
import { fetchRemote, pushRemote } from "@/lib/sync/remote";
import { LOCAL_CHANGE_EVENT, readLocal, writeLocal } from "@/lib/sync/local-store";

/**
 * Invisible orchestrator that keeps the local stores in sync with the user's
 * Supabase row. No-ops entirely when cloud sync is unconfigured or signed out.
 *
 * On first sign-in (per tab) it merges the device's data with the account's,
 * writes the merged result locally, pushes it up, then reloads once so the
 * individual hooks pick up the merged data. Afterwards it debounce-pushes any
 * local change to the cloud.
 */
export function CloudSync() {
  const { enabled, user } = useAuth();
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const mergedFlag = `hod:synced:${user.id}`;
    let cancelled = false;

    async function initialSync() {
      if (sessionStorage.getItem(mergedFlag)) return;
      const remote = await fetchRemote(supabase!, user!.id);
      if (cancelled) return;
      const merged = mergeSyncData(readLocal(), remote);
      writeLocal(merged);
      await pushRemote(supabase!, user!.id, merged);
      sessionStorage.setItem(mergedFlag, "1");
      // Reload so useProgress/useStateSelection/useTracker read merged data.
      window.location.reload();
    }

    function schedulePush() {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void pushRemote(supabase!, user!.id, readLocal());
      }, 1200);
    }

    void initialSync();
    window.addEventListener(LOCAL_CHANGE_EVENT, schedulePush);
    return () => {
      cancelled = true;
      window.removeEventListener(LOCAL_CHANGE_EVENT, schedulePush);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [enabled, user]);

  return null;
}
