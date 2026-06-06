/**
 * Cloud sync is entirely optional. When the Supabase env vars are absent the app
 * behaves exactly as before — local-only via localStorage, account UI hidden.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isCloudSyncEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
