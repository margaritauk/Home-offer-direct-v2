import { describe, expect, it } from "vitest";
import {
  addDays,
  businessDaysBefore,
  closingCountdownLabel,
  computeMilestones,
  daysBetween,
  daysToClosing,
  defaultOffsets,
  isValidDate,
  parseDate,
  statusFor,
} from "./deadlines";

describe("date helpers", () => {
  it("validates and rejects impossible dates", () => {
    expect(isValidDate("2026-06-06")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate("")).toBe(false);
    expect(Number.isNaN(parseDate("garbage"))).toBe(true);
  });

  it("adds calendar days across month boundaries", () => {
    expect(addDays("2026-06-06", 10)).toBe("2026-06-16");
    expect(addDays("2026-06-28", 5)).toBe("2026-07-03");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes signed day differences", () => {
    expect(daysBetween("2026-06-06", "2026-06-16")).toBe(10);
    expect(daysBetween("2026-06-16", "2026-06-06")).toBe(-10);
    expect(daysBetween("2026-06-06", "2026-06-06")).toBe(0);
  });
});

describe("businessDaysBefore (Closing Disclosure rule)", () => {
  it("skips weekends", () => {
    // Closing on Mon 2026-06-15. 3 business days before = Wed 2026-06-10
    // (skips Sat 13 & Sun 14: Fri 12, Thu 11, Wed 10).
    expect(businessDaysBefore("2026-06-15", 3)).toBe("2026-06-10");
  });

  it("counts plain weekdays when no weekend intervenes", () => {
    // Closing Fri 2026-06-12; 3 business days before = Tue 2026-06-09.
    expect(businessDaysBefore("2026-06-12", 3)).toBe("2026-06-09");
  });

  it("lands on a weekday result", () => {
    const d = businessDaysBefore("2026-06-15", 3);
    const dow = new Date(parseDate(d)).getUTCDay();
    expect(dow).not.toBe(0);
    expect(dow).not.toBe(6);
  });
});

describe("daysToClosing", () => {
  const today = "2026-06-07";
  it("counts days remaining for a future closing", () => {
    expect(daysToClosing("2026-06-17", today)).toBe(10);
  });
  it("returns 0 when closing is today", () => {
    expect(daysToClosing("2026-06-07", today)).toBe(0);
  });
  it("returns a negative number once closing has passed", () => {
    expect(daysToClosing("2026-06-01", today)).toBe(-6);
  });
  it("returns null for an invalid or empty closing date", () => {
    expect(daysToClosing("", today)).toBeNull();
    expect(daysToClosing("not-a-date", today)).toBeNull();
    expect(daysToClosing("2026-02-30", today)).toBeNull();
  });
  it("returns null when today is invalid", () => {
    expect(daysToClosing("2026-06-17", "")).toBeNull();
  });
});

describe("closingCountdownLabel", () => {
  it("renders nothing for null", () => {
    expect(closingCountdownLabel(null)).toBe("");
  });
  it("renders days remaining (pluralized)", () => {
    expect(closingCountdownLabel(10)).toBe("10 days to closing");
    expect(closingCountdownLabel(1)).toBe("1 day to closing");
  });
  it("renders closing today", () => {
    expect(closingCountdownLabel(0)).toBe("Closing today");
  });
  it("renders a past closing (pluralized)", () => {
    expect(closingCountdownLabel(-6)).toBe("Closed 6 days ago");
    expect(closingCountdownLabel(-1)).toBe("Closed 1 day ago");
  });
});

describe("statusFor", () => {
  const today = "2026-06-06";
  it("flags overdue, today, soon, and upcoming", () => {
    expect(statusFor("2026-06-01", today)).toBe("overdue");
    expect(statusFor("2026-06-06", today)).toBe("today");
    expect(statusFor("2026-06-08", today)).toBe("soon"); // within 3 days
    expect(statusFor("2026-06-20", today)).toBe("upcoming");
  });
});

describe("computeMilestones", () => {
  const input = {
    underContractDate: "2026-06-01",
    closingDate: "2026-07-01",
    offsets: defaultOffsets,
  };

  it("returns an empty timeline for invalid dates", () => {
    expect(computeMilestones({ ...input, underContractDate: "bad" })).toEqual([]);
    expect(computeMilestones({ ...input, closingDate: "" })).toEqual([]);
  });

  it("produces all eight milestones sorted by date", () => {
    const ms = computeMilestones(input);
    expect(ms).toHaveLength(8);
    const dates = ms.map((m) => m.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("anchors offset milestones to the contract date", () => {
    const ms = computeMilestones(input);
    const inspection = ms.find((m) => m.id === "inspection");
    expect(inspection?.date).toBe(addDays("2026-06-01", defaultOffsets.inspectionContingencyDays));
  });

  it("applies the 3-business-day rule to the Closing Disclosure", () => {
    const ms = computeMilestones(input);
    const cd = ms.find((m) => m.id === "closing-disclosure");
    expect(cd?.date).toBe(businessDaysBefore("2026-07-01", 3));
  });

  it("puts the final walkthrough the day before closing and closing last", () => {
    const ms = computeMilestones(input);
    expect(ms.find((m) => m.id === "final-walkthrough")?.date).toBe("2026-06-30");
    expect(ms[ms.length - 1].id).toBe("closing");
  });

  it("marks the trust-critical milestones", () => {
    const ms = computeMilestones(input);
    const critical = ms.filter((m) => m.critical).map((m) => m.id);
    expect(critical).toContain("closing-disclosure");
    expect(critical).toContain("financing");
    expect(critical).toContain("earnest-money");
  });
});
