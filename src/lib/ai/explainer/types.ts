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
import type { PitiBreakdown } from "@/lib/budget";
import type { BudgetInsight } from "@/lib/budget-explainer";

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
 * GROUNDING (issue #57): the budget explainer NARRATES the numbers
 * `src/lib/budget.ts` ALREADY computed — it never calculates. Its input carries
 * a FINANCIAL-ONLY, FHA-neutral-by-construction safe projection
 * ({@link SafeBudgetInput} from `buildSafeBudgetInput`), the computed
 * {@link PitiBreakdown} (principal, interest, taxes, insurance, PMI, HOA + LTV),
 * an optional affordability summary (max price / DTI / binding cap), and OUR
 * deterministic {@link BudgetInsight}[] (from `lib/budget-explainer.ts`). The
 * model's only job is to restate those figures in plain English; it must not
 * compute, recommend a loan/lender, quote a rate-as-offer, or steer.
 */

/**
 * The mode the budget figures came from: a fixed monthly-payment estimate, or
 * the affordability solve ("how much house can I afford").
 */
export type BudgetMode = "payment" | "affordability";

/**
 * A FINANCIAL-ONLY, FHA-neutral-by-construction projection of the buyer's budget
 * inputs. There are NO demographic fields by construction; any free-text note is
 * screened by {@link buildSafeBudgetInput}. This is the budget analogue of
 * {@link SafeAiInput}.
 */
export interface SafeBudgetInput {
  mode: BudgetMode;
  /** Home price in dollars (payment mode) or solved max price (affordability). */
  price: number;
  /** Down payment as a percent of price. */
  downPaymentPercent: number;
  /** Annual interest rate as a percent. NARRATED only — never quoted as an offer. */
  ratePct: number;
  /** Loan term in years. */
  termYears: number;
  /** Gross monthly income in dollars, when known (affordability mode). */
  grossMonthlyIncome?: number;
  /** Existing monthly debt payments in dollars, when known. */
  monthlyDebts?: number;
  /** Optional, neutral free-text note about the budget. Screened. */
  note?: string;
}

/** The affordability summary the budget engine already solved, when in that mode. */
export interface BudgetAffordabilitySummary {
  /** Max affordable home price in dollars. */
  maxPrice: number;
  /** Max loan amount in dollars. */
  maxLoan: number;
  /** Which DTI cap binds the budget. */
  bindingConstraint: "front" | "back";
}

/**
 * The grounded input handed to {@link AiExplainerSource.explainBudget}. It pairs
 * the FINANCIAL-ONLY safe projection with the deterministic figures the model
 * must stay grounded in (the computed PITI breakdown, our budget insights, and
 * the optional affordability summary). No raw form state ever reaches a provider.
 */
export interface BudgetExplainerInput {
  /** FINANCIAL-ONLY, FHA-neutral safe projection (from `buildSafeBudgetInput`). */
  safeInput: SafeBudgetInput;
  /** OUR computed PITI breakdown — the numbers the model narrates, never recomputes. */
  breakdown: PitiBreakdown;
  /** OUR deterministic budget insights the model restates in plain English. */
  insights: BudgetInsight[];
  /** OUR affordability solve, when the figures came from affordability mode. */
  affordability?: BudgetAffordabilitySummary;
}

/**
 * GROUNDING (S7-AI2) — PRICE BAND. The A2 suggested-range surface is the MOST
 * directive-prone feature in the product, so this is the most conservatively
 * grounded explainer. The model narrates the RANGE + rationale that
 * `suggestPriceBand` (`lib/offer/suggested-price.ts`) ALREADY produced — comps +
 * the market read suggest a range; the BUYER decides. It must NEVER say
 * "offer $X", never pick a single number, and never tell the buyer what to do.
 *
 * The input carries ONLY objective price/market facts already in the band: the
 * comp-anchored low/high/mid, where the market read leans, our rationale lines,
 * and the basis flags. There is NO demographic field by construction.
 */
export interface SafePriceBandInput {
  /** Comp-anchored low end (dollars), or null when there are no comps. */
  low: number | null;
  /** Comp-anchored high end (dollars), or null when there are no comps. */
  high: number | null;
  /** Comps midpoint, for transparency, or null. */
  mid: number | null;
  /** Where the market read leans within the band ("lower"|"middle"|"upper"|"none"). */
  emphasis: string;
  /** Whether comps / a market read were present. */
  basis: { hasComps: boolean; hasMarket: boolean };
  /** True when the comp set is thin/weak — confidence is limited. */
  lowConfidence: boolean;
}

/**
 * The grounded input handed to {@link AiExplainerSource.explainPriceBand}. It
 * pairs the objective price-band projection with OUR deterministic rationale
 * lines the model must restate. No raw form state ever reaches a provider.
 */
export interface PriceBandExplainerInput {
  /** Objective, comp-anchored price-band projection (no demographic field). */
  safeInput: SafePriceBandInput;
  /** OUR deterministic rationale lines — facts + trade-offs, never a directive. */
  rationale: string[];
}

/**
 * GROUNDING (S7-AI2) — DISCLOSURE. The model narrates OUR state-aware disclosure
 * red-flag checklist (`buildDisclosureChecklist`) in plain English: what to look
 * for and what to ask. It must NEVER interpret legal sufficiency ("this is a
 * defect, rescind") and NEVER describe the neighborhood's PEOPLE — only the
 * PROPERTY's condition (FHA). Every category routes back to a licensed pro.
 */
export interface SafeDisclosureCategory {
  id: string;
  label: string;
  whatToLookFor: string;
  askYourPro: string;
}

export interface DisclosureExplainerInput {
  /** The state's disclosure regime (e.g. "statutory-form"|"limited"). */
  regime: string;
  /** The mandated/standard form name, when the state has one. */
  formName?: string;
  /** Plain-English expectation-setting intro for this state's regime. */
  intro: string;
  /** True for caveat-emptor-leaning states — "silence is not a guarantee". */
  caveatEmptorWarning: boolean;
  /** OUR red-flag categories the model restates (property condition only). */
  categories: SafeDisclosureCategory[];
}

/**
 * The data-access contract. An implementation calls a real model (or returns
 * `null`). It must NEVER throw and NEVER fabricate: any failure (no key, non-OK
 * response, thrown error, empty/blocked output) resolves to `null`.
 */
export interface AiExplainerSource {
  explainOfferStrength(input: AiExplainerInput): Promise<AiExplanation | null>;
  /**
   * Narrate (never compute) the budget figures `lib/budget.ts` already produced.
   * Issue #57. Returns `null` on any failure or blocked/empty output.
   */
  explainBudget(input: BudgetExplainerInput): Promise<AiExplanation | null>;
  /**
   * Narrate (never decide) the A2 suggested price RANGE + rationale
   * `suggestPriceBand` already produced. S7-AI2 — the most conservatively
   * grounded surface: "comps + the market suggest a range; you decide," NEVER
   * "offer $X." Returns `null` on any failure or blocked/empty output.
   */
  explainPriceBand(
    input: PriceBandExplainerInput,
  ): Promise<AiExplanation | null>;
  /**
   * Narrate (never adjudicate) OUR state-aware disclosure red-flag checklist.
   * S7-AI2. Returns `null` on any failure or blocked/empty output.
   */
  explainDisclosure(
    input: DisclosureExplainerInput,
  ): Promise<AiExplanation | null>;
}
