import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultOffsets } from "@/lib/deadlines";
import type { SyncData } from "./types";

const TABLE = "user_data";

interface UserDataRow {
  user_id: string;
  progress: Record<string, boolean> | null;
  state_code: string | null;
  tracker: SyncData["tracker"] | null;
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
  };
}

/** Fetch the signed-in user's row, or null if they have none yet. */
export async function fetchRemote(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncData | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id, progress, state_code, tracker")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSyncData(data as UserDataRow);
}

/** Upsert the signed-in user's row with the given data. */
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
  return error ? { error: error.message } : {};
}
