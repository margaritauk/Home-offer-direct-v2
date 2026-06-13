/**
 * CLIENT surface flag for the AI offer-strength explainer (issue #36).
 *
 * Mirrors `isCompsAutofindEnabled` in `src/lib/ai/config.ts`. The offer flow
 * offers the "Explain my offer's strength (AI)" action ONLY when
 * `NEXT_PUBLIC_AI_EXPLAINER === "true"`. Default false, so the UI keeps showing
 * the "Coming soon" state.
 *
 * Decoupled from the server gate ({@link isAiExplainerActive}): the UI deciding
 * to OFFER the action does NOT mean the server is configured — the route still
 * gates independently and returns `{ available:false }` when it isn't. So this
 * flag alone never turns the feature on.
 *
 * Safe to import from client components (reads only a `NEXT_PUBLIC_` var).
 */
export function isAiExplainerOffered(): boolean {
  return process.env.NEXT_PUBLIC_AI_EXPLAINER === "true";
}
