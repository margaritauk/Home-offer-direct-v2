import { describe, expect, it } from "vitest";
import {
  earnestPercent,
  explainOfferStrength,
  includedContingencyCount,
} from "./strength";
import type { Offer } from "./types";

const offer = (over: Partial<Offer> = {}): Offer => ({
  price: 400_000,
  earnestMoney: 8_000,
  isPercent: false,
  financingType: "conventional",
  downPaymentPercent: 20,
  closingDate: "",
  possession: "",
  fixturesIncluded: "",
  fixturesExcluded: "",
  closingCostPreference: "buyer-pays",
  contingencies: {
    financing: { included: true, days: 21 },
    inspection: { included: true, days: 10 },
  } as never,
  concession: { type: "none", percent: 0 },
  updatedAt: "",
  ...over,
});

describe("earnestPercent", () => {
  it("computes percent from a dollar amount", () => {
    expect(earnestPercent(offer({ earnestMoney: 8_000, isPercent: false }))).toBeCloseTo(2);
  });
  it("passes through a percent value", () => {
    expect(earnestPercent(offer({ earnestMoney: 3, isPercent: true }))).toBe(3);
  });
});

describe("includedContingencyCount", () => {
  it("counts only included contingencies", () => {
    expect(includedContingencyCount(offer())).toBe(2);
    expect(
      includedContingencyCount(
        offer({ contingencies: { financing: { included: false, days: 0 } } as never }),
      ),
    ).toBe(0);
  });
});

describe("explainOfferStrength", () => {
  it("returns an empty-state note when there is no price", () => {
    const out = explainOfferStrength(offer({ price: 0 }));
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("empty");
  });

  it("marks a >=2% earnest deposit as a strength", () => {
    const out = explainOfferStrength(offer({ earnestMoney: 12_000 }));
    const em = out.find((i) => i.id === "earnest");
    expect(em!.tone).toBe("strength");
  });

  it("flags a light earnest deposit as something to weigh", () => {
    const out = explainOfferStrength(offer({ earnestMoney: 2_000 })); // 0.5%
    expect(out.find((i) => i.id === "earnest")!.tone).toBe("watch");
  });

  it("calls out a cash offer as strong", () => {
    const out = explainOfferStrength(offer({ financingType: "cash" }));
    expect(out.find((i) => i.id === "financing")!.tone).toBe("strength");
  });

  it("never recommends waiving a contingency", () => {
    const out = explainOfferStrength(offer());
    const c = out.find((i) => i.id === "contingencies")!;
    expect(c.body.toLowerCase()).not.toContain("you should waive");
    expect(c.body.toLowerCase()).toContain("attorney");
  });

  it("flags a large concession ask", () => {
    const out = explainOfferStrength(
      offer({ concession: { type: "closing-credit", percent: 5 } }),
    );
    expect(out.find((i) => i.id === "concession")!.tone).toBe("watch");
  });
});
