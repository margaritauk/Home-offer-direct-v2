"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isDealsEnabled } from "@/lib/supabase/config";
import { claimInvites, listMyPendingInvites } from "@/lib/deals/invites";
import { isInviteExpired } from "@/lib/deals/invite-utils";
import type { DealInvite, DealRole } from "@/lib/deals/types";

const ROLE_LABELS: Record<DealRole, string> = {
  owner_buyer: "Owner (buyer)",
  co_buyer: "Co-buyer",
  agent: "Agent",
  attorney: "Attorney",
  viewer: "Viewer",
};

/**
 * Surfaces the pending invitations addressed to the signed-in user (RLS scopes
 * by email) and lets them accept (claim) on demand — claiming also happens
 * automatically on sign-in via CloudSync. Inert when the deal layer is off or
 * there are no pending invites, so it adds no markup to the guest path.
 */
export function PendingInvitations() {
  const { enabled: cloudEnabled, user } = useAuth();
  const enabled = isDealsEnabled() && Boolean(user);
  const [invites, setInvites] = useState<DealInvite[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setInvites([]);
      return;
    }
    let cancelled = false;
    void listMyPendingInvites().then((list) => {
      if (!cancelled) {
        setInvites(list.filter((i) => !isInviteExpired(i.expiresAt)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!cloudEnabled || !user || invites.length === 0) return null;

  async function onAccept() {
    setBusy(true);
    await claimInvites();
    const list = await listMyPendingInvites();
    setInvites(list.filter((i) => !isInviteExpired(i.expiresAt)));
    setBusy(false);
    // Reload so the deal switcher / active-deal pick up the new membership.
    window.location.reload();
  }

  return (
    <div className="card border-brand-200 bg-brand-50">
      <h3 className="text-base font-semibold">Pending invitations</h3>
      <p className="mt-1 text-sm text-ink-soft">
        You&apos;ve been invited to {invites.length === 1 ? "a deal" : "these deals"}:
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {invites.map((i) => (
          <li key={i.id}>
            Join as <span className="font-medium">{ROLE_LABELS[i.role]}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-primary mt-3" disabled={busy} onClick={onAccept}>
        {busy ? "Joining…" : "Accept invitation"}
      </button>
    </div>
  );
}
