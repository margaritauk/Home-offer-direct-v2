import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function paymentBody() {
  return {
    mode: "payment",
    piti: {
      price: 400_000,
      downPct: 10,
      ratePct: 6.5,
      termYears: 30,
      propTaxYr: 4_400,
      insuranceYr: 1_500,
      hoaMo: 0,
      pmiRatePct: 0.5,
    },
  };
}

function affordabilityBody() {
  return {
    mode: "affordability",
    affordability: {
      grossMonthlyIncome: 9_000,
      monthlyDebts: 500,
      downPayment: 40_000,
      ratePct: 6.5,
      termYears: 30,
      propTaxRatePct: 1.1,
      insuranceYr: 1_500,
      hoaMo: 0,
      pmiRatePct: 0.5,
      frontCapPct: 28,
      backCapPct: 36,
    },
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/budget/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function geminiOk(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 },
  );
}

describe("POST /api/budget/explain", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports available:false when unconfigured (default off)", async () => {
    const res = await POST(postRequest(paymentBody()));
    const data = (await res.json()) as { available: boolean };
    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
  });

  it("returns a grounded narration when active and the provider succeeds (payment mode)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiOk("AI-generated estimate of your monthly payment."),
    );

    const res = await POST(postRequest(paymentBody()));
    const data = (await res.json()) as {
      available: boolean;
      explanation: { text: string; basis: string[] } | null;
    };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation?.text).toContain("AI-generated estimate");
    expect(data.explanation?.basis.length).toBeGreaterThan(0);
  });

  it("works in affordability mode (re-runs the solver server-side)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiOk("AI-generated estimate of how much house you can afford."),
    );

    const res = await POST(postRequest(affordabilityBody()));
    const data = (await res.json()) as {
      available: boolean;
      explanation: { text: string } | null;
    };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation?.text).toContain("AI-generated estimate");
  });

  it("returns explanation:null when active but the provider fails (never 500)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const res = await POST(postRequest(paymentBody()));
    const data = (await res.json()) as {
      available: boolean;
      explanation: unknown;
    };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation).toBeNull();
  });

  it("returns explanation:null when active but the output is FHA-blocked", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiOk("Perfect for a young couple raising a family."),
    );

    const res = await POST(postRequest(paymentBody()));
    const data = (await res.json()) as { available: boolean; explanation: unknown };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation).toBeNull();
  });

  it("handles a malformed body without throwing", async () => {
    const res = await POST(
      new Request("http://localhost/api/budget/explain", {
        method: "POST",
        body: "not json",
      }),
    );
    const data = (await res.json()) as { available: boolean };
    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
  });

  it("returns explanation:null when active but no piti inputs are provided", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    const res = await POST(postRequest({ mode: "payment" }));
    const data = (await res.json()) as { available: boolean; explanation: unknown };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation).toBeNull();
  });
});
