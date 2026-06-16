/**
 * Reminder scheduling math (S1-R1). Load-bearing — mirrors deadlines.test.ts.
 * Covers: milestone → fire-datetime, UTC YYYY-MM-DD normalization, lead-time
 * fan-out, dedupe, no-double-arm on re-entry, invalid-date skipping.
 */
import { describe, expect, it } from "vitest";
import {
  armedMilestoneCount,
  computeReminders,
  DEFAULT_LEAD_DAYS,
  type Reminder,
} from "./schedule";
import { computeMilestones, defaultOffsets, type Milestone } from "@/lib/deadlines";

const DEAL = "deal-abc";

function milestone(id: string, date: string, label = id): Milestone {
  return { id, label, description: "", date };
}

describe("computeReminders — milestone → fire-datetime", () => {
  it("arms a reminder at each lead-time before the milestone date", () => {
    const reminders = computeReminders([milestone("inspection", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [3, 1, 0],
    });
    expect(reminders.map((r) => r.fireAtISO)).toEqual([
      "2026-06-17", // T-3
      "2026-06-19", // T-1
      "2026-06-20", // day-of
    ]);
  });

  it("defaults to DEFAULT_LEAD_DAYS when none supplied", () => {
    const reminders = computeReminders([milestone("m", "2026-06-20")], { dealId: DEAL });
    expect(reminders).toHaveLength(DEFAULT_LEAD_DAYS.length);
  });

  it("computes fire dates in the UTC YYYY-MM-DD frame across a month boundary", () => {
    const reminders = computeReminders([milestone("m", "2026-07-02")], {
      dealId: DEAL,
      leadDays: [3],
    });
    expect(reminders[0].fireAtISO).toBe("2026-06-29");
  });

  it("handles day-of (lead 0) as the milestone date itself", () => {
    const reminders = computeReminders([milestone("m", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [0],
    });
    expect(reminders[0].fireAtISO).toBe("2026-06-20");
    expect(reminders[0].leadDays).toBe(0);
  });

  it("carries the process label and channel through", () => {
    const [r] = computeReminders(
      [milestone("inspection", "2026-06-20", "Inspection contingency ends")],
      { dealId: DEAL, leadDays: [1], channels: ["in_app"] },
    );
    expect(r.label).toBe("Inspection contingency ends");
    expect(r.channel).toBe("in_app");
  });
});

describe("computeReminders — dedupe + no double-arm", () => {
  it("de-duplicates overlapping fire-dates within a milestone via dedupeKey", () => {
    // Two lead-times that resolve to the same fire date must collapse to one.
    const reminders = computeReminders([milestone("m", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [1, 1],
    });
    expect(reminders).toHaveLength(1);
  });

  it("produces an identical set on re-entry with the same dates (no double-arm)", () => {
    const input: Milestone[] = [milestone("m", "2026-06-20")];
    const first = computeReminders(input, { dealId: DEAL, leadDays: [3, 1, 0] });
    const second = computeReminders(input, { dealId: DEAL, leadDays: [3, 1, 0] });
    expect(second.map((r) => r.dedupeKey)).toEqual(first.map((r) => r.dedupeKey));
  });

  it("keys dedupe on (deal, milestone, channel, fire-date)", () => {
    const [r] = computeReminders([milestone("inspection", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [1],
    });
    expect(r.dedupeKey).toBe(`${DEAL}:inspection:in_app:2026-06-19`);
  });

  it("arms separate reminders per channel", () => {
    const reminders = computeReminders([milestone("m", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [1],
      channels: ["in_app", "push"],
    });
    expect(reminders.map((r) => r.channel).sort()).toEqual(["in_app", "push"]);
  });
});

describe("computeReminders — invalid input", () => {
  it("skips milestones with an invalid date", () => {
    const reminders = computeReminders(
      [milestone("good", "2026-06-20"), milestone("bad", "not-a-date")],
      { dealId: DEAL, leadDays: [1] },
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].milestoneId).toBe("good");
  });

  it("returns an empty set for no milestones", () => {
    expect(computeReminders([], { dealId: DEAL })).toEqual([]);
  });
});

describe("computeReminders — composes the shipped milestone engine", () => {
  it("derives reminders from computeMilestones output with no new plumbing", () => {
    const milestones = computeMilestones({
      underContractDate: "2026-06-01",
      closingDate: "2026-07-01",
      offsets: defaultOffsets,
    });
    const reminders = computeReminders(milestones, { dealId: DEAL, leadDays: [1] });
    // One reminder per computed milestone (all dates valid, distinct).
    expect(reminders).toHaveLength(milestones.length);
    expect(armedMilestoneCount(reminders)).toBe(milestones.length);
  });
});

describe("armedMilestoneCount", () => {
  it("counts distinct milestones, not individual lead-time reminders", () => {
    const reminders: Reminder[] = computeReminders([milestone("m", "2026-06-20")], {
      dealId: DEAL,
      leadDays: [3, 1, 0],
    });
    expect(reminders.length).toBe(3);
    expect(armedMilestoneCount(reminders)).toBe(1);
  });
});
