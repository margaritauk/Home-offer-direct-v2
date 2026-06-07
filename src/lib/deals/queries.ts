import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Deal, DealMember } from "./types";

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
