import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiAiExplainer } from "./source-gemini";
import type { AiExplainerInput } from "./types";
import type { SafeAiInput } from "@/lib/ai/screening";
import type { OfferInsight } from "@/lib/offer/strength";

function safeInput(): SafeAiInput {
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
  };
}

const FACTORS: OfferInsight[] = [
  { id: "earnest", title: "Earnest money", body: "Solid deposit.", tone: "strength" },
  { id: "financing", title: "Conventional financing", body: "Familiar.", tone: "info" },
];

const INPUT: AiExplainerInput = { safeInput: safeInput(), factors: FACTORS };

function geminiResponse(text: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { role: "model", parts: [{ text }] } }],
    }),
    { status },
  );
}

describe("GeminiAiExplainer.explainOfferStrength", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null and does NOT call fetch with no key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await new GeminiAiExplainer().explainOfferStrength(INPUT)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a grounded explanation on an OK response and sends the key header", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        geminiResponse("Educational summary: your earnest money reads strong."),
      );

    const out = await new GeminiAiExplainer().explainOfferStrength(INPUT);
    expect(out).not.toBeNull();
    expect(out?.text).toContain("Educational summary");
    // basis cites the factor ids we grounded it in.
    expect(out?.basis).toEqual(["earnest", "financing"]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(
      "test-key",
    );
    // The key must never be in the URL (header-only).
    expect(url).not.toContain("test-key");
  });

  it("uses GEMINI_MODEL override in the URL", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-2.5-pro");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(geminiResponse("Educational summary."));
    await new GeminiAiExplainer().explainOfferStrength(INPUT);
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("gemini-2.5-pro:generateContent");
  });

  it("FHA OUTPUT screening: blocks a protected-class / love-letter response → null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse(
        "Dear seller, we are a young married couple hoping to raise our family here.",
      ),
    );
    expect(await new GeminiAiExplainer().explainOfferStrength(INPUT)).toBeNull();
  });

  it("returns null on a non-OK response (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse("ignored", 500),
    );
    expect(await new GeminiAiExplainer().explainOfferStrength(INPUT)).toBeNull();
  });

  it("returns null when fetch throws (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await new GeminiAiExplainer().explainOfferStrength(INPUT)).toBeNull();
  });

  it("returns null on an empty / unparseable body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );
    expect(await new GeminiAiExplainer().explainOfferStrength(INPUT)).toBeNull();
  });
});
