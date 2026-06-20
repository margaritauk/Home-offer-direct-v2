import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NullAiExplainer,
  getAiExplainerSource,
} from "./source";
import {
  GeminiAiExplainer,
  GEMINI_PRICE_BAND_SYSTEM_INSTRUCTION,
  GEMINI_DISCLOSURE_SYSTEM_INSTRUCTION,
  buildPriceBandPrompt,
  buildPriceBandRequestBody,
  buildDisclosurePrompt,
  buildDisclosureRequestBody,
} from "./source-gemini";
import {
  buildPriceBandExplainerInput,
  buildDisclosureExplainerInput,
} from "./grounding-input";
import { screenOutput } from "@/lib/ai/screening";
import { suggestPriceBand, type PriceBand } from "@/lib/offer/suggested-price";
import { buildDisclosureChecklist } from "@/lib/tools/disclosure-review";
import { getStateProfile } from "@/lib/states/data";
import type { CompsEstimate } from "@/lib/tools/comps";
import type { MarketRead } from "@/lib/market/types";

// --- fixtures ---------------------------------------------------------------

function compsEst(): CompsEstimate {
  return {
    comps: [],
    usableCount: 5,
    avgPricePerSqft: 200,
    minPricePerSqft: 190,
    maxPricePerSqft: 210,
    estimatedLow: 380_000,
    estimatedMid: 400_000,
    estimatedHigh: 420_000,
  } as unknown as CompsEstimate;
}

function marketRead(): MarketRead {
  return {
    band: "balanced",
    headline: "Balanced market",
  } as unknown as MarketRead;
}

function band(): PriceBand {
  return suggestPriceBand({ compsEstimate: compsEst(), marketRead: marketRead() });
}

const CA = getStateProfile("CA")!;

/** A well-formed Gemini generateContent payload wrapping the given text. */
function geminiResponse(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 },
  );
}

// --- grounding builders -----------------------------------------------------

describe("buildPriceBandExplainerInput (grounding)", () => {
  it("projects ONLY objective band facts + rationale (no demographic field)", () => {
    const input = buildPriceBandExplainerInput(band());
    expect(input.safeInput.low).toBe(380_000);
    expect(input.safeInput.high).toBe(420_000);
    expect(input.safeInput.basis.hasComps).toBe(true);
    expect(input.rationale.length).toBeGreaterThan(0);
    // The projection shape carries no person/demographic keys.
    const keys = Object.keys(input.safeInput);
    expect(keys).not.toContain("buyer");
    expect(keys).not.toContain("income");
  });
});

describe("buildDisclosureExplainerInput (grounding)", () => {
  it("projects the regime + property-condition categories", () => {
    const input = buildDisclosureExplainerInput(
      buildDisclosureChecklist(CA, { builtPre1978: true }),
    );
    expect(input.regime).toBe(CA.disclosureRegime);
    expect(input.categories.length).toBeGreaterThan(0);
    expect(input.categories.every((c) => c.label && c.askYourPro)).toBe(true);
  });
});

// --- system instructions (A2 = most conservative) ---------------------------

describe("GEMINI_PRICE_BAND_SYSTEM_INSTRUCTION", () => {
  it("says 'suggest a range' / 'you decide' and forbids 'offer $X'", () => {
    const s = GEMINI_PRICE_BAND_SYSTEM_INSTRUCTION;
    expect(s).toMatch(/range/i);
    expect(s).toMatch(/buyer decides|you decide|never name a single/i);
    expect(s).toMatch(/never tell the buyer to 'offer'/i);
    expect(s).toMatch(/offer \$x/i);
    // FHA + UPL constraints present.
    expect(s).toMatch(/protected class/i);
    expect(s).toMatch(/not legal advice/i);
  });
});

