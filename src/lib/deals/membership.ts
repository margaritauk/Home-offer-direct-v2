/**
 * Pure last-owner-protection helpers (#75). Mirror the guards in the
 * `revoke_deal_member` / `set_deal_member_role` RPCs so the UI can disable the
 * action ahead of the server rejecting it. The RPC remains the enforcement
 * point; these are advisory + UX.
 */

import type { DealMember, DealRole } from "./types";

/** Count active owner_buyer members in the roster. */
function activeOwnerCount(members: DealMember[]): number {
  return members.filter(
    (m) => m.role === "owner_buyer" && m.status === "active",
  ).length;
}

/** Is `target` the only active owner_buyer on the deal? */
export function isLastActiveOwner(
  members: DealMember[],
  target: DealMember,
): boolean {
  return (
    target.role === "owner_buyer" &&
    target.status === "active" &&
    activeOwnerCount(members) <= 1
  );
}

/**
 * May the owner revoke `target`? Forbidden when `target` is the only active
 * owner_buyer (would leave the deal ownerless). An already-revoked member is a
 * no-op but allowed.
 */
export function canRevoke(members: DealMember[], target: DealMember): boolean {
  if (target.status === "revoked") return true;
  return !isLastActiveOwner(members, target);
}

/**
 * May the owner change `target`'s role to `nextRole`? Forbidden when it would
 * downgrade the only active owner_buyer away from owner_buyer.
 */
export function canChangeRole(
  members: DealMember[],
  target: DealMember,
  nextRole: DealRole,
): boolean {
  if (nextRole === target.role) return true;
  if (nextRole === "owner_buyer") return true; // promoting is always fine
  return !isLastActiveOwner(members, target);
}
