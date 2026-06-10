"use client";

import { useState } from "react";
import { INVITABLE_ROLES, type DealRole } from "@/lib/deals/types";
import { INVITE_TTL_DAYS } from "@/lib/deals/invite-utils";

const ROLE_LABELS: Record<DealRole, string> = {
  owner_buyer: "Owner (buyer)",
  co_buyer: "Co-buyer",
  agent: "Agent",
  attorney: "Attorney",
  viewer: "Viewer",
};

/**
 * Owner-only form to invite an email to the deal. Calls the parent's `invite`
 * (which hits the `invite_to_deal` RPC). No email is sent — the invitee claims
 * the invite when they sign in with that address.
 */
export function InviteForm({
  invite,
}: {
  invite: (email: string, role: DealRole) => Promise<{ error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<DealRole>("co_buyer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = await invite(email, role);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setInfo(
        `Invitation created. ${email} can join by signing in with that email within ${INVITE_TTL_DAYS} days.`,
      );
      setEmail("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h3 className="text-base font-semibold">Invite someone to this deal</h3>
      <p className="text-sm text-ink-muted">
        No email is sent yet — they join by signing in with this email address.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as DealRole)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {info ? <p className="text-sm text-brand-700">{info}</p> : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Inviting…" : "Send invite"}
      </button>
    </form>
  );
}
