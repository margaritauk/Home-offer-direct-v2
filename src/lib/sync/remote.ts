import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultOffsets } from "@/lib/deadlines";
import type { SyncData } from "./types";

const TABLE = "user_data";

interface UserDataRow {
  user_id: string;
  progress: Record<string, boolean> | null;
  state_code: string | null;
  tracker: SyncData["tracker"] | null;
  // Added in migration 0002 — may be absent on older databases.
  offer?: SyncData["offer"];
  showings?: SyncData["showings"];
  // Added in migration 0003 — may be absent on older databases.
  offer_status?: SyncData["offerStatus"];
}

function rowToSyncData(row: UserDataRow): SyncData {
  return {
    progress: row.progress ?? {},
    stateCode: row.state_code ?? null,
    tracker: {
      underContractDate: row.tracker?.underContractDate ?? "",
      closingDate: row.tracker?.closingDate ?? "",
      offsets: { ...defaultOffsets, ...(row.tracker?.offsets ?? {}) },
      docs: row.tracker?.docs ?? {},
    },
    offer: row.offer ?? null,
    showings: row.showings ?? {},
    offerStatus: row.offer_status ?? {},
  };
}

/**
 * Fetch the signed-in user's row, or null if they have none yet.
 * Uses `select("*")` so it stays resilient if the optional `offer`/`showings`
 * columns (migration 0002) aren't present yet — they just come back undefined.
 */
export async function fetchRemote(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncData | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSyncData(data as UserDataRow);
}

/**
 * Upsert the signed-in user's row.
 *
 * Done in two steps so cloud sync keeps working on databases that predate
 * migration 0002: the base columns always persist; `offer`/`showings` are a
 * best-effort follow-up that silently no-ops if those columns don't exist yet.
 */
export async function pushRemote(
  supabase: SupabaseClient,
  userId: string,
  data: SyncData,
): Promise<{ error?: string }> {
  const { error } = await supabase.from(TABLE).upsert({
    user_id: userId,
    progress: data.progress,
    state_code: data.stateCode,
    tracker: data.tracker,
  });
  if (error) return { error: error.message };

  // Best-effort: only lands once the offer/showings/offer_status columns exist
  // (migrations 0002 + 0003). Base sync above already succeeded regardless.
  try {
    await supabase
      .from(TABLE)
      .update({
        offer: data.offer,
        showings: data.showings,
        offer_status: data.offerStatus,
      })
      .eq("user_id", userId);
  } catch {
    /* columns not migrated yet — base sync already succeeded */
  }
  return {};
}
