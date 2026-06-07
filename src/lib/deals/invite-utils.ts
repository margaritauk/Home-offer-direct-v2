/**
 * Pure, dependency-free helpers for the invite flow (#74). Kept separate from
 * the Supabase client module so they are trivially unit-testable. The SQL RPCs
 * (invite_to_deal / claim_deal_invites) are the source of truth in production;
 * these mirror that logic for client-side validation + display.
 */

import { INVITABLE_ROLES, type DealRole } from "./types";

/** Trim + lowercase an email, exactly as the `invite_to_deal` RPC does. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Minimal email shape check (must have a single @ with text on both sides). */
export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  // One @, non-empty local part, a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Is `role` one an owner may assign to an invitee (i.e. not owner_buyer)? */
export function isInvitableRole(role: string): role is DealRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

/**
 * Default invite lifetime, in days — mirrors the RPC's `now() + 14 days`.
 * Centralized so the client copy ("expires in N days") stays in sync.
 */
export const INVITE_TTL_DAYS = 14;

/**
 * Has an invite with this `expires_at` (ISO string) expired relative to `now`?
 * `now` is injectable so tests are deterministic. A claimed/revoked invite is
 * the RPC's concern; this only judges the expiry clock.
 */
export function isInviteExpired(
  expiresAt: string,
  now: Date = new Date(),
): boolean {
  const exp = Date.parse(expiresAt);
  if (Number.isNaN(exp)) return true; // treat unparseable as expired (default-deny)
  return exp <= now.getTime();
}
