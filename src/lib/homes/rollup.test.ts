import { describe, expect, it } from "vitest";
import { defaultOffsets } from "@/lib/deadlines";
import { totalDocuments } from "@/lib/documents";
import { buildHomeRollups, type RollupInput, type TrackerSnapshot } from "./rollup";
import type { OfferStatusMap } from "@/lib/offer-status/types";
import type { ShowingMap } from "@/lib/showings/types";

const TODAY = "2026-06-07";

const emptyTracker: TrackerSnapshot = {
  underContractDate: "",
  closingDate: "",
  offsets: { ...defaultOffsets },
  docs: {},
};

function showing(id: string, over: Partial<ShowingMap[string]> = {}) {
  return {
    listingId: id,
    address: `${id} Main St`,
    city: "Austin",
    state: "TX",
    status: "interested" as const,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

function offer(id: string, over: Partial<OfferStatusMap[string]> = {}) {
  return {
    listingId: id,
    status: "draft" as const,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

function input(over: Partial<RollupInput> = {}): RollupInput {
  return {
    progress: {},
    totalJourneyTasks: 10,
    showings: {},
    offers: {},
    tracker: emptyTracker,
    today: TODAY,
    ...over,
  };
}

describe("buildHomeRollups", () => {
  it("returns no rollups when nothing is tracked", () => {
    expect(buildHomeRollups(input())).toEqual([]);
  });

  it("lists the union of showing and offer homes", () => {
    const rollups = buildHomeRollups(
      input({
        showings: { L1: showing("L1"), L2: showing("L2") },
        offers: { L2: offer("L2"), L3: offer("L3") },
      }),
    );
    expect(rollups.map((r) => r.listingId).sort()).toEqual(["L1", "L2", "L3"]);
  });

  it("uses the showing address as the title and copies area", () => {
    const [r] = buildHomeRollups(
      input({ showings: { L1: showing("L1", { city: "Reno", state: "NV" }) } }),
    );
    expect(r.title).toBe("L1 Main St");
    expect(r.city).toBe("Reno");
    expect(r.state).toBe("NV");
  });

  it("falls back to the listing id when only an offer exists", () => {
    const [r] = buildHomeRollups(input({ offers: { L9: offer("L9") } }));
    expect(r.title).toBe("L9");
    expect(r.city).toBeUndefined();
    expect(r.showingStatus).toBeUndefined();
    expect(r.offerStatus).toBe("draft");
  });

  it("computes journey percent from progress / total tasks", () => {
    const [r] = buildHomeRollups(
      input({
        showings: { L1: showing("L1") },
        progress: { a: true, b: true, c: true },
        totalJourneyTasks: 10,
      }),
    );
    expect(r.journeyDone).toBe(3);
    expect(r.journeyTotal).toBe(10);
    expect(r.journeyPct).toBe(30);
  });

  it("reports 0% safely when there are no journey tasks", () => {
    const [r] = buildHomeRollups(
      input({ showings: { L1: showing("L1") }, totalJourneyTasks: 0 }),
    );
    expect(r.journeyPct).toBe(0);
  });

  it("surfaces showing and offer status", () => {
    const [r] = buildHomeRollups(
      input({
        showings: { L1: showing("L1", { status: "seen" }) },
        offers: { L1: offer("L1", { status: "sent" }) },
      }),
    );
    expect(r.showingStatus).toBe("seen");
    expect(r.offerStatus).toBe("sent");
  });

  it("includes the expiration countdown for an offer with a window", () => {
    const [r] = buildHomeRollups(
      input({
        offers: {
          L1: offer("L1", { status: "sent", expiresAt: "2026-06-09" }),
        },
      }),
    );
    expect(r.expiration?.hasExpiration).toBe(true);
    expect(r.expiration?.daysRemaining).toBe(2);
    expect(r.expiration?.urgency).toBe("soon");
  });

  it("computes the next upcoming deadline from the tracker dates", () => {
    const [r] = buildHomeRollups(
      input({
        showings: { L1: showing("L1") },
        tracker: {
          ...emptyTracker,
          underContractDate: "2026-06-06",
          closingDate: "2026-07-31",
        },
      }),
    );
    // Earnest money is 3 days after under-contract = 2026-06-09 (soonest >= today).
    expect(r.nextDeadline?.id).toBe("earnest-money");
    expect(r.nextDeadline?.date).toBe("2026-06-09");
    expect(r.nextDeadline?.daysAway).toBe(2);
    expect(r.nextDeadline?.status).toBe("soon");
  });

  it("has no next deadline when deal dates are unset", () => {
    const [r] = buildHomeRollups(input({ showings: { L1: showing("L1") } }));
    expect(r.nextDeadline).toBeUndefined();
  });

  it("counts outstanding documents (device-wide store)", () => {
    const [r] = buildHomeRollups(
      input({
        showings: { L1: showing("L1") },
        tracker: { ...emptyTracker, docs: { "pay-stubs": true, w2s: true } },
      }),
    );
    expect(r.outstandingDocs).toBe(totalDocuments() - 2);
  });

  it("sorts most-recently-updated first across either store", () => {
    const rollups = buildHomeRollups(
      input({
        showings: {
          L1: showing("L1", { updatedAt: "2026-06-01T00:00:00.000Z" }),
          L2: showing("L2", { updatedAt: "2026-06-05T00:00:00.000Z" }),
        },
        offers: {
          L1: offer("L1", { updatedAt: "2026-06-09T00:00:00.000Z" }),
        },
      }),
    );
    expect(rollups.map((r) => r.listingId)).toEqual(["L1", "L2"]);
  });

  describe("next-action hints", () => {
    function action(over: Partial<RollupInput>): { nextAction: string; nextHref: string } {
      const [r] = buildHomeRollups(input(over));
      return { nextAction: r.nextAction, nextHref: r.nextHref };
    }

    it("drives from the showing pipeline when there is no offer", () => {
      expect(action({ showings: { L1: showing("L1", { status: "interested" }) } }).nextHref).toBe("/showings");
      expect(action({ showings: { L1: showing("L1", { status: "seen" }) } }).nextHref).toBe("/tools/offer-builder");
      expect(action({ showings: { L1: showing("L1", { status: "offer" }) } }).nextHref).toBe("/offer-status");
    });

    it("tells a draft offer to finish and send", () => {
      const a = action({ offers: { L1: offer("L1", { status: "draft" }) } });
      expect(a.nextHref).toBe("/tools/offer-builder");
      expect(a.nextAction).toMatch(/send/i);
    });

    it("prompts to respond to a counter", () => {
      const a = action({ offers: { L1: offer("L1", { status: "countered" }) } });
      expect(a.nextAction).toMatch(/counter/i);
      expect(a.nextHref).toBe("/offer-status");
    });

    it("escalates an expired window", () => {
      const a = action({
        offers: {
          L1: offer("L1", { status: "sent", expiresAt: "2026-06-01" }),
        },
      });
      expect(a.nextAction).toMatch(/expired/i);
      expect(a.nextHref).toBe("/offer-status");
    });

    it("flags an offer expiring today", () => {
      const a = action({
        offers: {
          L1: offer("L1", { status: "sent", expiresAt: TODAY }),
        },
      });
      expect(a.nextAction).toMatch(/today/i);
    });

    it("points an accepted offer to the deadline tracker", () => {
      const a = action({ offers: { L1: offer("L1", { status: "accepted" }) } });
      expect(a.nextHref).toBe("/tracker");
    });
  });
});
