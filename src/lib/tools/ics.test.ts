import { describe, expect, it } from "vitest";
import { computeMilestones, defaultOffsets, type Milestone } from "@/lib/deadlines";
import {
  buildICS,
  escapeICS,
  foldLine,
  icsFilename,
  milestoneToVEvent,
  milestoneUID,
} from "./ics";

const FIXED_NOW = Date.UTC(2026, 5, 12, 15, 30, 0); // 2026-06-12T15:30:00Z

function milestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: "inspection",
    label: "Inspection contingency ends",
    description: "Complete inspections before this date.",
    date: "2026-06-15",
    critical: true,
    ...overrides,
  };
}

describe("escapeICS", () => {
  it("escapes backslash, comma, semicolon, and newlines", () => {
    expect(escapeICS("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
    expect(escapeICS("line1\nline2")).toBe("line1\\nline2");
    expect(escapeICS("line1\r\nline2")).toBe("line1\\nline2");
  });

  it("leaves plain text and colons untouched", () => {
    expect(escapeICS("Closing day: bring funds")).toBe("Closing day: bring funds");
  });
});

describe("foldLine", () => {
  it("leaves short lines intact", () => {
    expect(foldLine("SUMMARY:short")).toBe("SUMMARY:short");
  });

  it("folds lines longer than 75 octets with CRLF + space", () => {
    const long = "DESCRIPTION:" + "x".repeat(200);
    const folded = foldLine(long);
    expect(folded).toContain("\r\n ");
    // Every physical line is at most 75 octets.
    for (const physical of folded.split("\r\n")) {
      expect(new TextEncoder().encode(physical).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("milestoneUID", () => {
  it("is stable for the same id + date (no duplicate on re-export)", () => {
    const m = milestone();
    expect(milestoneUID(m)).toBe(milestoneUID({ ...m }));
    expect(milestoneUID(m)).toBe("inspection-20260615@homeofferdirect");
  });

  it("changes when the date changes", () => {
    expect(milestoneUID(milestone({ date: "2026-06-15" }))).not.toBe(
      milestoneUID(milestone({ date: "2026-06-16" })),
    );
  });
});

describe("milestoneToVEvent", () => {
  it("emits an all-day DTSTART;VALUE=DATE with no time or Z", () => {
    const lines = milestoneToVEvent(milestone(), "20260612T153000Z");
    const dtstart = lines.find((l) => l.startsWith("DTSTART"))!;
    expect(dtstart).toBe("DTSTART;VALUE=DATE:20260615");
    expect(dtstart).not.toMatch(/T\d{6}/);
    expect(dtstart).not.toContain("Z");
  });

  it("includes UID, DTSTAMP, SUMMARY and a day-before VALARM", () => {
    const lines = milestoneToVEvent(milestone(), "20260612T153000Z");
    expect(lines[0]).toBe("BEGIN:VEVENT");
    expect(lines.at(-1)).toBe("END:VEVENT");
    expect(lines).toContain("UID:inspection-20260615@homeofferdirect");
    expect(lines).toContain("DTSTAMP:20260612T153000Z");
    expect(lines.some((l) => l.startsWith("SUMMARY:"))).toBe(true);
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("TRIGGER:-P1D");
    expect(lines).toContain("END:VALARM");
  });

  it("carries the neutral 'verify against your contract' guard, no advice (UPL)", () => {
    const lines = milestoneToVEvent(milestone(), "20260612T153000Z");
    const desc = lines.find((l) => l.startsWith("DESCRIPTION:"))!;
    expect(desc).toMatch(/verify against your contract/i);
    expect(desc).not.toMatch(/you (must|should)/i);
  });
});

describe("buildICS", () => {
  it("wraps events in a valid VCALENDAR envelope with VERSION and PRODID", () => {
    const ics = buildICS([milestone()], { now: FIXED_NOW });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("PRODID:");
  });

  it("uses CRLF line endings throughout", () => {
    const ics = buildICS([milestone()], { now: FIXED_NOW });
    // No bare LF that isn't preceded by CR.
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(ics).toContain("\r\n");
  });

  it("emits one VEVENT per milestone", () => {
    const ms = [
      milestone({ id: "earnest-money", date: "2026-06-13" }),
      milestone({ id: "inspection", date: "2026-06-15" }),
      milestone({ id: "closing", date: "2026-07-01" }),
    ];
    const ics = buildICS(ms, { now: FIXED_NOW });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(3);
  });

  it("produces a valid-but-empty calendar for an empty milestone list (no crash)", () => {
    const ics = buildICS([], { now: FIXED_NOW });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("escapes special characters in SUMMARY/DESCRIPTION", () => {
    const ics = buildICS(
      [milestone({ label: "Title review; objections, etc." })],
      { now: FIXED_NOW },
    );
    expect(ics).toContain("Title review\\; objections\\, etc.");
  });

  it("each VEVENT date matches the computeMilestones output (no drift)", () => {
    const milestones = computeMilestones({
      underContractDate: "2026-06-01",
      closingDate: "2026-07-01",
      offsets: defaultOffsets,
    });
    const ics = buildICS(milestones, { now: FIXED_NOW });
    for (const m of milestones) {
      const expected = `DTSTART;VALUE=DATE:${m.date.replace(/-/g, "")}`;
      expect(ics).toContain(expected);
    }
  });

  it("is stable across re-export (same UIDs) so calendars don't duplicate", () => {
    const ms = computeMilestones({
      underContractDate: "2026-06-01",
      closingDate: "2026-07-01",
      offsets: defaultOffsets,
    });
    const first = buildICS(ms, { now: FIXED_NOW });
    const second = buildICS(ms, { now: FIXED_NOW });
    expect(first).toBe(second);
    const uids = [...first.matchAll(/UID:([^\r\n]+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe("icsFilename", () => {
  it("slugifies a label into a .ics filename", () => {
    expect(icsFilename("My Deadlines")).toBe("my-deadlines.ics");
    expect(icsFilename("")).toBe("deadlines.ics");
  });
});
