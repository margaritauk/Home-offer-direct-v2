import { describe, expect, it } from "vitest";
import {
  monthMatrix,
  parseLocalDateTime,
  showingsByDay,
  toDateKey,
} from "./calendar";
import type { ShowingRecord } from "./types";

function record(over: Partial<ShowingRecord> = {}): ShowingRecord {
  return {
    listingId: over.listingId ?? "l1",
    address: "1 Main St",
    city: "Austin",
    state: "TX",
    status: "scheduled",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

describe("parseLocalDateTime", () => {
  it("reads wall-clock fields without a timezone shift", () => {
    expect(parseLocalDateTime("2026-06-15T14:30")).toEqual({
      date: "2026-06-15",
      minutes: 14 * 60 + 30,
    });
  });

  it("buckets a near-midnight time on the same local day everywhere", () => {
    // A naive `new Date(iso)` could roll this into the 14th or 16th depending
    // on the runner TZ; we always keep it on the 15th.
    expect(parseLocalDateTime("2026-06-15T23:30")?.date).toBe("2026-06-15");
    expect(parseLocalDateTime("2026-06-15T00:15")?.date).toBe("2026-06-15");
  });

  it("accepts a date-only value (midnight)", () => {
    expect(parseLocalDateTime("2026-06-15")).toEqual({
      date: "2026-06-15",
      minutes: 0,
    });
  });

  it("rejects missing / malformed / impossible dates", () => {
    expect(parseLocalDateTime(undefined)).toBeNull();
    expect(parseLocalDateTime("")).toBeNull();
    expect(parseLocalDateTime("not-a-date")).toBeNull();
    expect(parseLocalDateTime("2026-13-01T00:00")).toBeNull();
    expect(parseLocalDateTime("2026-02-30T00:00")).toBeNull();
    expect(parseLocalDateTime("2026-06-15T25:00")).toBeNull();
  });
});

describe("showingsByDay", () => {
  it("buckets across days and sorts the days ascending", () => {
    const days = showingsByDay([
      record({ listingId: "c", scheduledAt: "2026-06-20T09:00" }),
      record({ listingId: "a", scheduledAt: "2026-06-10T09:00" }),
      record({ listingId: "b", scheduledAt: "2026-06-15T09:00" }),
    ]);
    expect(days.map((d) => d.date)).toEqual([
      "2026-06-10",
      "2026-06-15",
      "2026-06-20",
    ]);
  });

  it("groups same-day records and sorts them by time of day", () => {
    const days = showingsByDay([
      record({ listingId: "late", scheduledAt: "2026-06-15T16:00" }),
      record({ listingId: "early", scheduledAt: "2026-06-15T08:30" }),
      record({ listingId: "noon", scheduledAt: "2026-06-15T12:00" }),
    ]);
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-06-15");
    expect(days[0].items.map((r) => r.listingId)).toEqual([
      "early",
      "noon",
      "late",
    ]);
  });

  it("ignores records without a valid scheduledAt", () => {
    const days = showingsByDay([
      record({ listingId: "ok", scheduledAt: "2026-06-15T10:00" }),
      record({ listingId: "none" }), // no scheduledAt
      record({ listingId: "blank", scheduledAt: "" }),
      record({ listingId: "bad", scheduledAt: "whenever" }),
    ]);
    expect(days).toHaveLength(1);
    expect(days[0].items.map((r) => r.listingId)).toEqual(["ok"]);
  });

  it("is defensive on empty / nullish input", () => {
    expect(showingsByDay([])).toEqual([]);
    // @ts-expect-error — defensive against runtime nullish.
    expect(showingsByDay(undefined)).toEqual([]);
  });
});

describe("monthMatrix", () => {
  it("returns full weeks of 7 cells starting on a Sunday", () => {
    const weeks = monthMatrix(2026, 5); // June 2026
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
    // The very first cell must be a Sunday.
    expect(new Date(weeks[0][0].date + "T00:00").getDay()).toBe(0);
    // And the very last cell a Saturday.
    const last = weeks[weeks.length - 1][6];
    expect(new Date(last.date + "T00:00").getDay()).toBe(6);
  });

  it("covers every day of the month exactly once and flags spill days", () => {
    // June 2026 has 30 days; June 1 2026 is a Monday (lead = 1).
    const weeks = monthMatrix(2026, 5);
    const cells = weeks.flat();
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(30);
    expect(inMonth[0].date).toBe("2026-06-01");
    expect(inMonth[inMonth.length - 1].date).toBe("2026-06-30");
    // Lead spill cell is the trailing day of May.
    expect(cells[0].inMonth).toBe(false);
    expect(cells[0].date).toBe("2026-05-31");
  });

  it("handles a month that starts on Sunday with no lead spill", () => {
    // Feb 2026 starts on a Sunday.
    const weeks = monthMatrix(2026, 1);
    expect(weeks[0][0].inMonth).toBe(true);
    expect(weeks[0][0].date).toBe("2026-02-01");
  });
});

describe("toDateKey", () => {
  it("formats local fields zero-padded", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
