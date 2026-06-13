/**
 * Contract for the AI offer-strength explainer (issue #36).
 *
 * This is the provider seam: any AI provider (Gemini today; Claude Haiku in
 * production) implements {@link AiExplainerSource}, and everything downstream
 * (the route, the UI) depends ONLY on this interface. Swapping providers is one
 * new `source-*.ts` file plus an env value — nothing else changes.
 *
 * GROUNDING (issue #36): the explainer NEVER free-form generates. Its input
 * carries both the FHA-safe, allowlisted offer fields ({@link SafeAiInput} from
 * `src/lib/ai/screening.ts`) AND OUR deterministic offer-strength factors
 * ({@link OfferInsight}[] from `src/lib/offer/strength.ts`). The model's only job
 * is to explain OUR computed factors in plain English; it must not invent facts
 * or numbers. The {@link AiExplanation.basis} records which factors it explained,
 * so the explanation is always attributable to our own data.
 */

import type { SafeAiInput } from "@/lib/ai/screening";
import type { OfferInsight } from "@/lib/offer/strength";

/**
 * The grounded input handed to an {@link AiExplainerSource}. It pairs the
 * FHA-safe allowlisted offer projection with the deterministic strength factors
 * the model must stay grounded in. No raw {@link Offer} ever reaches a provider.
 */
export interface AiExplainerInput {
  /** FHA-safe, allowlisted offer projection (from `buildSafeAiInput`). */
  safeInput: SafeAiInput;
  /** OUR deterministic offer-strength factors the model must explain. */
  factors: OfferInsight[];
}

/**
 * A grounded explanation. `text` is the plain-English narration (already passed
 * through {@link screenOutput} by the provider); `basis` lists the factor ids it
 * explained, so the UI can cite the factor basis and we can audit grounding.
 */
export interface AiExplanation {
  text: string;
  basis: string[];
}

/**
 * The data-access contract. An implementation calls a real model (or returns
 * `null`). It must NEVER throw and NEVER fabricate: any failure (no key, non-OK
 * response, thrown error, empty/blocked output) resolves to `null`.
 */
export interface AiExplainerSource {
  explainOfferStrength(input: AiExplainerInput): Promise<AiExplanation | null>;
}
