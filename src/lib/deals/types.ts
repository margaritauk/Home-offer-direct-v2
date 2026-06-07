/**
 * Multi-user deal model (epic #59, ADR-012). A "deal" is one shared home
 * purchase; members join it with a role and a status. This layer is entirely
 * feature-gated — it only activates for a signed-in user with Supabase
 * configured. With no keys / signed out, the app is single-user local-first.
 */

/** Roles a member can hold on a deal. `owner_buyer` is the deal creator. */
export type DealRole =
  | "owner_buyer"
  | "co_buyer"
  | "agent"
  | "attorney"
  | "viewer";

/** Membership lifecycle. Invites land as `pending`; accepting flips to `active`. */
export type DealMemberStatus = "pending" | "active" | "revoked";

/** A shared home purchase. */
export interface Deal {
  id: string;
  createdBy: string;
  label: string;
  createdAt: string;
}

/** A user's membership in a deal. */
export interface DealMember {
  dealId: string;
  userId: string;
  role: DealRole;
  status: DealMemberStatus;
  invitedEmail: string | null;
  createdAt: string;
}

/** Roles permitted to write deal_data (mirrors the RLS editor policy). */
export const EDITOR_ROLES: readonly DealRole[] = [
  "owner_buyer",
  "co_buyer",
  "agent",
  "attorney",
];
