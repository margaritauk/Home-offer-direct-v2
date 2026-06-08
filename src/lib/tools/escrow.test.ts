import { describe, expect, it } from "vitest";
import {
  WIRE_FRAUD_CHECKLIST,
  checklistStatus,
  escrowStatus,
  type ChecklistItem,
  type EscrowTracker,
} from "./escrow";

function items(done: Record<string, boolean> = {}): ChecklistItem[] {
  return WIRE_FRAUD_CHECKLIST.map((i) => ({ ...i, done: done[i.id] ?? false }));
}

describe("checklistStatus", () => {
  it("reports an empty/all-unchecked checklist", () => {
    const s = checklistStatus(items());
    expect(s.total).toBe(WIRE_FRAUD_CHECKLIST.length);
    expect(s.completed).toBe(0);
    expect(s.allComplete).toBe(false);
    expect(s.criticalComplete).toBe(false);
    expect(s.percent).toBe(0);
  });

  it("computes completion percent", () => {
    const s = checklistStatus(items({ "independent-number": true }));
    expect(s.completed).toBe(1);
    expect(s.percent).toBe(Math.round((1 / 4) * 100)); // 25
  });

  it("tracks the critical 'verified by phone' step separately", () => {
    // Everything except the critical step checked → not criticalComplete.
    const s = checklistStatus(
      items({
        "independent-number": true,
        "ignore-emailed-changes": true,
        "confirm-receipt": true,
      }),
    );
    expect(s.allComplete).toBe(false);
    expect(s.criticalComplete).toBe(false);
  });

  it("flags criticalComplete only when the verbal-verify step is checked", () => {
    const s = checklistStatus(items({ "call-verbally": true }));
    expect(s.criticalComplete).toBe(true);
  });

  it("reports allComplete when every box is checked", () => {
    const all = Object.fromEntries(WIRE_FRAUD_CHECKLIST.map((i) => [i.id, true]));
    const s = checklistStatus(items(all));
    expect(s.allComplete).toBe(true);
    expect(s.criticalComplete).toBe(true);
    expect(s.percent).toBe(100);
  });

  it("handles an empty list without dividing by zero", () => {
    const s = checklistStatus([]);
    expect(s.percent).toBe(0);
    expect(s.allComplete).toBe(false);
    expect(s.criticalComplete).toBe(false);
  });

  it("includes a critical step in the canonical checklist", () => {
    expect(WIRE_FRAUD_CHECKLIST.some((i) => i.critical)).toBe(true);
  });
});

describe("escrowStatus", () => {
  const base: EscrowTracker = {
    amount: 0,
    holder: "",
    dateSent: "",
    confirmationReceived: false,
  };

  it("is not-sent with no date and no confirmation", () => {
    expect(escrowStatus(base)).toBe("not-sent");
  });

  it("is sent when a date exists but receipt isn't confirmed", () => {
    expect(escrowStatus({ ...base, dateSent: "2026-06-08" })).toBe("sent");
  });

  it("is confirmed once receipt is confirmed", () => {
    expect(
      escrowStatus({ ...base, dateSent: "2026-06-08", confirmationReceived: true }),
    ).toBe("confirmed");
  });

  it("treats confirmation as the strongest signal even without a date", () => {
    expect(escrowStatus({ ...base, confirmationReceived: true })).toBe("confirmed");
  });

  it("ignores whitespace-only dates", () => {
    expect(escrowStatus({ ...base, dateSent: "   " })).toBe("not-sent");
  });
});
