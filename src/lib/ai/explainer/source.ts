/**
 * AI offer-strength-explainer seam (issue #36). Server-only.
 *
 * ALL explainer calls go through {@link getAiExplainerSource}. Two
 * implementations sit behind the {@link AiExplainerSource} contract, mirroring
 * the listings/comps RentCast seam:
 *   - {@link NullAiExplainer} — the DEFAULT. Returns `null`, so with nothing
 *     configured the route reports `available:false` and the UI stays
 *     "Coming soon".
 *   - {@link GeminiAiExplainer} — the real (free-tier prototype) provider,
 *     selected ONLY when `AI_EXPLAINER_SOURCE === "gemini"` AND `GEMINI_API_KEY`
 *     is set AND the {@link isAiExplainerDisabled} kill switch is OFF.
 *
 * Provider-agnostic: adding Claude Haiku in production is one new `source-*.ts`
 * plus a new `AI_EXPLAINER_SOURCE` value here — nothing downstream changes.
 *
 * Server-only: reads non-public `process.env`. Never imported by client code.
 */

import { isAiExplainerDisabled } from "./explainer-flag";
import { GeminiAiExplainer } from "./source-gemini";
import type {
  AiExplainerInput,
  AiExplainerSource,
  AiExplanation,
} from "./types";

/**
 * The safe default: explains nothing. Returns `null` so callers degrade to
 * "unavailable" with no network call and no fabrication.
 */
export class NullAiExplainer implements AiExplainerSource {
  async explainOfferStrength(
    _input: AiExplainerInput,
  ): Promise<AiExplanation | null> {
    void _input;
    return null;
  }
}

/**
 * Whether the real AI explainer is active (server-only). True ONLY when the kill
 * switch is off AND the source is selected AND its key is present. Without the
 * key we fall back to the Null source rather than wire up a provider that can't
 * call the model.
 */
export function isAiExplainerActive(): boolean {
  return (
    !isAiExplainerDisabled() &&
    process.env.AI_EXPLAINER_SOURCE === "gemini" &&
    Boolean(process.env.GEMINI_API_KEY)
  );
}

/**
 * The seam (server-only). Returns the {@link GeminiAiExplainer} when the feature
 * is active, otherwise the {@link NullAiExplainer}.
 */
export function getAiExplainerSource(): AiExplainerSource {
  if (isAiExplainerActive()) {
    return new GeminiAiExplainer();
  }
  return new NullAiExplainer();
}
