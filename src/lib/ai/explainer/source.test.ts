import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NullAiExplainer,
  getAiExplainerSource,
  isAiExplainerActive,
} from "./source";
import { GeminiAiExplainer } from "./source-gemini";
import type { AiExplainerInput, BudgetExplainerInput } from "./types";
import type { SafeAiInput } from "@/lib/ai/screening";
import type { PitiBreakdown } from "@/lib/budget";

function input(): AiExplainerInput {
  const safe: SafeAiInput = {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    closingCostPreference: "buyer-pays",
    contingencies: {
      inspection: { included: true, days: 10 },
      appraisal: { included: true, days: 17 },
      financing: { included: true, days: 21 },
      "sale-of-home": { included: false, days: 45 },
      title: { included: true, days: 14 },
      "attorney-review": { included: true, days: 5 },
    },
    concession: { type: "price-reduction", percent: 2.5 },
  };
  return { safeInput: safe, factors: [] };
}

function budgetBreakdown(): PitiBreakdown {
  return {
    pi: 2_023,
    tax: 366,
    insurance: 125,
    hoa: 0,
    pmi: 150,
    total: 2_664,
    loanAmount: 360_000,
    ltv: 90,
  };
}

function budgetInput(): BudgetExplainerInput {
  return {
    safeInput: {
      mode: "payment",
      price: 400_000,
      downPaymentPercent: 10,
      ratePct: 6.5,
      termYears: 30,
    },
    breakdown: budgetBreakdown(),
    insights: [
      { id: "composition", title: "Driving your payment", body: "P&I is most.", tone: "info" },
    ],
  };
}

/** A well-formed Gemini generateContent payload wrapping the given text. */
function geminiResponse(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 },
  );
}

describe("isAiExplainerActive (gating)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false by default (nothing configured)", () => {
    expect(isAiExplainerActive()).toBe(false);
  });

  it("is true only with source=gemini AND a key AND not disabled", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("AI_EXPLAINER_DISABLED", "");
    expect(isAiExplainerActive()).toBe(true);
  });

  it("is false when the source is set but the key is missing", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAiExplainerActive()).toBe(false);
  });

  it("is false when a key exists but the source is not gemini", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "");
    vi.stubEnv("GEMINI_API_KEY", "k");
    expect(isAiExplainerActive()).toBe(false);
  });

  it("kill switch OVERRIDES source + key", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("AI_EXPLAINER_DISABLED", "true");
    expect(isAiExplainerActive()).toBe(false);
  });
});

describe("getAiExplainerSource", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the NullAiExplainer by default (returns null)", async () => {
    const source = getAiExplainerSource();
    expect(source).toBeInstanceOf(NullAiExplainer);
    expect(await source.explainOfferStrength(input())).toBeNull();
  });

  it("returns the GeminiAiExplainer when active", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    expect(getAiExplainerSource()).toBeInstanceOf(GeminiAiExplainer);
  });

  it("returns the NullAiExplainer when the kill switch is on", () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("AI_EXPLAINER_DISABLED", "on");
    expect(getAiExplainerSource()).toBeInstanceOf(NullAiExplainer);
  });
});

describe("explainBudget (#57) — same gating as the offer explainer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("the Null default returns null (no key/source configured)", async () => {
    const source = getAiExplainerSource();
    expect(source).toBeInstanceOf(NullAiExplainer);
    expect(await source.explainBudget(budgetInput())).toBeNull();
  });

  it("is NOT active by default — gating mirrors the offer explainer", () => {
    expect(isAiExplainerActive()).toBe(false);
  });

  it("narrates a grounded budget summary when active and the provider succeeds", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse("AI-generated estimate. Principal & interest leads your payment."),
    );

    const out = await getAiExplainerSource().explainBudget(budgetInput());
    expect(out?.text).toContain("Principal & interest");
    // Basis = the deterministic insight ids the model was asked to restate.
    expect(out?.basis).toContain("composition");
  });

  it("kill switch overrides source + key → Null → null", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.stubEnv("AI_EXPLAINER_DISABLED", "true");
    const source = getAiExplainerSource();
    expect(source).toBeInstanceOf(NullAiExplainer);
    expect(await source.explainBudget(budgetInput())).toBeNull();
  });

  it("blocks FHA-unsafe model output → null", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    // Output references a protected class → screenOutput rejects → null.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse("This budget is perfect for a young couple raising a family."),
    );
    expect(await getAiExplainerSource().explainBudget(budgetInput())).toBeNull();
  });

  it("returns null when the provider transport fails (never throws)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await getAiExplainerSource().explainBudget(budgetInput())).toBeNull();
  });
});
