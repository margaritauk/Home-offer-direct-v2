import { describe, expect, it } from "vitest";
import {
  CLEAR_TO_CLOSE_STEPS,
  appraisalGap,
  clearToCloseProgress,
  type ClearToCloseStep,
} from "./clear-to-close";

function steps(states: Record<string, ClearToCloseStep["state"]> = {}): ClearToCloseStep[] {
  return CLEAR_TO_CLOSE_STEPS.map((s) => ({
    ...s,
    state: states[s.id] ?? "not-started",
    date: "",
  }));
}

describe("clearToCloseProgress", () => {
  it("reports zero progress when nothing is done", () => {
    const p = clearToCloseProgress(steps());
    expect(p.total).toBe(CLEAR_TO_CLOSE_STEPS.length);
    expect(p.done).toBe(0);
    expect(p.allDone).toBe(false);
    expect(p.percent).toBe(0);
  });

  it("counts done steps and computes percent", () => {
    const p = clearToCloseProgress(
      steps({ "appraisal-ordered": "done", "appraisal-received": "done" }),
    );
    expect(p.done).toBe(2);
    expect(p.percent).toBe(50);
    expect(p.allDone).toBe(false);
  });

  it("does not count in-progress as done", () => {
    const p = clearToCloseProgress(steps({ "appraisal-ordered": "in-progress" }));
    expect(p.done).toBe(0);
  });

  it("reports allDone when every step is done", () => {
    const all = Object.fromEntries(CLEAR_TO_CLOSE_STEPS.map((s) => [s.id, "done" as const]));
    const p = clearToCloseProgress(steps(all));
    expect(p.allDone).toBe(true);
    expect(p.percent).toBe(100);
  });

  it("handles an empty list", () => {
    expect(clearToCloseProgress([]).percent).toBe(0);
  });
});

describe("appraisalGap", () => {
  it("reports no gap when appraisal meets contract", () => {
    const r = appraisalGap({
      contractPrice: 500_000,
      appraisedValue: 500_000,
      plannedDownPayment: 100_000,
    });
    expect(r.gap).toBe(0);
    expect(r.isLow).toBe(false);
    expect(r.optionMoreCash.extraCash).toBe(0);
    expect(r.optionMoreCash.totalCashNeeded).toBe(100_000);
  });

  it("reports no gap when appraisal exceeds contract", () => {
    const r = appraisalGap({
      contractPrice: 500_000,
      appraisedValue: 520_000,
      plannedDownPayment: 100_000,
    });
    expect(r.gap).toBe(0);
    expect(r.isLow).toBe(false);
  });

  it("computes the gap and the more-cash option", () => {
    const r = appraisalGap({
      contractPrice: 500_000,
      appraisedValue: 480_000,
      plannedDownPayment: 100_000,
    });
    expect(r.gap).toBe(20_000);
    expect(r.isLow).toBe(true);
    // Buyer covers the full gap in cash on top of the planned down payment.
    expect(r.optionMoreCash.extraCash).toBe(20_000);
    expect(r.optionMoreCash.totalCashNeeded).toBe(120_000);
  });

  it("frames the renegotiate option (reduce price to appraised value)", () => {
    const r = appraisalGap({
      contractPrice: 500_000,
      appraisedValue: 480_000,
      plannedDownPayment: 100_000,
    });
    expect(r.optionRenegotiate.priceReductionToClose).toBe(20_000);
    expect(r.optionRenegotiate.extraCash).toBe(0);
  });

  it("frames the contingency-exit option as no extra cash", () => {
    const r = appraisalGap({
      contractPrice: 500_000,
      appraisedValue: 480_000,
      plannedDownPayment: 100_000,
    });
    expect(r.optionContingencyExit.extraCash).toBe(0);
  });

  it("guards against invalid inputs", () => {
    const r = appraisalGap({
      contractPrice: Number.NaN,
      appraisedValue: -100,
      plannedDownPayment: Number.NaN,
    });
    expect(r.gap).toBe(0);
    expect(r.optionMoreCash.totalCashNeeded).toBe(0);
  });
});
