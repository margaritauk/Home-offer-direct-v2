/**
 * Cloud sync is entirely optional. When the Supabase env vars are absent the app
 * behaves exactly as before — local-only via localStorage, account UI hidden.
 *
 * We normalize the URL defensively: trim whitespace/newlines and strip any
 * trailing slash, since a trailing slash makes the client build double-slashed
 * paths (e.g. `…supabase.co//auth/v1/…`) that the API gateway rejects with
 * "Invalid path specified in request URL".
 */

export function normalizeUrl(raw: string | undefined): string {
  let url = (raw ?? "").trim().replace(/\/+$/, "");
  // Tolerate someone pasting a Supabase sub-API endpoint (e.g. the "Data API"
  // REST URL `…/rest/v1`) instead of the bare project URL — supabase-js appends
  // these segments itself, so they must not be in the base URL.
  url = url.replace(/\/(rest|auth|storage|realtime)\/v\d+$/i, "");
  return url.replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function isCloudSyncEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

