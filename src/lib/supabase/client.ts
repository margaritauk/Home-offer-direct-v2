"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isCloudSyncEnabled } from "./config";

let cached: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase client, or null when cloud sync is not
 * configured (no env vars). Callers must handle the null case.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isCloudSyncEnabled()) return null;
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
