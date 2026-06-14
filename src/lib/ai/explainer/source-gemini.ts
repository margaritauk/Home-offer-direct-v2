/**
 * Gemini AI offer-strength explainer (issue #36) — a PROTOTYPE/free-tier
 * provider behind the {@link AiExplainerSource} seam. It mirrors the proven
 * RentCast/comps connector shape (`source-rentcast.ts`, `comps-ai.ts`): a set of
 * small PURE functions (prompt builder + response mapper) plus a server-only
 * `fetch` that reads the API key from `process.env.GEMINI_API_KEY`, sends it as
 * the `x-goog-api-key` header, and returns `null` on ANY failure rather than
 * throwing.
 *
 * Server-only: the key is NEVER hardcoded, logged, exposed to the browser, or
 * prefixed `NEXT_PUBLIC_`.
 *
 * GROUNDING + GUARDRAILS (issues #35/#36):
 *   - The prompt is GROUNDED in OUR deterministic strength factors — the model
 *     explains the factors we computed, in plain English; it must not invent
 *     facts or numbers, give legal/financial advice (UPL), state acceptance odds
 *     or guarantees, or reference any protected class / write a love letter (FHA).
 *   - The model OUTPUT is gated through {@link screenOutput}; if not safe the
 *     explainer returns `null` (blocked) so nothing unsafe reaches the buyer.
 *
 * PRODUCTION NOTE: swap to Claude Haiku via a `source-claude.ts` behind this same
 * seam; legal sign-off gates going live.
 */

import { screenOutput, type SafeAiInput } from "@/lib/ai/screening";
import type { OfferInsight } from "@/lib/offer/strength";
import type { BudgetInsight } from "@/lib/budget-explainer";
import type {
  AiExplainerInput,
  AiExplainerSource,
  AiExplanation,
  BudgetExplainerInput,
  SafeBudgetInput,
} from "./types";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * The strict system instruction. It nails down the non-negotiables: explain OUR
 * factors only, in plain English; never advise (UPL); never state acceptance
 * odds or guarantees; never invent numbers; never reference a protected class or
 * write a personal appeal (FHA); label the output as educational.
 *
 * Exported so a test can assert the labeling/UPL/FHA constraints are present.
 * PURE — a constant, no network, no env.
 */
export const GEMINI_SYSTEM_INSTRUCTION = [
  "You are an educational assistant for an UNREPRESENTED home buyer.",
  "Your ONLY job is to explain, in plain English, the offer-strength factors we",
  "have ALREADY computed and provide to you. You restate and clarify our factors;",
  "you do not analyze beyond them.",
  "",
  "HARD RULES — you must follow every one:",
  "1. Explain ONLY the factors provided below. Do NOT invent, add, or infer any",
  "   factor, fact, or number that is not in the provided data. Do NOT compute or",
  "   state new numbers.",
  "2. This is EDUCATION ONLY. It is NOT legal advice and NOT financial advice.",
  "   Never tell the buyer what to offer, what to waive, what price to pick, or",
  "   what to do. Never use directive language ('you should', 'I recommend',",
  "   'you must'). Describe trade-offs neutrally and route decisions to a licensed",
  "   attorney or other professional.",
  "3. Never state or imply the odds a seller will accept, and never promise or",
  "   guarantee any outcome. There is NO acceptance guarantee.",
  "4. Never reference or infer any protected class (race, color, religion,",
  "   national origin, sex, familial status, disability, age, marital status,",
  "   source of income) and never write a personal appeal or 'love letter' to the",
  "   seller. Stick strictly to neutral transaction and market facts.",
  "5. Begin your response by noting it is an educational summary, not advice.",
  "",
  "Write 2-4 short, plain-English paragraphs (or a short bulleted list) that",
  "summarize the provided factors. No markdown headings, no JSON.",
].join("\n");

/**
 * Build the grounded user prompt: the FHA-safe allowlisted input plus OUR
 * deterministic factors, embedded as structured JSON so the model can only
 * restate them. PURE — no network, no env. Fully unit-testable.
 */
export function buildGeminiPrompt(input: AiExplainerInput): string {
  return [
    "Here is the buyer's offer (allowlisted, FHA-safe transaction terms only):",
    JSON.stringify(serializeSafeInput(input.safeInput), null, 2),
    "",
    "Here are the offer-strength factors WE computed. Explain ONLY these, in",
    "plain English. Do not add or invent any factor or number:",
    JSON.stringify(serializeFactors(input.factors), null, 2),
  ].join("\n");
}

function serializeSafeInput(safe: SafeAiInput): Record<string, unknown> {
  // A flat, neutral projection. We never pass anything off the allowlist; this
  // simply formats the already-safe object for the prompt.
  return {
    price: safe.price,
    earnestMoney: safe.earnestMoney,
    earnestIsPercent: safe.isPercent,
    financingType: safe.financingType,
    downPaymentPercent: safe.downPaymentPercent,
    closingDate: safe.closingDate,
    possession: safe.possession,
    closingCostPreference: safe.closingCostPreference,
    contingencies: safe.contingencies,
    concession: safe.concession,
    ...(safe.market ? { market: safe.market } : {}),
  };
}

