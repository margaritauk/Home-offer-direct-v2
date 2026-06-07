import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AgencyRelationship,
  Deal,
  DealAgency,
  DealMember,
  DealRole,
} from "./types";

// ---------------------------------------------------------------------------
// Row mappers (pure — unit-testable without a live database).
// ---------------------------------------------------------------------------

interface DealRow {
  id: string;
  created_by: string;
  label: string | null;
  created_at: string;
}

interface DealMemberRow {
  deal_id: string;
  user_id: string;
  role: DealMember["role"];
  status: DealMember["status"];
  invited_email: string | null;
  created_at: string;
}

export function rowToDeal(row: DealRow): Deal {
  return {
    id: row.id,
    createdBy: row.created_by,
    label: row.label ?? "My home purchase",
    createdAt: row.created_at,
  };
}

export function rowToMember(row: DealMemberRow): DealMember {
  return {
    dealId: row.deal_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    invitedEmail: row.invited_email,
    createdAt: row.created_at,
  };
}

interface DealAgencyRow {
  deal_id: string;
  agency_relationship: AgencyRelationship;
  financial_consent: boolean;
  consent_captured_at: string | null;
  agency_captured_at: string | null;
  updated_at: string;
}

export function rowToAgency(row: DealAgencyRow): DealAgency {
  return {
    dealId: row.deal_id,
    agencyRelationship: row.agency_relationship,
    financialConsent: row.financial_consent,
    consentCapturedAt: row.consent_captured_at,
    agencyCapturedAt: row.agency_captured_at,
    updatedAt: row.updated_at,
  };
}

/** The default label for a user's auto-created owned deal. */
export const DEFAULT_DEAL_LABEL = "My home purchase";

// ---------------------------------------------------------------------------
// Client queries (no-op-safe: return empty when cloud sync is unconfigured).
// ---------------------------------------------------------------------------

/**
 * List the deals the signed-in user belongs to (active membership), newest
 * first. Returns [] when cloud sync is unconfigured or the user is signed out.
 */
export async function listMyDeals(
  client?: SupabaseClient | null,
): Promise<Deal[]> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("deal_members")
    .select("deals(id, created_by, label, created_at)")
    .eq("status", "active");
  if (error || !data) return [];
  // The join nests the deal under `deals` (object, or array depending on the
  // generated types); flatten + sort newest first.
  const deals = data
    .flatMap((row) => {
      const nested = (row as { deals: DealRow | DealRow[] | null }).deals;
      if (!nested) return [];
      return Array.isArray(nested) ? nested : [nested];
    })
    .map(rowToDeal);
  deals.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return deals;
}

/**
 * List the members of a deal. RLS limits the rows to ones the caller may see.
 * Returns [] when cloud sync is unconfigured.
 */
export async function listMembers(
  dealId: string,
  client?: SupabaseClient | null,
): Promise<DealMember[]> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("deal_members")
    .select("deal_id, user_id, role, status, invited_email, created_at")
    .eq("deal_id", dealId);
  if (error || !data) return [];
  return (data as DealMemberRow[]).map(rowToMember);
}

/**
 * Ensure the signed-in user has at least one owned deal. If they already belong
 * to any deal, returns its id (the first / newest). Otherwise creates a deal
 * owned by them plus the matching `owner_buyer` membership, and returns the new
 * deal id. Returns null when cloud sync is unconfigured or signed out.
 *
 * Idempotent at the "has any deal" granularity — it never creates a second
 * owned deal once the user has one.
 */
export async function ensureOwnDeal(
  client?: SupabaseClient | null,
): Promise<string | null> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  // Already a member of a deal? Reuse it (prefer one the user owns).
  const existing = await listMyDeals(supabase);
  if (existing.length > 0) {
    const owned = existing.find((d) => d.createdBy === userId);
    return (owned ?? existing[0]).id;
  }

  // Create the owned deal, then the owner membership (gated by RLS).
  const { data: created, error: dealErr } = await supabase
    .from("deals")
    .insert({ created_by: userId, label: DEFAULT_DEAL_LABEL })
    .select("id, created_by, label, created_at")
    .single();
  if (dealErr || !created) return null;
  const dealId = (created as DealRow).id;

  const { error: memberErr } = await supabase.from("deal_members").insert({
    deal_id: dealId,
    user_id: userId,
    role: "owner_buyer",
    status: "active",
  });
  if (memberErr) return null;

  return dealId;
}

// ---------------------------------------------------------------------------
// Member management (#75). Writes go through owner-only SECURITY DEFINER RPCs
// that also enforce last-owner protection server-side.
// ---------------------------------------------------------------------------

/** Change a member's role (owner-only, guarded against last-owner downgrade). */
export async function updateMemberRole(
  dealId: string,
  userId: string,
  role: DealRole,
  client?: SupabaseClient | null,
): Promise<{ error?: string }> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { error: "Cloud sync is not configured." };
  const { error } = await supabase.rpc("set_deal_member_role", {
    p_deal: dealId,
    p_user: userId,
    p_role: role,
  });
  return error ? { error: error.message } : {};
}

/** Revoke a member (owner-only, guarded against revoking the last owner). */
export async function revokeMember(
  dealId: string,
  userId: string,
  client?: SupabaseClient | null,
): Promise<{ error?: string }> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { error: "Cloud sync is not configured." };
  const { error } = await supabase.rpc("revoke_deal_member", {
    p_deal: dealId,
    p_user: userId,
  });
  return error ? { error: error.message } : {};
}

// ---------------------------------------------------------------------------
// Agency relationship + financial consent (#76).
// ---------------------------------------------------------------------------

/** Read the deal's agency/consent record, or null when none / unconfigured. */
export async function getDealAgency(
  dealId: string,
  client?: SupabaseClient | null,
): Promise<DealAgency | null> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("deal_agency")
    .select(
      "deal_id, agency_relationship, financial_consent, consent_captured_at, agency_captured_at, updated_at",
    )
    .eq("deal_id", dealId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToAgency(data as DealAgencyRow);
}

/**
 * Owner upserts the agency relationship + financial consent. Stamps dated
 * capture times so there is a conspicuous, dated record of what was agreed.
 * Owner-only is enforced by RLS.
 */
export async function saveDealAgency(
  dealId: string,
  input: { agencyRelationship: AgencyRelationship; financialConsent: boolean },
  client?: SupabaseClient | null,
): Promise<{ error?: string }> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { error: "Cloud sync is not configured." };

  const { data: userData } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const { error } = await supabase.from("deal_agency").upsert({
    deal_id: dealId,
    agency_relationship: input.agencyRelationship,
    financial_consent: input.financialConsent,
    agency_captured_at: now,
    consent_captured_at: input.financialConsent ? now : null,
    updated_by: userData.user?.id ?? null,
  });
  return error ? { error: error.message } : {};
}
