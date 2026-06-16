import { describe, expect, it } from "vitest";
import {
  attentionCount,
  computeNextActions,
  CONTRACT_GOVERNS_NOTE,
  MAX_NEXT_ACTIONS,
  rankNextActions,
} from "./next-actions";
import type { HomeRollup } from "@/lib/homes/rollup";
import type { MilestoneStatus } from "@/lib/deadlines";

const TODAY = "2026-06-16";

function rollup(over: Partial<HomeRollup> = {}): HomeRollup {
  return {
    listingId: over.listingId ?? "home-1",
    title: over.title ?? "123 Main St",
    journeyPct: 0,
    journeyDone: 0,
    journeyTotal: 14,
    outstandingDocs: 0,
    nextAction: over.nextAction ?? "Keep your search moving.",
    nextHref: over.nextHref ?? "/showings",
    ...over,
  };
}

function withDeadline(
  listingId: string,
  date: string,
  daysAway: number,
  status: MilestoneStatus,
  label = "Inspection contingency ends",
): HomeRollup {
  return rollup({
    listingId,
    nextHref: "/tracker",
    nextDeadline: { id: "inspection", label, date, status, daysAway },
  });
}

describe("computeNextActions", () => {
  it("turns a dated milestone into a verb-led, process-framed action with urgency", () => {
    const actions = computeNextActions(
      [withDeadline("h1", "2026-06-19", 3, "soon")],
      TODAY,
    );
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Schedule your inspection");
    expect(actions[0].why).toMatch(/due in 3 days/i);
    expect(actions[0].urgency).toBe("soon");
    expect(actions[0].hasDate).toBe(true);
    expect(actions[0].href).toBe("/tracker");
  });

  it("recomputes urgency from `today`, not the rollup's stored status", () => {
    // Rollup says "upcoming" but the date is in the past relative to today.
    const stale = withDeadline("h1", "2026-06-10", 10, "upcoming");
    const [action] = computeNextActions([stale], TODAY);
    expect(action.urgency).toBe("overdue");
  });

  it("falls back to the rollup next-action string when there is no dated milestone", () => {
    const [action] = computeNextActions(
      [rollup({ listingId: "h1", nextAction: "Request a showing for this home.", nextHref: "/showings" })],
      TODAY,
    );
    expect(action.title).toBe("Request a showing for this home.");
    expect(action.hasDate).toBe(false);
    expect(action.urgency).toBeUndefined();
  });

  it("returns no actions for an empty rollup list", () => {
    expect(computeNextActions([], TODAY)).toEqual([]);
  });
});

describe("rankNextActions", () => {
  it("orders overdue → today → soon → upcoming → dateless", () => {
    const ranked = rankNextActions(
      [
        rollup({ listingId: "dateless", nextAction: "Keep moving." }),
        withDeadline("upcoming", "2026-07-01", 15, "upcoming"),
        withDeadline("overdue", "2026-06-01", -15, "overdue"),
        withDeadline("today", "2026-06-16", 0, "today"),
        withDeadline("soon", "2026-06-18", 2, "soon"),
      ],
      TODAY,
      10,
    );
    expect(ranked.map((a) => a.id)).toEqual([
      "overdue",
      "today",
      "soon",
      "upcoming",
      "dateless",
    ]);
  });

  it("caps the result at MAX_NEXT_ACTIONS by default", () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      withDeadline(`h${i}`, "2026-06-20", 4, "upcoming"),
    );
    expect(rankNextActions(many, TODAY)).toHaveLength(MAX_NEXT_ACTIONS);
  });

  it("breaks ties within an urgency bucket by soonest date", () => {
    const ranked = rankNextActions(
      [
        withDeadline("later", "2026-06-19", 3, "soon"),
        withDeadline("sooner", "2026-06-17", 1, "soon"),
      ],
      TODAY,
      10,
    );
    expect(ranked.map((a) => a.id)).toEqual(["sooner", "later"]);
  });

  it("respects a custom limit", () => {
    const ranked = rankNextActions(
      [
        withDeadline("a", "2026-06-17", 1, "soon"),
        withDeadline("b", "2026-06-18", 2, "soon"),
      ],
      TODAY,
      1,
    );
    expect(ranked).toHaveLength(1);
  });
});

describe("attentionCount", () => {
  it("counts overdue/today/soon actions, not upcoming or dateless", () => {
    const actions = rankNextActions(
      [
        withDeadline("overdue", "2026-06-01", -15, "overdue"),
        withDeadline("soon", "2026-06-18", 2, "soon"),
        withDeadline("upcoming", "2026-07-10", 24, "upcoming"),
        rollup({ listingId: "dateless" }),
      ],
      TODAY,
      10,
    );
    expect(attentionCount(actions)).toBe(2);
  });
});

describe("UPL framing", () => {
  it("exposes the contract-governs note for date-bearing actions", () => {
    expect(CONTRACT_GOVERNS_NOTE).toMatch(/contract governs/i);
    expect(CONTRACT_GOVERNS_NOTE).toMatch(/no deadline here is of record/i);
  });

  it("never emits a directive ('you should'/'waive') in generated copy", () => {
    const ranked = rankNextActions(
      [
        withDeadline("h1", "2026-06-19", 3, "soon", "Inspection contingency ends"),
        withDeadline("h2", "2026-06-20", 4, "upcoming", "Financing contingency ends"),
      ],
      TODAY,
      10,
    );
    for (const a of ranked) {
      expect(a.title.toLowerCase()).not.toMatch(/you should|waive|must/);
      expect(a.why.toLowerCase()).not.toMatch(/you should|waive/);
    }
  });
});
