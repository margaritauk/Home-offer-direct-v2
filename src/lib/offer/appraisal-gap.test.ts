import { describe, expect, it } from "vitest";
import { modelGap } from "./appraisal-gap";
import { appraisalGap } from "@/lib/tools/clear-to-close";

describe("modelGap (offer-time appraisal-gap helper)", () => {
  it("computes the gap and full cash-to-cover when no coverage cap given", () => {
    const m = modelGap({ contractPrice: 410000, appraisedValue: 400000 });
    expect(m.gap).toBe(10000);
    expect(m.isLow).toBe(true);
    expect(m.cashToCover).toBe(10000);
    expect(m.remainingExposure).toBe(0);
    expect(m.partialCoverage).toBe(false);
  });

  it("returns zero gap and zero cash when appraised >= contract (not negative)", () => {
    const equal = modelGap({ contractPrice: 400000, appraisedValue: 400000 });
    expect(equal.gap).toBe(0);
    expect(equal.isLow).toBe(false);
    expect(equal.cashToCover).toBe(0);
    expect(equal.remainingExposure).toBe(0);

    const above = modelGap({ contractPrice: 400000, appraisedValue: 420000 });
    expect(above.gap).toBe(0);
    expect(above.cashToCover).toBe(0);
    expect(above.remainingExposure).toBe(0); // never a "credit"
  });

  it("caps cash-to-cover at a partial coverage amount and shows remaining exposure", () => {
    const m = modelGap({
      contractPrice: 420000,
      appraisedValue: 400000,
      coverageCap: 12000,
    });
    expect(m.gap).toBe(20000);
    expect(m.cashToCover).toBe(12000);
    expect(m.remainingExposure).toBe(8000);
    expect(m.partialCoverage).toBe(true);
  });

  it("clamps a coverage cap above the gap to the gap (no over-coverage)", () => {
    const m = modelGap({
      contractPrice: 410000,
      appraisedValue: 400000,
      coverageCap: 50000,
    });
    expect(m.cashToCover).toBe(10000);
    expect(m.remainingExposure).toBe(0);
    expect(m.partialCoverage).toBe(false);
  });

  it("treats a coverage cap exactly equal to the gap as full coverage (boundary)", () => {
    const m = modelGap({
      contractPrice: 410000,
      appraisedValue: 400000,
      coverageCap: 10000,
    });
    expect(m.cashToCover).toBe(10000);
    expect(m.remainingExposure).toBe(0);
    expect(m.partialCoverage).toBe(false);
  });

  it("guards NaN / negative inputs to 0", () => {
    const m = modelGap({ contractPrice: NaN, appraisedValue: -5, coverageCap: NaN });
    expect(m.gap).toBe(0);
    expect(m.cashToCover).toBe(0);
    expect(m.remainingExposure).toBe(0);
  });

  it("is DISTINCT from the post-appraisal clear-to-close calc (shares no state)", () => {
    // Same raw scenario, two independent calculators. They agree on the gap math
    // but neither reads or mutates the other — different shapes, different intent.
    const offerTime = modelGap({ contractPrice: 410000, appraisedValue: 400000 });
    const postAppraisal = appraisalGap({
      contractPrice: 410000,
      appraisedValue: 400000,
      plannedDownPayment: 82000,
    });

    expect(offerTime.gap).toBe(postAppraisal.gap); // same arithmetic
    // Distinct shapes: offer-time has coverage planning; clear-to-close has the
    // three post-appraisal options. No shared keys beyond the gap concept.
    expect(offerTime).toHaveProperty("remainingExposure");
    expect(offerTime).not.toHaveProperty("optionMoreCash");
    expect(postAppraisal).toHaveProperty("optionMoreCash");
    expect(postAppraisal).not.toHaveProperty("remainingExposure");
  });
});
