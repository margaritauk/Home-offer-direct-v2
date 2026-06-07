/**
 * Field-level financial scoping (#77). The single pure predicate that decides
 * whether a given member may see the buyer's financial facets (budget; offer
 * financing details). Mirrors the `can_see_deal_financials` SQL helper and the
 * `deal_financials` RLS policy EXACTLY, so the UI redacts the same data the DB
 * withholds. Default-deny.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DealRole } from "./types";

/** Editor-ish roles that MAY see financials once consent is given (not viewer). */
const FINANCIAL_ELIGIBLE_ROLES: readonly DealRole[] = [
  "co_buyer",
  "agent",
  "attorney",
];

/**
 * May a member with `role` see the buyer's financial data?
 *
 * - The owner always sees their own data (`isOwner`).
 * - Otherwise, financials are shared ONLY when the buyer has given explicit
 *   `consent` AND the member's role is editor-ish (co_buyer / agent / attorney).
 * - `viewer` never sees financials, even with consent.
 * - No consent → not shared (default-deny).
 */
export function canSeeFinancials(
  role: DealRole,
  consent: boolean,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;
  if (!consent) return false;
  return FINANCIAL_ELIGIBLE_ROLES.includes(role);
}

/** The buyer's scoped financial facets (budget + offer financing details). */
export interface DealFinancials {
  budget: unknown;
  financing: unknown;
}

interface DealFinancialsRow {
  deal_id: string;
  budget: unknown;
  financing: unknown;
  updated_at: string;
}

/**
 * Fetch the deal's financials. RLS (`deal_financials scoped select`) returns no
 * row to a member who isn't allowed to see them, so a `null` result is the
 * SECOND line of defense behind {@link canSeeFinancials} — the data never even
 * leaves the DB for a non-consented member. Returns null when unconfigured.
 */
export async function fetchDealFinancials(
  dealId: string,
  client?: SupabaseClient | null,
): Promise<DealFinancials | null> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("deal_financials")
    .select("deal_id, budget, financing, updated_at")
    .eq("deal_id", dealId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as DealFinancialsRow;
  return { budget: row.budget ?? null, financing: row.financing ?? null };
}

/** Owner upserts their financials (owner-only via RLS). */
export async function pushDealFinancials(
  dealId: string,
  input: DealFinancials,
  client?: SupabaseClient | null,
): Promise<{ error?: string }> {
  const supabase = client ?? getSupabaseClient();
  if (!supabase) return { error: "Cloud sync is not configured." };
  const { error } = await supabase.from("deal_financials").upsert({
    deal_id: dealId,
    budget: input.budget ?? null,
    financing: input.financing ?? null,
  });
  return error ? { error: error.message } : {};
}
