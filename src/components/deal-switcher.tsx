"use client";

import { useAuth } from "@/hooks/use-auth";
import { useActiveDeal } from "@/hooks/use-active-deal";

/**
 * Lets a signed-in user pick which deal the app operates on. Renders nothing
 * unless cloud sync is enabled, the user is signed in, and they have at least
 * one deal — so with no keys / signed out it is completely inert (no markup),
 * preserving the single-user experience. The lead places this in the nav.
 */
export function DealSwitcher() {
  const { enabled: cloudEnabled, user } = useAuth();
  const { activeDealId, deals, switchDeal } = useActiveDeal(user?.id ?? null);

  if (!cloudEnabled || !user || deals.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Active deal</span>
      <select
        value={activeDealId ?? ""}
        onChange={(e) => switchDeal(e.target.value || null)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
      >
        {deals.map((deal) => (
          <option key={deal.id} value={deal.id}>
            {deal.label}
          </option>
        ))}
      </select>
    </label>
  );
}
