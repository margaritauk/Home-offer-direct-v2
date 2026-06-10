import { describe, expect, it } from "vitest";
import {
  bucketDeltas,
  cdDeadline,
  closingDisclosureSummary,
  cumulativeTenPercentFlag,
  earliestSigningDate,
  isBusinessDay,
  type FeeLine,
} from "./closing-disclosure";

function line(
  id: string,
  bucket: FeeLine["bucket"],
  le: number,
  cd: number,
): FeeLine {
  return { id, label: id, bucket, le, cd };
}

describe("bucketDeltas", () => {
  it("flags a zero-tolerance line that increased", () => {
    const [d] = bucketDeltas([line("origination", "zero", 1000, 1200)]);
    expect(d.delta).toBe(200);
    expect(d.flagged).toBe(true);
  });

  it("does not flag a zero-tolerance line that is unchanged or decreased", () => {
    const [same] = bucketDeltas([line("origination", "zero", 1000, 1000)]);
    expect(same.flagged).toBe(false);
    const [down] = bucketDeltas([line("origination", "zero", 1000, 900)]);
    expect(down.delta).toBe(-100);
    expect(down.flagged).toBe(false);
  });

  it("never flags 10% or none bucket lines individually", () => {
    const out = bucketDeltas([
      line("recording", "ten", 100, 500),
      line("prepaid", "none", 100, 5000),
    ]);
    expect(out.every((l) => l.flagged === false)).toBe(true);
  });

  it("treats non-finite amounts as 0", () => {
    const [d] = bucketDeltas([line("x", "zero", Number.NaN, 50)]);
    expect(d.le).toBe(0);
    expect(d.delta).toBe(50);
    expect(d.flagged).toBe(true);
  });
});

describe("cumulativeTenPercentFlag", () => {
  it("does not flag when the cumulative increase is at or below 10%", () => {
    // Bucket LE = 1000, CD = 1100 → exactly 10% → not a violation.
    const r = cumulativeTenPercentFlag([
      line("recording", "ten", 400, 440),
      line("shoppable", "ten", 600, 660),
    ]);
    expect(r.totalLE).toBe(1000);
    expect(r.totalCD).toBe(1100);
    expect(r.percentIncrease).toBeCloseTo(10, 6);
    expect(r.exceeds).toBe(false);
  });

  it("flags when the cumulative increase exceeds 10% (worked example)", () => {
    // Bucket LE = 1000, CD = 1150 → 15% increase → violation.
    const r = cumulativeTenPercentFlag([
      line("recording", "ten", 400, 500),
      line("shoppable", "ten", 600, 650),
    ]);
    expect(r.totalLE).toBe(1000);
    expect(r.totalCD).toBe(1150);
    expect(r.increase).toBe(150);
    expect(r.percentIncrease).toBeCloseTo(15, 6);
    expect(r.exceeds).toBe(true);
  });

  it("ignores non-ten-bucket lines and a zero LE basis", () => {
    const r = cumulativeTenPercentFlag([
      line("origination", "zero", 1000, 5000),
      line("recording", "ten", 0, 0),
    ]);
    expect(r.totalLE).toBe(0);
    expect(r.percentIncrease).toBe(0);
    expect(r.exceeds).toBe(false);
  });
});

describe("closingDisclosureSummary", () => {
  it("rolls up totals, the 10% bucket, and the violations list", () => {
    const lines: FeeLine[] = [
      // Zero-tolerance: one increased (violation), one unchanged.
      line("origination", "zero", 2000, 2300), // +300 → violation
      line("transfer-taxes", "zero", 1500, 1500), // unchanged
      // 10% bucket: cumulative 1000 → 1150 = 15% → violation.
      line("recording", "ten", 400, 500),
      line("shoppable", "ten", 600, 650),
      // None bucket: large change, never a violation.
      line("prepaid", "none", 800, 1300),
    ];
    const s = closingDisclosureSummary(lines);

    expect(s.totalLE).toBe(2000 + 1500 + 400 + 600 + 800);
    expect(s.totalCD).toBe(2300 + 1500 + 500 + 650 + 1300);
    expect(s.totalDelta).toBe(s.totalCD - s.totalLE);

    expect(s.tenPercent.exceeds).toBe(true);
    expect(s.hasViolations).toBe(true);
    expect(s.violations).toHaveLength(2);

    const zero = s.violations.find((v) => v.kind === "zero-tolerance");
    expect(zero?.lineId).toBe("origination");
    expect(zero?.amountOver).toBe(300);

    const ten = s.violations.find((v) => v.kind === "ten-percent-cumulative");
    // Over the allowed 10% of 1000 (=100): increase 150 − 100 = 50.
    expect(ten?.amountOver).toBe(50);
  });

  it("reports no violations when everything is within tolerance", () => {
    const s = closingDisclosureSummary([
      line("origination", "zero", 2000, 2000),
      line("recording", "ten", 1000, 1050), // 5% — within
      line("prepaid", "none", 800, 2000), // none — never a violation
    ]);
    expect(s.hasViolations).toBe(false);
    expect(s.violations).toEqual([]);
  });

  it("never produces a violation from a no-tolerance line, however large", () => {
    const s = closingDisclosureSummary([
      line("prepaid-interest", "none", 100, 100_000),
      line("escrow", "none", 0, 50_000),
    ]);
    expect(s.violations).toEqual([]);
  });
});

describe("3-business-day rule", () => {
  it("isBusinessDay: Saturdays count, Sundays and federal holidays do not", () => {
    expect(isBusinessDay("2026-06-12")).toBe(true); // Friday
    expect(isBusinessDay("2026-06-13")).toBe(true); // Saturday counts
    expect(isBusinessDay("2026-06-14")).toBe(false); // Sunday
    expect(isBusinessDay("2026-12-25")).toBe(false); // Christmas (observed Fri)
    expect(isBusinessDay("2026-07-03")).toBe(false); // July 4th observed (Fri)
    expect(isBusinessDay("not-a-date")).toBe(false);
  });

  it("earliestSigningDate: 3 business days after receipt (receipt day not counted)", () => {
    // CD received Mon 2026-06-08 → Tue, Wed, Thu → earliest signing Thu 06-11.
    expect(earliestSigningDate("2026-06-08")).toBe("2026-06-11");
    expect(earliestSigningDate("")).toBe("");
  });

  it("earliestSigningDate: skips a Sunday and a federal holiday, counts Saturday", () => {
    // CD received Wed 2026-07-01: Thu 07-02 (1), Fri 07-03 (July 4 observed,
    // skip), Sat 07-04 (2), Sun 07-05 (skip), Mon 07-06 (3) → 2026-07-06.
    expect(earliestSigningDate("2026-07-01")).toBe("2026-07-06");
  });

  it("cdDeadline: latest CD-received date for a closing (closing day not counted)", () => {
    // Closing Fri 2026-06-12 → Thu, Wed, Tue → CD must be received by Tue 06-09.
    expect(cdDeadline("2026-06-12")).toBe("2026-06-09");
    expect(cdDeadline("")).toBe("");
  });

  it("cdDeadline: holiday + weekend case (Christmas week)", () => {
    // Closing Mon 2026-12-28: Sun 12-27 (skip), Sat 12-26 (1), Fri 12-25
    // (Christmas, skip), Thu 12-24 (2), Wed 12-23 (3) → 2026-12-23.
    expect(cdDeadline("2026-12-28")).toBe("2026-12-23");
  });
});
