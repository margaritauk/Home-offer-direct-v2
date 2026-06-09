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

/**
 * Roles an owner may surface as invite choices. The product focuses on
 * unrepresented buyers, so `agent` is intentionally excluded here even though
 * it remains a valid `DealRole`/`EDITOR_ROLES` member for dormant infra and any
 * pre-existing agent memberships. (Excludes `owner_buyer` too.)
 */
export const INVITABLE_ROLES: readonly DealRole[] = [
  "co_buyer",
  "attorney",
  "viewer",
];

/** Lifecycle of an invite. Pending until claimed (or revoked by the owner). */
export type DealInviteStatus = "pending" | "claimed" | "revoked";

/** An email invitation to join a deal with a given role. */
export interface DealInvite {
  id: string;
  dealId: string;
  email: string;
  role: DealRole;
  status: DealInviteStatus;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
}

/** How the agent on a deal relates to the buyer (agency capture, #76). */
export type AgencyRelationship =
  | "represents_buyer"
  | "listing_side"
  | "unrepresented"
  | "unknown";

/** Per-deal agency relationship + dated financial-data sharing consent (#76). */
export interface DealAgency {
  dealId: string;
  agencyRelationship: AgencyRelationship;
  financialConsent: boolean;
  consentCapturedAt: string | null;
  agencyCapturedAt: string | null;
  updatedAt: string;
}
