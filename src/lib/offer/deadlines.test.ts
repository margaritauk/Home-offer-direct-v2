import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPIRATION_HOURS,
  computeOfferMilestones,
  computeOfferMilestonesWithStatus,
  offerExpirationDate,
} from "./deadlines";
import type { Offer } from "./types";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    fixturesIncluded: "",
    fixturesExcluded: "",
    closingCostPreference: "buyer-pays",
    contingencies: {
      inspection: { included: true, days: 10 },
      appraisal: { included: true, days: 17 },
      financing: { included: true, days: 21 },
      "sale-of-home": { included: false, days: 45 },
      title: { included: true, days: 14 },
    },
    concession: { type: "price-reduction", percent: 2.5 },
    updatedAt: "",
    ...overrides,
  };
}

const UC = "2026-07-01";

describe("computeOfferMilestones", () => {
  it("always includes the offer response/expiration milestone", () => {
    const ms = computeOfferMilestones({ offer: makeOffer(), underContractDate: UC });
    const exp = ms.find((m) => m.id === "offer-expiration");
    expect(exp).toBeDefined();
    expect(exp!.critical).toBe(true);
  });

  it("defaults the expiration to 48h (2 days) from the submitted date", () => {
    const ms = computeOfferMilestones({
      offer: makeOffer(),
      underContractDate: UC,
      submittedDate: "2026-07-01",
    });
    const exp = ms.find((m) => m.id === "offer-expiration")!;
    expect(exp.date).toBe("2026-07-03"); // +2 days
    expect(DEFAULT_EXPIRATION_HOURS).toBe(48);
  });

  it("honors an editable expiration window and rounds hours up to days", () => {
    const ms = computeOfferMilestones({
      offer: makeOffer(),
      underContractDate: UC,
      submittedDate: "2026-07-01",
      expirationHours: 72,
    });
    expect(ms.find((m) => m.id === "offer-expiration")!.date).toBe("2026-07-04"); // +3 days
    const ms24 = computeOfferMilestones({
      offer: makeOffer(),
      underContractDate: UC,
      submittedDate: "2026-07-01",
      expirationHours: 25,
    });
    expect(ms24.find((m) => m.id === "offer-expiration")!.date).toBe("2026-07-03"); // ceil(25/24)=2
  });

  it("includes a milestone per INCLUDED contingency at its chosen window", () => {
    const ms = computeOfferMilestones({ offer: makeOffer(), underContractDate: UC });
    const inspection = ms.find((m) => m.id === "contingency-inspection")!;
    expect(inspection.date).toBe("2026-07-11"); // UC + 10
    const title = ms.find((m) => m.id === "contingency-title")!;
    expect(title.date).toBe("2026-07-15"); // UC + 14
  });

  it("omits milestones for waived contingencies", () => {
    const ms = computeOfferMilestones({ offer: makeOffer(), underContractDate: UC });
    expect(ms.find((m) => m.id === "contingency-sale-of-home")).toBeUndefined();
  });

  it("reflects an edited contingency window", () => {
    const offer = makeOffer();
    offer.contingencies.inspection.days = 7;
    const ms = computeOfferMilestones({ offer, underContractDate: UC });
    expect(ms.find((m) => m.id === "contingency-inspection")!.date).toBe("2026-07-08");
  });

  it("derives closing-side milestones from the closing date", () => {
    const ms = computeOfferMilestones({ offer: makeOffer(), underContractDate: UC });
    expect(ms.find((m) => m.id === "closing")!.date).toBe("2026-09-01");
    expect(ms.find((m) => m.id === "final-walkthrough")!.date).toBe("2026-08-31");
    expect(ms.find((m) => m.id === "closing-disclosure")).toBeDefined();
  });

  it("sorts milestones by date ascending", () => {
    const ms = computeOfferMilestones({ offer: makeOffer(), underContractDate: UC });
    const dates = ms.map((m) => m.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it("still returns the expiration milestone when only the submitted date is valid", () => {
    const ms = computeOfferMilestones({
      offer: makeOffer({ closingDate: "" }),
      underContractDate: "",
      submittedDate: "2026-07-01",
    });
    expect(ms).toHaveLength(1);
    expect(ms[0].id).toBe("offer-expiration");
  });

  it("returns an empty array when no anchor date is valid", () => {
    const ms = computeOfferMilestones({
      offer: makeOffer({ closingDate: "" }),
      underContractDate: "",
      submittedDate: "",
    });
    expect(ms).toEqual([]);
  });
});

describe("computeOfferMilestonesWithStatus", () => {
  it("annotates each milestone with a status relative to today", () => {
    const ms = computeOfferMilestonesWithStatus(
      { offer: makeOffer(), underContractDate: UC, submittedDate: "2026-07-01" },
      "2026-07-02",
    );
    const exp = ms.find((m) => m.id === "offer-expiration")!;
    expect(exp.status).toBe("soon"); // due 7-03, today 7-02
    const closing = ms.find((m) => m.id === "closing")!;
    expect(closing.status).toBe("upcoming");
  });
});

describe("offerExpirationDate", () => {
  it("returns the computed expiration date for preview", () => {
    expect(
      offerExpirationDate({ offer: makeOffer(), underContractDate: UC, submittedDate: "2026-07-01" }),
    ).toBe("2026-07-03");
  });

  it("falls back to the under-contract date as the submitted anchor", () => {
    expect(offerExpirationDate({ offer: makeOffer(), underContractDate: "2026-07-01" })).toBe("2026-07-03");
  });

  it("returns an empty string when there is no valid anchor", () => {
    expect(offerExpirationDate({ offer: makeOffer(), underContractDate: "" })).toBe("");
  });
});
