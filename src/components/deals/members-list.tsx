"use client";

import { useState } from "react";
import type { DealMember, DealRole } from "@/lib/deals/types";
import { INVITABLE_ROLES } from "@/lib/deals/types";
import { canChangeRole, canRevoke } from "@/lib/deals/membership";

const ROLE_LABELS: Record<DealRole, string> = {
  owner_buyer: "Owner (buyer)",
  co_buyer: "Co-buyer",
  agent: "Agent",
  attorney: "Attorney",
  viewer: "Viewer",
};

const ROLE_OPTIONS: readonly DealRole[] = ["owner_buyer", ...INVITABLE_ROLES];

/**
 * Roster for a deal. Members see the list; the owner can change roles and
 * revoke. Last-owner protection (the pure `canRevoke` / `canChangeRole`
 * helpers) disables the actions that would leave the deal ownerless — the RPC
 * enforces the same guard server-side.
 */
export function MembersList({
  members,
  isOwner,
  changeRole,
  revoke,
}: {
  members: DealMember[];
  isOwner: boolean;
  changeRole: (userId: string, role: DealRole) => Promise<{ error?: string }>;
  revoke: (userId: string) => Promise<{ error?: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onChangeRole(m: DealMember, role: DealRole) {
    setError(null);
    setBusyId(m.userId);
    const res = await changeRole(m.userId, role);
    setBusyId(null);
    if (res.error) setError(res.error);
  }

  async function onRevoke(m: DealMember) {
    setError(null);
    setBusyId(m.userId);
    const res = await revoke(m.userId);
    setBusyId(null);
    if (res.error) setError(res.error);
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold">Members</h3>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <ul className="mt-3 divide-y divide-slate-100">
        {members.map((m) => {
          const revokable = isOwner && canRevoke(members, m);
          return (
            <li
              key={m.userId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.invitedEmail ?? m.userId}
                </p>
                <p className="text-xs text-ink-muted">
                  {ROLE_LABELS[m.role]} · {m.status}
                </p>
              </div>
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={busyId === m.userId || m.status === "revoked"}
                    onChange={(e) => onChangeRole(m, e.target.value as DealRole)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option
                        key={r}
                        value={r}
                        disabled={!canChangeRole(members, m, r)}
                      >
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={!revokable || busyId === m.userId}
                    onClick={() => onRevoke(m)}
                  >
                    Revoke
                  </button>
                </div>
              ) : (
                <span className="text-xs text-ink-muted">{ROLE_LABELS[m.role]}</span>
              )}
            </li>
          );
        })}
        {members.length === 0 ? (
          <li className="py-3 text-sm text-ink-muted">No members yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
