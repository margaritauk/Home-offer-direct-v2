/**
 * Tracked AI offer-strength-explainer kill switch (issue #36).
 *
 * A single, code-level off-switch for the AI offer-strength explainer, mirroring
 * {@link isRentCastDisabled} in `src/lib/rentcast-flag.ts`. When
 * `AI_EXPLAINER_DISABLED` is set to a truthy value, the explainer seam falls back
 * to its safe default ({@link NullAiExplainer}, which returns `null`) even if
 * `AI_EXPLAINER_SOURCE` and `GEMINI_API_KEY` are still configured.
 *
 * Why a separate flag (rather than just unsetting the source vars):
 *  - It's flippable via a tracked change / env edit without disturbing the
 *    provider config, so you can cut the live AI call fast (cost spike, vendor
 *    outage, bad output, legal hold) and restore it by flipping one value back.
 *  - It's the single thing the gate checks first, so the feature can never be on
 *    while the kill switch is engaged.
 *
 * Truthy = "1" | "true" | "yes" | "on" (case-insensitive). Anything else
 * (including unset/empty) leaves the explainer enabled if otherwise configured,
 * preserving the default-off behavior.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */
export function isAiExplainerDisabled(): boolean {
  const raw = process.env.AI_EXPLAINER_DISABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