function serializeFactors(
  factors: OfferInsight[],
): { id: string; title: string; detail: string; tone: string }[] {
  return factors.map((f) => ({
    id: f.id,
    title: f.title,
    detail: f.body,
    tone: f.tone,
  }));
}

// ---------------------------------------------------------------------------
// Budget explainer (issue #57) — same seam, same transport, same screenOutput.
// ---------------------------------------------------------------------------

/**
 * The strict system instruction for the BUDGET explainer (#57). The model
 * NARRATES the figures we already computed — it never calculates, recommends a
 * loan or lender, quotes a rate as an offer, or steers. It explains what's
 * driving the payment, where there's headroom, and what to watch.
 *
 * Exported so a test can assert the UPL/SAFE-Act, no-advice, no-lender, FHA, and
 * labeling constraints are present. PURE — a constant, no network, no env.
 */
export const GEMINI_BUDGET_SYSTEM_INSTRUCTION = [
  "You are an educational assistant for an UNREPRESENTED home buyer.",
  "Your ONLY job is to explain, in plain English, the budget numbers we have",
  "ALREADY computed and provide to you (the monthly PITI breakdown — principal,",
  "interest, taxes, insurance, PMI, HOA — plus any affordability max price and",
  "debt-to-income figures). You restate and clarify OUR numbers; you do not",
  "calculate anything yourself.",
  "",
  "HARD RULES — you must follow every one:",
  "1. NARRATE ONLY the numbers provided below. Do NOT compute, re-derive, add, or",
  "   invent any number, payment, rate, or figure that is not in the provided",
  "   data. If a number is not provided, do not state it.",
  "2. This is EDUCATION ONLY. It is NOT legal advice and NOT financial advice.",
  "   Never tell the buyer what to do, what price to pick, how much to put down,",
  "   or what they can afford. Never use directive language ('you should', 'I",
  "   recommend', 'you must').",
  "3. Do NOT recommend, suggest, name, or rank any loan product, loan program, or",
  "   lender, and do NOT quote, suggest, or present an interest rate as an offer",
  "   or as something available — the rate shown is the buyer's own input that you",
  "   are merely restating. Never steer the buyer toward any choice.",
  "4. Explain what is DRIVING the payment (which parts are largest), where there",
  "   is HEADROOM (e.g. relative to the debt-to-income guideline we provide), and",
  "   what to WATCH (e.g. PMI while the loan-to-value is above 80%). Keep it",
  "   neutral and descriptive.",
  "5. Never reference or infer any protected class (race, color, religion,",
  "   national origin, sex, familial status, disability, age, marital status,",
  "   source of income) and never write a personal appeal or 'love letter'. Stick",
  "   strictly to the neutral financial figures provided.",
  "6. Begin your response by noting it is an educational estimate, not financial",
  "   advice, and that the buyer should confirm with a licensed lender.",
  "",
  "Write 2-4 short, plain-English paragraphs (or a short bulleted list) that",
  "summarize the provided figures. No markdown headings, no JSON.",
].join("\n");

function serializeSafeBudgetInput(safe: SafeBudgetInput): Record<string, unknown> {
  return {
    mode: safe.mode,
    price: safe.price,
    downPaymentPercent: safe.downPaymentPercent,
    // The rate is the buyer's OWN input we are restating — never an offer.
    ratePct: safe.ratePct,
    termYears: safe.termYears,
    ...(safe.grossMonthlyIncome !== undefined
      ? { grossMonthlyIncome: safe.grossMonthlyIncome }
      : {}),
    ...(safe.monthlyDebts !== undefined ? { monthlyDebts: safe.monthlyDebts } : {}),
    ...(safe.note ? { note: safe.note } : {}),
  };
}

function serializeBudgetInsights(
  insights: BudgetInsight[],
): { id: string; title: string; detail: string; tone: string }[] {
  return insights.map((i) => ({
    id: i.id,
    title: i.title,
    detail: i.body,
    tone: i.tone,
  }));
}

/**
 * Build the grounded user prompt for the budget explainer: the financial-only
 * safe input, the computed PITI breakdown, the optional affordability summary,
 * and OUR deterministic insights — all as structured JSON so the model can only
 * restate them. PURE — no network, no env. Fully unit-testable.
 */
