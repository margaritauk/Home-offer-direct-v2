import { describe, expect, it } from "vitest";
import {
  GEMINI_SYSTEM_INSTRUCTION,
  buildGeminiPrompt,
  buildGeminiRequestBody,
  mapGeminiResponse,
} from "./source-gemini";
import type { AiExplainerInput } from "./types";
import type { SafeAiInput } from "@/lib/ai/screening";
import type { OfferInsight } from "@/lib/offer/strength";

function safeInput(overrides: Partial<SafeAiInput> = {}): SafeAiInput {
  return {
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
    ...overrides,
  };
}

function factors(): OfferInsight[] {
  return [
    { id: "earnest", title: "Earnest money", body: "Solid deposit.", tone: "strength" },
    { id: "financing", title: "Conventional financing", body: "Familiar.", tone: "info" },
  ];
}

function input(): AiExplainerInput {
  return { safeInput: safeInput(), factors: factors() };
}

/** A well-formed Gemini generateContent payload. */
function geminiPayload(text: string) {
  return {
    candidates: [{ content: { role: "model", parts: [{ text }] } }],
  };
}

describe("mapGeminiResponse", () => {
  it("extracts concatenated part text from a valid payload", () => {
    const payload = {
      candidates: [
        {
          content: {
            role: "model",
            parts: [{ text: "Educational summary. " }, { text: "Your terms read well." }],
          },
        },
      ],
    };
    expect(mapGeminiResponse(payload)).toBe(
      "Educational summary. Your terms read well.",
    );
  });

  it("returns null for empty / whitespace text", () => {
    expect(mapGeminiResponse(geminiPayload(""))).toBeNull();
    expect(mapGeminiResponse(geminiPayload("   "))).toBeNull();
  });

  it("returns null for garbage / missing-shape payloads", () => {
    expect(mapGeminiResponse(undefined)).toBeNull();
    expect(mapGeminiResponse(null)).toBeNull();
    expect(mapGeminiResponse(42)).toBeNull();
    expect(mapGeminiResponse("nope")).toBeNull();
    expect(mapGeminiResponse({})).toBeNull();
    expect(mapGeminiResponse({ candidates: [] })).toBeNull();
    expect(mapGeminiResponse({ candidates: [{}] })).toBeNull();
    expect(mapGeminiResponse({ candidates: [{ content: {} }] })).toBeNull();
    expect(
      mapGeminiResponse({ candidates: [{ content: { parts: "x" } }] }),
    ).toBeNull();
    expect(
      mapGeminiResponse({ candidates: [{ content: { parts: [{}] } }] }),
    ).toBeNull();
  });
});

describe("GEMINI_SYSTEM_INSTRUCTION (UPL / FHA labeling)", () => {
  it("forbids advice and guarantees, and requires the educational label", () => {
    const sys = GEMINI_SYSTEM_INSTRUCTION.toLowerCase();
    // UPL: education only, never advise.
    expect(sys).toContain("education");
    expect(sys).toContain("not legal advice");
    expect(sys).toContain("not financial advice");
    // Never directive.
    expect(sys).toContain("you should");
    expect(sys).toContain("recommend");
    // No acceptance odds / guarantee.
    expect(sys).toContain("guarantee");
    expect(sys).toMatch(/accept/);
    // FHA: never reference a protected class or write a love letter.
    expect(sys).toContain("protected class");
    expect(sys).toContain("love letter");
    // Grounding: explain only the provided factors, never invent numbers.
    expect(sys).toContain("only the factors provided");
    expect(sys).toContain("invent");
  });
});

describe("buildGeminiPrompt / buildGeminiRequestBody (grounding)", () => {
  it("embeds our factors and the safe input, and never a raw demographic field", () => {
    const prompt = buildGeminiPrompt(input());
    expect(prompt).toContain("earnest");
    expect(prompt).toContain("Conventional financing");
    expect(prompt).toContain("400000");
    // Only allowlisted terms are present — no off-allowlist keys leak in.
    expect(prompt).not.toContain("fixturesIncluded");
    expect(prompt).not.toContain("updatedAt");
  });

  it("wraps the system instruction + grounded user content", () => {
    const body = buildGeminiRequestBody(input());
    expect(body.systemInstruction.parts[0].text).toBe(GEMINI_SYSTEM_INSTRUCTION);
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[0].parts[0].text).toContain("offer-strength factors");
  });
});
