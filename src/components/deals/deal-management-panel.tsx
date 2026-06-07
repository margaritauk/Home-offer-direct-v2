"use client";

import { useAuth } from "@/hooks/use-auth";
import { useActiveDeal } from "@/hooks/use-active-deal";
import { useDealManagement } from "@/hooks/use-deal-management";
import { PendingInvitations } from "./pending-invitations";
import { MembersList } from "./members-list";
import { InviteForm } from "./invite-form";
import { AgencyConsent } from "./agency-consent";
import { FinancialsSection } from "./financials-section";

/**
 * The deal-management surface (#74–#76 UI). Renders nothing unless the deal
 * layer is enabled (Supabase configured) AND the user is signed in — so with no
 * keys / signed out it adds zero markup and the single-user app is untouched.
 *
 * Owner sees the invite form, role controls, and the agency/consent capture;
 * non-owner members see the roster + the captured representation state.
 */
export function DealManagementPanel() {
  const { enabled: cloudEnabled, user } = useAuth();
  const { activeDealId, deals } = useActiveDeal(user?.id ?? null);
  const {
    enabled,
    loading,
    members,
    agency,
    isOwner,
    invite,
    changeRole,
    revoke,
    saveAgency,
  } = useDealManagement(activeDealId, user?.id ?? null);

  if (!cloudEnabled || !user) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Sign in to manage your deal</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Inviting collaborators and managing roles requires an account. Your
          local progress works without one.
        </p>
      </div>
    );
  }

  if (!enabled || !activeDealId || deals.length === 0) {
    return (
      <div className="space-y-4">
        <PendingInvitations />
        <div className="card text-ink-muted">No active deal to manage yet.</div>
      </div>
    );
  }

  const activeDeal = deals.find((d) => d.id === activeDealId);

  return (
    <div className="space-y-6">
      <PendingInvitations />

      {activeDeal ? (
        <p className="text-sm text-ink-muted">
          Managing <span className="font-medium text-ink">{activeDeal.label}</span>
        </p>
      ) : null}

      {loading ? (
        <div className="card text-ink-muted">Loading…</div>
      ) : (
        <>
          <MembersList
            members={members}
            isOwner={isOwner}
            changeRole={changeRole}
            revoke={revoke}
          />
          {isOwner ? <InviteForm invite={invite} /> : null}
          <AgencyConsent agency={agency} isOwner={isOwner} save={saveAgency} />
          <FinancialsSection
            dealId={activeDealId}
            members={members}
            agency={agency}
            userId={user.id}
          />
        </>
      )}
    </div>
  );
}
