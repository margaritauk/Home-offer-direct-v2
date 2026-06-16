/**
 * Reminder delivery deriver (S1-R1). Load-bearing — covers idempotency,
 * past-due suppression, re-fire diffing on date move, and the dedupe window.
 */
import { describe, expect, it } from "vitest";
import { diffReminders, dueReminders } from "./due";
import { computeReminders, type Reminder } from "./schedule";
import { computeMilestones, defaultOffsets } from "@/lib/deadlines";

const DEAL = "deal-1";

function reminderSet(milestoneDate: string): Reminder[] {
  return computeReminders(
    [{ id: "inspection", label: "Inspection contingency ends", description: "", date: milestoneDate }],
    { dealId: DEAL, leadDays: [3, 1, 0] },
  );
}

describe("dueReminders — fire window (lastSeen, now]", () => {
  const reminders = reminderSet("2026-06-20"); // fires 06-17, 06-19, 06-20

  it("surfaces reminders whose fire date is at/under now and after the watermark", () => {
    const due = dueReminders(reminders, "2026-06-16", "2026-06-19");
    expect(due.map((r) => r.fireAtISO)).toEqual(["2026-06-17", "2026-06-19"]);
  });

  it("does not surface reminders that fire after now", () => {
    const due = dueReminders(reminders, "2026-06-16", "2026-06-17");
    expect(due.map((r) => r.fireAtISO)).toEqual(["2026-06-17"]);
  });

  it("catches up everything up to now when there is no watermark (first visit)", () => {
    const due = dueReminders(reminders, "", "2026-06-20");
    expect(due.map((r) => r.fireAtISO)).toEqual(["2026-06-17", "2026-06-19", "2026-06-20"]);
  });

  it("returns nothing when now is invalid", () => {
    expect(dueReminders(reminders, "2026-06-16", "bad")).toEqual([]);
  });
});

describe("dueReminders — idempotency", () => {
  const reminders = reminderSet("2026-06-20");

  it("is idempotent: re-running with the same watermark yields the same set", () => {
    const a = dueReminders(reminders, "2026-06-16", "2026-06-19");
    const b = dueReminders(reminders, "2026-06-16", "2026-06-19");
    expect(b.map((r) => r.dedupeKey)).toEqual(a.map((r) => r.dedupeKey));
  });

  it("fires nothing once the watermark is advanced to now (no re-fire)", () => {
    // Deliver up to 06-19, then advance the watermark to 06-19.
    const due = dueReminders(reminders, "2026-06-19", "2026-06-19");
    expect(due).toEqual([]);
  });

  it("de-duplicates identical dedupeKeys in the input", () => {
    const dup = [...reminders, ...reminders];
    const due = dueReminders(dup, "2026-06-16", "2026-06-20");
    expect(due).toHaveLength(3);
  });
});

describe("dueReminders — past-due suppression on a backward date move", () => {
  it("does not fire a historical burst when a date moves to the past", () => {
    // Originally closing far out; user already saw up through 06-30.
    const moved = reminderSet("2026-01-10"); // all fire dates in January (past)
    const due = dueReminders(moved, "2026-06-30", "2026-07-01");
    // Watermark is after every fire date ⇒ nothing re-fires.
    expect(due).toEqual([]);
  });

  it("only schedules future-dated reminders relative to the watermark", () => {
    const reminders = reminderSet("2026-06-25"); // fires 06-22, 06-24, 06-25
    const due = dueReminders(reminders, "2026-06-23", "2026-06-25");
    expect(due.map((r) => r.fireAtISO)).toEqual(["2026-06-24", "2026-06-25"]);
  });
});

describe("diffReminders — re-fire on date move", () => {
  it("arms the new/rescheduled reminders and cancels the stale ones", () => {
    const before = reminderSet("2026-06-20");
    const after = reminderSet("2026-06-27"); // closing pushed a week later
    const { toArm, toCancel } = diffReminders(before, after);
    // None of the old fire-dates survive; all new ones are armed.
    expect(toArm).toHaveLength(after.length);
    expect(toCancel).toHaveLength(before.length);
    expect(toArm.every((r) => !before.some((b) => b.dedupeKey === r.dedupeKey))).toBe(true);
  });

  it("leaves unchanged reminders untouched (no double-arm)", () => {
    const before = reminderSet("2026-06-20");
    const after = reminderSet("2026-06-20");
    const { toArm, toCancel } = diffReminders(before, after);
    expect(toArm).toEqual([]);
    expect(toCancel).toEqual([]);
  });

  it("arms everything from an empty prior set", () => {
    const after = reminderSet("2026-06-20");
    const { toArm, toCancel } = diffReminders([], after);
    expect(toArm).toHaveLength(after.length);
    expect(toCancel).toEqual([]);
  });

  it("cancels everything when the deal's dates are cleared", () => {
    const before = reminderSet("2026-06-20");
    const { toArm, toCancel } = diffReminders(before, []);
    expect(toArm).toEqual([]);
    expect(toCancel).toHaveLength(before.length);
  });
});

describe("dueReminders — timezone correctness", () => {
  it("fires on the calendar day a YYYY-MM-DD date names, no off-by-one", () => {
    // A reminder whose fire date is exactly 'now' is due (boundary inclusive).
    const reminders = computeReminders(
      [{ id: "closing", label: "Closing day", description: "", date: "2026-06-16" }],
      { dealId: DEAL, leadDays: [0] },
    );
    expect(dueReminders(reminders, "2026-06-15", "2026-06-16")).toHaveLength(1);
    // The day before, it is not yet due.
    expect(dueReminders(reminders, "2026-06-14", "2026-06-15")).toHaveLength(0);
  });
});

describe("integration — full deal lifecycle", () => {
  it("re-fires correctly when the under-contract date moves", () => {
    const opts = { dealId: DEAL, leadDays: [1] };
    const before = computeReminders(
      computeMilestones({ underContractDate: "2026-06-01", closingDate: "2026-07-01", offsets: defaultOffsets }),
      opts,
    );
    const after = computeReminders(
      computeMilestones({ underContractDate: "2026-06-05", closingDate: "2026-07-05", offsets: defaultOffsets }),
      opts,
    );
    const diff = diffReminders(before, after);
    // Every milestone shifted by the date move ⇒ all rescheduled.
    expect(diff.toArm.length).toBeGreaterThan(0);
    expect(diff.toCancel.length).toBeGreaterThan(0);
  });
});
