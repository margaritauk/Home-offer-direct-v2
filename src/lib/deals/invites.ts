import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DealInvite, DealRole } from "./types";
import { isInvitableRole, isValidEmail, normalizeEmail } from "./invite-utils";

// ---------------------------------------------------------------------------
// Row mapper (pure).
// ---------------------------------------------------------------------------

interface DealInviteRow {
  id: string;
  deal_id: string;
  email: string;
  role: DealRole;
  status: DealInvite["status"];
  expires_at: string;
  created_by: string;
  created_at: string;
}

export function rowToInvite(row: DealInviteRow): DealInvite {
  return {
    id: row.id,
    dealId: row.deal_id,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Client operations (no-op-safe when cloud sync is unconfigured / signed out).
// ---------------------------------------------------------------------------

/**
 * Owner invites an email to a deal with a role. Validates client-side (the
 * SECURITY DEFINER `invite_to_deal` RPC re-validates + enforces owner-only).
 * Returns the new invite id, or an error string.
 */
export async function inviteToDeal(
  dealId: string,
  email: string,
  role: DealRole,
  client?: SupabaseClient | null,
): Promise<{ id?: string; error?: string }> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { error: "Cloud sync is not configured." };
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  if (!isInvitableRole(role)) return { error: "Choose a valid role." };

  const { data, error } = await supabase.rpc("invite_to_deal", {
    p_deal: dealId,
    p_email: normalizeEmail(email),
    p_role: role,
  });
  if (error) return { error: error.message };
  return { id: (data as string) ?? undefined };
}

/**
 * List the invites for a deal. RLS limits rows to ones the caller may see
 * (owner sees all for their deal; an invitee sees invites for their email).
 * Returns [] when unconfigured.
 */
export async function listDealInvites(
  dealId: string,
  client?: SupabaseClient | null,
): Promise<DealInvite[]> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("deal_invites")
    .select("id, deal_id, email, role, status, expires_at, created_by, created_at")
    .eq("deal_id", dealId);
  if (error || !data) return [];
  return (data as DealInviteRow[]).map(rowToInvite);
}

/**
 * List the pending invitations addressed to the signed-in user (across all
 * deals), so they can see what they were invited to. RLS scopes by email.
 */
export async function listMyPendingInvites(
  client?: SupabaseClient | null,
): Promise<DealInvite[]> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("deal_invites")
    .select("id, deal_id, email, role, status, expires_at, created_by, created_at")
    .eq("status", "pending");
  if (error || !data) return [];
  return (data as DealInviteRow[]).map(rowToInvite);
}

/**
 * Claim every pending, non-expired invite matching the caller's email — joins
 * the deals as an active member. Idempotent and safe to call on every sign-in.
 * Returns the number of invites claimed (0 when unconfigured / signed out).
 */
export async function claimInvites(
  client?: SupabaseClient | null,
): Promise<number> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("claim_deal_invites");
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}
