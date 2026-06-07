"use client";

import { useCallback, useEffect, useState } from "react";
import { isDealsEnabled } from "@/lib/supabase/config";
import {
  getDealAgency,
  listMembers,
  revokeMember,
  saveDealAgency,
  updateMemberRole,
} from "@/lib/deals/queries";
import {
  inviteToDeal,
  listDealInvites,
} from "@/lib/deals/invites";
import type {
  AgencyRelationship,
  DealAgency,
  DealInvite,
  DealMember,
  DealRole,
} from "@/lib/deals/types";

/**
 * Loads + mutates the management state for one deal: members, invites, and the
 * agency/consent record. Entirely inert when the deal layer is disabled (no
 * keys / signed out): everything stays empty and the actions are no-ops, so the
 * single-user path is never affected.
 */
export function useDealManagement(
  dealId: string | null,
  userId: string | null | undefined,
) {
  const enabled = isDealsEnabled() && Boolean(userId) && Boolean(dealId);
  const [members, setMembers] = useState<DealMember[]>([]);
  const [invites, setInvites] = useState<DealInvite[]>([]);
  const [agency, setAgency] = useState<DealAgency | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled || !dealId) return;
    const [m, i, a] = await Promise.all([
      listMembers(dealId),
      listDealInvites(dealId),
      getDealAgency(dealId),
    ]);
    setMembers(m);
    setInvites(i);
    setAgency(a);
  }, [enabled, dealId]);

  useEffect(() => {
    if (!enabled) {
      setMembers([]);
      setInvites([]);
      setAgency(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void reload().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reload]);

  const invite = useCallback(
    async (email: string, role: DealRole) => {
      if (!dealId) return { error: "No active deal." };
      const res = await inviteToDeal(dealId, email, role);
      if (!res.error) await reload();
      return res;
    },
    [dealId, reload],
  );

  const changeRole = useCallback(
    async (memberUserId: string, role: DealRole) => {
      if (!dealId) return { error: "No active deal." };
      const res = await updateMemberRole(dealId, memberUserId, role);
      if (!res.error) await reload();
      return res;
    },
    [dealId, reload],
  );

  const revoke = useCallback(
    async (memberUserId: string) => {
      if (!dealId) return { error: "No active deal." };
      const res = await revokeMember(dealId, memberUserId);
      if (!res.error) await reload();
      return res;
    },
    [dealId, reload],
  );

  const saveAgency = useCallback(
    async (input: {
      agencyRelationship: AgencyRelationship;
      financialConsent: boolean;
    }) => {
      if (!dealId) return { error: "No active deal." };
      const res = await saveDealAgency(dealId, input);
      if (!res.error) await reload();
      return res;
    },
    [dealId, reload],
  );

  const isOwner = members.some(
    (m) => m.userId === userId && m.role === "owner_buyer" && m.status === "active",
  );

  return {
    enabled,
    loading,
    members,
    invites,
    agency,
    isOwner,
    reload,
    invite,
    changeRole,
    revoke,
    saveAgency,
  };
}
