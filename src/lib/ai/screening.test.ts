import { describe, expect, it } from "vitest";
import {
  AI_INPUT_ALLOWLIST,
  buildSafeAiInput,
  screenOutput,
  screenText,
} from "./screening";
import type { Offer } from "@/lib/offer/types";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    fixturesIncluded: "Refrigerator, washer/dryer",
    fixturesExcluded: "Dining room chandelier",
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
    ...overrides,
  };
}

describe("AI_INPUT_ALLOWLIST", () => {
  it("contains only transaction-term / market keys — no demographic fields", () => {
    expect(AI_INPUT_ALLOWLIST).toContain("price");
    expect(AI_INPUT_ALLOWLIST).toContain("financingType");
    expect(AI_INPUT_ALLOWLIST).toContain("contingencies");
    expect(AI_INPUT_ALLOWLIST).toContain("concession");
  });

  it("excludes free-text fixtures fields and the updatedAt bookkeeping field", () => {
    expect(AI_INPUT_ALLOWLIST).not.toContain("fixturesIncluded" as never);
    expect(AI_INPUT_ALLOWLIST).not.toContain("fixturesExcluded" as never);
    expect(AI_INPUT_ALLOWLIST).not.toContain("updatedAt" as never);
  });
});

describe("buildSafeAiInput", () => {
  it("includes exactly the allowlisted keys (plus optional market) and nothing else", () => {
    const safe = buildSafeAiInput(makeOffer());
    const keys = Object.keys(safe).sort();
    expect(keys).toEqual([...AI_INPUT_ALLOWLIST].sort());
  });

  it("drops off-allowlist keys such as updatedAt and fixtures", () => {
    const safe = buildSafeAiInput(makeOffer()) as unknown as Record<string, unknown>;
    expect("updatedAt" in safe).toBe(false);
    expect("fixturesIncluded" in safe).toBe(false);
    expect("fixturesExcluded" in safe).toBe(false);
  });

  it("ignores any extra demographic field smuggled onto the offer", () => {
    const dirty = makeOffer() as Offer & Record<string, unknown>;
    dirty.buyerRace = "Asian";
    dirty.hasChildren = true;
    const safe = buildSafeAiInput(dirty) as unknown as Record<string, unknown>;
    expect("buyerRace" in safe).toBe(false);
    expect("hasChildren" in safe).toBe(false);
  });

  it("preserves the actual term values", () => {
    const safe = buildSafeAiInput(makeOffer({ price: 525_000 }));
    expect(safe.price).toBe(525_000);
    expect(safe.financingType).toBe("conventional");
    expect(safe.concession.percent).toBe(2.5);
    expect(safe.contingencies.inspection).toEqual({ included: true, days: 10 });
  });

  it("screens protected-class signals out of the possession free-text field", () => {
    const safe = buildSafeAiInput(
      makeOffer({ possession: "Buyer needs it for their three young children" }),
    );
    expect(safe.possession).not.toMatch(/children/i);
    expect(safe.possession).toContain("[removed]");
  });

  it("attaches and screens market facts when provided", () => {
    const safe = buildSafeAiInput(makeOffer(), {
      state: "CA",
      marketNotes: "Low inventory; a Christian church is nearby",
    });
    expect(safe.market?.state).toBe("CA");
    expect(safe.market?.marketNotes).not.toMatch(/christian|church/i);
  });

  it("omits market entirely when not supplied", () => {
    const safe = buildSafeAiInput(makeOffer());
    expect("market" in safe).toBe(false);
  });
});

describe("screenText", () => {
  it("leaves clean transaction text untouched and unflagged", () => {
    const r = screenText("Offer of $400,000 with a 10% down payment and inspection contingency.");
    expect(r.flagged).toBe(false);
    expect(r.matchedClasses).toEqual([]);
    expect(r.text).toContain("$400,000");
  });

  it("strips race signals", () => {
    const r = screenText("The buyer is African-American.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/african/i);
    expect(r.matchedClasses).toContain("race/color");
  });

  it("strips religion signals", () => {
    const r = screenText("We are a devout Catholic family looking for a home near a church.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/catholic|church/i);
    expect(r.matchedClasses).toContain("religion");
  });

  it("strips familial-status signals", () => {
    const r = screenText("A single mother expecting a baby with two kids.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/single mother|baby|kids/i);
    expect(r.matchedClasses).toContain("familial status");
  });

  it("strips disability signals", () => {
    const r = screenText("Needs a wheelchair-accessible entrance for a disabled buyer.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/wheelchair|disabled/i);
    expect(r.matchedClasses).toContain("disability");
  });

  it("strips national-origin signals", () => {
    const r = screenText("The buyer is an immigrant with a strong accent.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/immigrant|accent/i);
    expect(r.matchedClasses).toContain("national origin");
  });

  it("strips source-of-income signals", () => {
    const r = screenText("Will pay using a Section 8 housing voucher.");
    expect(r.flagged).toBe(true);
    expect(r.text).not.toMatch(/section 8|voucher/i);
    expect(r.matchedClasses).toContain("source of income");
  });

  it("dedupes matched classes and strips every occurrence", () => {
    const r = screenText("Jewish buyer, Jewish family, very religious.");
    expect(r.matchedClasses.filter((c) => c === "religion")).toHaveLength(1);
    expect(r.text).not.toMatch(/jewish|religious/i);
  });

  it("handles empty / whitespace input safely", () => {
    expect(screenText("").flagged).toBe(false);
    expect(screenText("   ").flagged).toBe(false);
  });
});

describe("screenOutput", () => {
  it("passes clean, terms-focused output", () => {
    const r = screenOutput(
      "Your offer is strengthened by the 20% down payment and a short close timeline.",
    );
    expect(r.safe).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it("rejects output referencing a protected class", () => {
    const r = screenOutput("This offer may appeal because the buyers are a young Christian couple.");
    expect(r.safe).toBe(false);
    expect(r.reason).toMatch(/protected-class/i);
    expect(r.matchedClasses).toBeDefined();
  });

  it("rejects love-letter-style personal appeals", () => {
    const r = screenOutput(
      "Dear Seller, we fell in love with your home and can't wait to raise our family here.",
    );
    expect(r.safe).toBe(false);
    expect(r.matchedClasses).toContain("love-letter appeal");
  });

  it("rejects 'forever home' / 'make memories' appeals", () => {
    const r = screenOutput("This will be our forever home where we make lifelong memories.");
    expect(r.safe).toBe(false);
  });

  it("passes empty output", () => {
    expect(screenOutput("").safe).toBe(true);
  });
});
