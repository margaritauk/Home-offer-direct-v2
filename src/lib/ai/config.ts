/**
 * Gating flags for the AI "auto-find comps" feature (issue #104).
 *
 * Mirrors the supabase/config.ts flag pattern (`isCloudSyncEnabled`,
 * `isDealsEnabled`). The feature is DORMANT by default: with no env set the
 * worksheet's per-home "Auto-find comps with AI" option stays disabled /
 * "Coming soon" exactly as it shipped in #103. These flags are the seam that can
 * light it up later — they do not turn it on.
 */

/**
 * SERVER gate. The route may only call the model when BOTH:
 *   1. an Anthropic API key is present (`ANTHROPIC_API_KEY`), and
 *   2. a real data source is configured (`COMPS_DATA_SOURCE` is set to a
 *      non-empty value) — without a real source there are no real candidate
 *      sales to rank, and we never fabricate comps.
 *
 * Default false. Server-only: reads non-public env vars.
 */
export function isAiCompsConfigured(): boolean {
  return (
    Boolean(process.env.ANTHROPIC_API_KEY) &&
    Boolean((process.env.COMPS_DATA_SOURCE ?? "").trim())
  );
}

/**
 * SERVER gate (issue #169). True when a REAL comps data source is selected and
 * its key is present — regardless of whether a Claude key exists. This is what
 * lets real comps work WITHOUT an Anthropic key: the route can fetch real
 * candidates and rank them deterministically.
 *
 * Currently the only real source is RentCast (`COMPS_DATA_SOURCE === "rentcast"`
 * + `RENTCAST_API_KEY`). Default false. Server-only: reads non-public env vars.
 */
export function isCompsSourceConfigured(): boolean {
  return (
    process.env.COMPS_DATA_SOURCE === "rentcast" &&
    Boolean(process.env.RENTCAST_API_KEY)
  );
}

/**
 * CLIENT surface gate (issue #169). The UI offers the REAL "Auto-find comps"
 * button (which POSTs the route and populates genuine comps, with NO sample
 * banner) only when `NEXT_PUBLIC_COMPS_AUTOFIND === "true"`. Default false.
 * Decoupled from the server gate: the server still gates independently and
 * returns 503 when nothing is configured.
 */
export function isCompsAutofindEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COMPS_AUTOFIND === "true";
}

/**
 * CLIENT surface gate. The UI offers the "Auto-find comps with AI" button only
 * when `NEXT_PUBLIC_AI_COMPS_ENABLED === "true"`. Default false, so the UI keeps
 * showing "Coming soon". This is decoupled from {@link isAiCompsConfigured}: the
 * UI deciding to offer the button does NOT mean the server is configured — the
 * route still gates independently and returns 503 if not configured.
 */
export function isAiCompsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_COMPS_ENABLED === "true";
}

/**
 * CLIENT demo gate (issue #127). When `NEXT_PUBLIC_COMPS_DEMO === "true"`, the
 * worksheet offers an "Auto-find comps (sample data)" option that runs entirely
 * client-side against {@link SampleCompsDataSource} + {@link rankComps} — NO API
 * call, NO Claude key, NO paid data feed.
 *
 * This is SEPARATE from the real AI path ({@link isAiCompsConfigured} /
 * {@link isAiCompsEnabled}): it produces ILLUSTRATIVE sample comps that are
 * always visibly labeled "Sample data — illustrative, not real sales". Default
 * false. The real AI path, when enabled, takes precedence over this demo mode.
 */
export function isCompsDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COMPS_DEMO === "true";
}
