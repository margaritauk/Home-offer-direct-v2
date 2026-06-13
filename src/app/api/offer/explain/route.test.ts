import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import type { Offer } from "@/lib/offer/types";

function makeOffer(): Offer {
  return {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    fixturesIncluded: "Refrigerator",
    fixturesExcluded: "Chandelier",
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
    updatedAt: "2026-06-07T00:00:00.000Z",
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/offer/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/offer/explain", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports available:false when unconfigured (default off)", async () => {
    const res = await POST(postRequest({ offer: makeOffer() }));
    const data = (await res.json()) as { available: boolean };
    expect(res.status).toBe(200);
    expect(data.available).toBe(false);
  });

  it("returns a grounded explanation when active and the provider succeeds", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: "Educational summary of your terms." }] } },
          ],
        }),
        { status: 200 },
      ),
    );

    const res = await POST(postRequest({ offer: makeOffer() }));
    const data = (await res.json()) as {
      available: boolean;
      explanation: { text: string; basis: string[] } | null;
    };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation?.text).toContain("Educational summary");
    expect(data.explanation?.basis.length).toBeGreaterThan(0);
  });

  it("returns explanation:null when active but the provider fails (never 500)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const res = await POST(postRequest({ offer: makeOffer() }));
    const data = (await res.json()) as {
      available: boolean;
      explanation: unknown;
    };
    expect(res.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.explanation).toBeNull();
  });

  it("handles a malformed body without throwing", async () => {
    const res = await POST(
      new Request("http://localhost/api/offer/explain", {
        method: "POST",
        body: "not json",
      }),
    );
    const data = (await res.json()) as { available: boolean };
    expect(res.status).toBe(200);
    // Unconfigured by default → available:false regardless of body.
    expect(data.available).toBe(false);
  });
});