export function buildBudgetPrompt(input: BudgetExplainerInput): string {
  return [
    "Here are the buyer's budget inputs (financial-only transaction terms):",
    JSON.stringify(serializeSafeBudgetInput(input.safeInput), null, 2),
    "",
    "Here is the monthly payment breakdown WE computed (all dollars except ltv,",
    "which is a percent). Narrate ONLY these numbers; do not recompute them:",
    JSON.stringify(
      {
        principalAndInterest: input.breakdown.pi,
        propertyTax: input.breakdown.tax,
        insurance: input.breakdown.insurance,
        hoa: input.breakdown.hoa,
        pmi: input.breakdown.pmi,
        totalMonthly: input.breakdown.total,
        loanAmount: input.breakdown.loanAmount,
        ltv: input.breakdown.ltv,
      },
      null,
      2,
    ),
    ...(input.affordability
      ? [
          "",
          "Here is the affordability solve WE computed. Narrate ONLY these numbers:",
          JSON.stringify(
            {
              maxPrice: input.affordability.maxPrice,
              maxLoan: input.affordability.maxLoan,
              bindingConstraint: input.affordability.bindingConstraint,
            },
            null,
            2,
          ),
        ]
      : []),
    "",
    "Here are the plain-English insights WE derived from these numbers. Explain",
    "ONLY these, in plain English. Do not add or invent any number:",
    JSON.stringify(serializeBudgetInsights(input.insights), null, 2),
  ].join("\n");
}

/**
 * Build the full Gemini request body for the budget explainer. PURE — composes
 * {@link GEMINI_BUDGET_SYSTEM_INSTRUCTION} and {@link buildBudgetPrompt}.
 */
export function buildBudgetRequestBody(
  input: BudgetExplainerInput,
): GeminiRequestBody {
  return {
    systemInstruction: { parts: [{ text: GEMINI_BUDGET_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: buildBudgetPrompt(input) }] }],
  };
}

/** The Gemini `generateContent` request body shape (the subset we send). */
export interface GeminiRequestBody {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
}

/**
 * Build the full Gemini request body from our grounded input. PURE — composes
 * {@link GEMINI_SYSTEM_INSTRUCTION} and {@link buildGeminiPrompt}.
 */
export function buildGeminiRequestBody(
  input: AiExplainerInput,
): GeminiRequestBody {
  return {
    systemInstruction: { parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: buildGeminiPrompt(input) }] }],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * PURE mapper: a Gemini `generateContent` payload → the model's text, or `null`
 * when it's missing/empty/garbage. Defensive against every shape:
 * `candidates[0].content.parts[].text` is concatenated; anything else → null.
 * Never throws.
 *
 * Gemini response schema (relevant subset):
 *   {
 *     candidates: [
 *       { content: { parts: [ { text: "..." }, ... ], role: "model" } },
 *       ...
 *     ]
 *   }
 */
export function mapGeminiResponse(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  const candidates = payload.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const first = candidates[0];
  if (!isRecord(first)) return null;

  const content = first.content;
  if (!isRecord(content)) return null;

  const parts = content.parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((p) => (isRecord(p) && typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

/**
 * Live Gemini explainer. Server-only. Reads the API key from env and POSTs to
 * the Gemini REST `generateContent` endpoint. Returns `null` on ANY failure
 * (missing key, non-OK response, thrown error, empty/unparseable body) and on a
 * model output that the FHA {@link screenOutput} gate rejects — it never throws
 * and never fabricates.
 */
export class GeminiAiExplainer implements AiExplainerSource {
  /**
   * Shared server-only transport: POST a prebuilt request body to Gemini and map
   * + FHA-screen the response. Returns the safe model text or `null` on ANY
   * failure (missing key, non-OK, thrown error, empty/unparseable, blocked).
   * Never throws, never fabricates. Used by BOTH explainers so the connector,
   * key handling, and {@link screenOutput} gate live in exactly one place.
   */
  private async generate(body: GeminiRequestBody): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    // No key → we can't call the model; return null rather than guess.
    if (!apiKey) return null;

    const model = (process.env.GEMINI_MODEL ?? "").trim() || DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`;

    let text: string | null;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Server secret — sent only as a header, NEVER logged or exposed.
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      text = mapGeminiResponse(await res.json());
    } catch {
      return null;
    }

    // Empty / unparseable model output → nothing to show.
    if (!text) return null;

    // FHA OUTPUT gate (#35 AC3): reject wholesale if the response references a
    // protected class or reads like a personal appeal. Blocked → null.
    if (!screenOutput(text).safe) return null;

    return text;
  }

  async explainOfferStrength(
    input: AiExplainerInput,
  ): Promise<AiExplanation | null> {
    const text = await this.generate(buildGeminiRequestBody(input));
    if (!text) return null;
    return { text, basis: input.factors.map((f) => f.id) };
  }

  async explainBudget(
    input: BudgetExplainerInput,
  ): Promise<AiExplanation | null> {
    const text = await this.generate(buildBudgetRequestBody(input));
    if (!text) return null;
    // Basis = the deterministic insight ids we asked the model to restate.
    return { text, basis: input.insights.map((i) => i.id) };
  }
}
