import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NullAiExplainer,
  getAiExplainerSource,
  isAiExplainerActive,
} from "./source";
import { GeminiAiExplainer } from "./source-gemini";
import type { AiExplainerInput } from "./types";
import type { SafeAiInput } from "@/lib/ai/screening";

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