describe("GEMINI_DISCLOSURE_SYSTEM_INSTRUCTION", () => {
  it("narrates property condition, never the people; never adjudicates", () => {
    const s = GEMINI_DISCLOSURE_SYSTEM_INSTRUCTION;
    expect(s).toMatch(/property's condition/i);
    expect(s).toMatch(/people/i);
    expect(s).toMatch(/protected class/i);
    expect(s).toMatch(/never interpret/i);
    expect(s).toMatch(/legally/i);
    expect(s).toMatch(/sufficient/i);
    expect(s).toMatch(/attorney|inspector/i);
  });
});

// --- prompt builders ground in OUR data -------------------------------------

describe("price-band prompt builder", () => {
  it("embeds the band low/high + rationale, framed as a range", () => {
    const prompt = buildPriceBandPrompt(buildPriceBandExplainerInput(band()));
    expect(prompt).toContain("380000");
    expect(prompt).toContain("420000");
    expect(prompt).toMatch(/range/i);
    const body = buildPriceBandRequestBody(buildPriceBandExplainerInput(band()));
    expect(body.systemInstruction.parts[0].text).toBe(
      GEMINI_PRICE_BAND_SYSTEM_INSTRUCTION,
    );
  });
});

describe("disclosure prompt builder", () => {
  it("embeds OUR categories and the regime", () => {
    const input = buildDisclosureExplainerInput(buildDisclosureChecklist(CA));
    const prompt = buildDisclosurePrompt(input);
    expect(prompt).toMatch(/water intrusion/i);
    const body = buildDisclosureRequestBody(input);
    expect(body.systemInstruction.parts[0].text).toBe(
      GEMINI_DISCLOSURE_SYSTEM_INSTRUCTION,
    );
  });
});

// --- UPL: screenOutput rejects any "offer $N" directive ---------------------

describe("screenOutput rejects directive 'offer $N' on the A2 surface", () => {
  it("rejects 'offer $410,000' / 'I'd offer 405k'", () => {
    expect(screenOutput("You should offer $410,000.").safe).toBe(false);
    expect(screenOutput("I'd offer 405k here.").safe).toBe(false);
  });
  it("passes the conservative range narration the A2 explainer is meant to give", () => {
    expect(
      screenOutput(
        "Comps suggest a range of $380,000 to $420,000; the market read is balanced, so the middle is a common reference. You decide what to offer.",
      ).safe,
    ).toBe(true);
  });
});

// --- seam: gating + grounded narration --------------------------------------

describe("AiExplainerSource — price-band + disclosure gating", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Null default returns null for explainPriceBand + explainDisclosure", async () => {
    const source = getAiExplainerSource();
    expect(source).toBeInstanceOf(NullAiExplainer);
    expect(
      await source.explainPriceBand(buildPriceBandExplainerInput(band())),
    ).toBeNull();
    expect(
      await source.explainDisclosure(
        buildDisclosureExplainerInput(buildDisclosureChecklist(CA)),
      ),
    ).toBeNull();
  });

  it("narrates a grounded price-band range when active and the provider succeeds", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse(
        "Educational summary of a range: comps suggest $380,000–$420,000; you decide.",
      ),
    );
    const out = await getAiExplainerSource().explainPriceBand(
      buildPriceBandExplainerInput(band()),
    );
    expect(out?.text).toMatch(/range/i);
    expect(out?.basis.length).toBeGreaterThan(0);
  });

  it("BLOCKS a provider that emits an 'offer $X' directive → null", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    // Even though it's asked for a range, a misbehaving model that says
    // "offer $410,000" is rejected wholesale by screenOutput → null.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse("Given the comps, you should offer $410,000."),
    );
    expect(
      await getAiExplainerSource().explainPriceBand(
        buildPriceBandExplainerInput(band()),
      ),
    ).toBeNull();
  });

  it("narrates a grounded disclosure summary when active", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      geminiResponse(
        "Educational checklist summary: check water, roof, and foundation; have your inspector confirm.",
      ),
    );
    const out = await getAiExplainerSource().explainDisclosure(
      buildDisclosureExplainerInput(buildDisclosureChecklist(CA)),
    );
    expect(out?.text).toMatch(/inspector/i);
    expect(GeminiAiExplainer).toBeDefined();
  });

  it("returns null when the provider transport fails (never throws)", async () => {
    vi.stubEnv("AI_EXPLAINER_SOURCE", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    expect(
      await getAiExplainerSource().explainDisclosure(
        buildDisclosureExplainerInput(buildDisclosureChecklist(CA)),
      ),
    ).toBeNull();
  });
});
