"use client";

import { useEffect, useState } from "react";
import type { DealAgency, DealMember } from "@/lib/deals/types";
import {
  canSeeFinancials,
  fetchDealFinancials,
  type DealFinancials,
} from "@/lib/deals/financials";

/**
 * Field-level financial scoping in the UI (#77). Redacts the buyer's budget /
 * financing facets for members who aren't allowed to see them, using the SAME
 * `canSeeFinancials` predicate the RLS policy mirrors. Even if the UI check
 * were bypassed, RLS withholds the row — this is the visible layer of a
 * default-deny, two-layer guard.
 */
export function FinancialsSection({
  dealId,
  members,
  agency,
  userId,
}: {
  dealId: string;
  members: DealMember[];
  agency: DealAgency | null;
  userId: string | null | undefined;
}) {
  const me = members.find((m) => m.userId === userId && m.status === "active");
  const isOwner = me?.role === "owner_buyer";
  const consent = agency?.financialConsent ?? false;
  const allowed = me ? canSeeFinancials(me.role, consent, isOwner) : false;

  const [financials, setFinancials] = useState<DealFinancials | null>(null);

  useEffect(() => {
    if (!allowed) {
      setFinancials(null);
      return;
    }
    let cancelled = false;
    void fetchDealFinancials(dealId).then((f) => {
      if (!cancelled) setFinancials(f);
    });
    return () => {
      cancelled = true;
    };
  }, [allowed, dealId]);

  return (
    <div className="card">
      <h3 className="text-base font-semibold">Financial data</h3>
      {allowed ? (
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <span className="font-medium">Budget:</span>{" "}
            {financials?.budget != null
              ? JSON.stringify(financials.budget)
              : "Not set"}
          </p>
          <p>
            <span className="font-medium">Financing:</span>{" "}
            {financials?.financing != null
              ? JSON.stringify(financials.financing)
              : "Not set"}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">
          The buyer&apos;s financial data (budget and offer financing) is hidden.
          It is shared only with members the buyer has explicitly consented to.
        </p>
      )}
    </div>
  );
}
