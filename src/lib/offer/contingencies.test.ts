import { describe, expect, it } from "vitest";
import { CONTINGENCIES, getContingency } from "./contingencies";
import { computeOfferMilestones } from "./deadlines";
import { emptyOffer } from "@/hooks/use-offer";

describe("contingencies", () => {
  it("includes the attorney-review contingency (issue #91)", () => {
    const ar = getContingency("attorney-review");
    expect(ar).toBeTruthy();
    expect(ar!.label).toMatch(/attorney/i);
    expect(ar!.defaultDays).toBeGreaterThan(0);
    expect(ar!.protects.length).toBeGreaterThan(0);
    expect(ar!.riskOfWaiving.length).toBeGreaterThan(0);
  });

  it("covers the six standard contingencies", () => {
    const ids = CONTINGENCIES.map((c) => c.id).sort();
    expect(ids).toEqual(
      ["appraisal", "attorney-review", "financing", "inspection", "sale-of-home", "title"].sort(),
    );
  });

  it("an included attorney-review contingency produces a deadline milestone", () => {
    const offer = emptyOffer(); // attorney-review is included by default
    offer.closingDate = "2026-08-01";
    const ms = computeOfferMilestones({ offer, underContractDate: "2026-07-01" });
    const ar = ms.find((m) => m.id === "contingency-attorney-review");
    expect(ar).toBeTruthy();
    expect(ar!.date).toBe("2026-07-06"); // UC + 5 days
  });
});
