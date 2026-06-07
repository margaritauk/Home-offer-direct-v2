import { describe, expect, it } from "vitest";
import {
  expirationInfo,
  offerStatusReducer,
  shouldAutoExpire,
  type OfferStatusAction,
} from "./reducer";
import type { OfferStatusMap, OfferStatusRecord } from "./types";

const NOW = "2026-06-07T12:00:00.000Z";

function reduce(state: OfferStatusMap, ...actions: OfferStatusAction[]) {
  return actions.reduce((s, a) => offerStatusReducer(s, a), state);
}

describe("offerStatusReducer", () => {
  it("upserts a new draft record with timestamps", () => {
    const next = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    const rec = next.L1;
    expect(rec.status).toBe("draft");
    expect(rec.createdAt).toBe(NOW);
    expect(rec.updatedAt).toBe(NOW);
    expect(rec.notes).toBeUndefined();
  });

  it("honours an explicit status, dates, and initial note on upsert", () => {
    const next = offerStatusReducer(
      {},
      {
        type: "upsert",
        input: {
          listingId: "L1",
          status: "sent",
          sentAt: "2026-06-01",
          expiresAt: "2026-06-10",
          note: "Sent via email",
        },
        now: NOW,
      },
    );
    const rec = next.L1;
    expect(rec.status).toBe("sent");
    expect(rec.sentAt).toBe("2026-06-01");
    expect(rec.expiresAt).toBe("2026-06-10");
    expect(rec.notes).toEqual([
      { at: NOW, status: "sent", text: "Sent via email" },
    ]);
  });

  it("upsert on an existing record patches instead of overwriting history", () => {
    const after = reduce(
      {},
      { type: "upsert", input: { listingId: "L1", note: "first" }, now: NOW },
      {
        type: "upsert",
        input: { listingId: "L1", status: "sent", note: "second" },
        now: "2026-06-08T00:00:00.000Z",
      },
    );
    const rec = after.L1;
    expect(rec.status).toBe("sent");
    expect(rec.createdAt).toBe(NOW); // preserved
    expect(rec.notes).toHaveLength(2);
    expect(rec.notes?.[1].text).toBe("second");
  });

  it("advances status through the pipeline and bumps updatedAt", () => {
    let state = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    for (const status of ["sent", "submitted", "countered", "accepted"] as const) {
      state = offerStatusReducer(state, {
        type: "setStatus",
        listingId: "L1",
        status,
        now: "2026-06-09T00:00:00.000Z",
      });
      expect(state.L1.status).toBe(status);
    }
    expect(state.L1.updatedAt).toBe("2026-06-09T00:00:00.000Z");
  });

  it("records a note alongside a status change", () => {
    const state = reduce(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
      {
        type: "setStatus",
        listingId: "L1",
        status: "rejected",
        note: "Seller went with a cash buyer",
        now: NOW,
      },
    );
    expect(state.L1.notes).toEqual([
      { at: NOW, status: "rejected", text: "Seller went with a cash buyer" },
    ]);
  });

  it("ignores blank/whitespace notes", () => {
    const state = reduce(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
      { type: "patch", listingId: "L1", patch: { note: "   " }, now: NOW },
    );
    expect(state.L1.notes).toBeUndefined();
  });

  it("patch/setStatus are no-ops for an unknown home", () => {
    const start = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    const a = offerStatusReducer(start, {
      type: "patch",
      listingId: "missing",
      patch: { status: "sent" },
    });
    const b = offerStatusReducer(start, {
      type: "setStatus",
      listingId: "missing",
      status: "sent",
    });
    expect(a).toBe(start);
    expect(b).toBe(start);
  });

  it("patch can clear a date by passing an empty string", () => {
    const state = reduce(
      {},
      {
        type: "upsert",
        input: { listingId: "L1", expiresAt: "2026-06-10" },
        now: NOW,
      },
      { type: "patch", listingId: "L1", patch: { expiresAt: "" }, now: NOW },
    );
    expect(state.L1.expiresAt).toBe("");
  });

  it("removes a record and is a no-op when absent", () => {
    const start = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    const removed = offerStatusReducer(start, {
      type: "remove",
      listingId: "L1",
    });
    expect(removed.L1).toBeUndefined();
    expect(offerStatusReducer(removed, { type: "remove", listingId: "L1" })).toBe(
      removed,
    );
  });

  it("clear empties the map", () => {
    const start = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    expect(offerStatusReducer(start, { type: "clear" })).toEqual({});
  });

  it("does not mutate the previous state", () => {
    const start = offerStatusReducer(
      {},
      { type: "upsert", input: { listingId: "L1" }, now: NOW },
    );
    const next = offerStatusReducer(start, {
      type: "setStatus",
      listingId: "L1",
      status: "sent",
      now: NOW,
    });
    expect(next).not.toBe(start);
    expect(start.L1.status).toBe("draft");
  });
});

describe("expirationInfo", () => {
  function rec(
    partial: Partial<OfferStatusRecord>,
  ): Pick<OfferStatusRecord, "expiresAt" | "status"> {
    return { status: "sent", ...partial };
  }

  it("returns the no-expiration shape when unset", () => {
    const info = expirationInfo(rec({}), "2026-06-07");
    expect(info.hasExpiration).toBe(false);
    expect(info.daysRemaining).toBeNull();
    expect(info.urgency).toBe("none");
    expect(info.isExpired).toBe(false);
  });

  it("counts down upcoming windows", () => {
    const info = expirationInfo(
      rec({ expiresAt: "2026-06-20" }),
      "2026-06-07",
    );
    expect(info.daysRemaining).toBe(13);
    expect(info.urgency).toBe("upcoming");
    expect(info.label).toBe("13 days left");
    expect(info.isExpired).toBe(false);
  });

  it("flags 'soon' within the 3-day window and 'today' on the day", () => {
    expect(
      expirationInfo(rec({ expiresAt: "2026-06-09" }), "2026-06-07").urgency,
    ).toBe("soon");
    expect(
      expirationInfo(rec({ expiresAt: "2026-06-07" }), "2026-06-07").urgency,
    ).toBe("today");
    expect(
      expirationInfo(rec({ expiresAt: "2026-06-07" }), "2026-06-07").label,
    ).toBe("Expires today");
  });

  it("marks a lapsed window expired and labels how long ago", () => {
    const info = expirationInfo(
      rec({ expiresAt: "2026-06-05" }),
      "2026-06-07",
    );
    expect(info.urgency).toBe("expired");
    expect(info.isExpired).toBe(true);
    expect(info.daysRemaining).toBe(-2);
    expect(info.label).toBe("Expired 2 days ago");
  });

  it("does not treat resolved offers as expired even past the date", () => {
    for (const status of ["accepted", "rejected", "expired"] as const) {
      const info = expirationInfo(
        rec({ expiresAt: "2026-06-05", status }),
        "2026-06-07",
      );
      expect(info.isExpired).toBe(false);
      expect(info.urgency).toBe("none");
    }
  });

  it("accepts full ISO datetimes for both the record and today", () => {
    const info = expirationInfo(
      rec({ expiresAt: "2026-06-10T17:00:00.000Z" }),
      "2026-06-07T12:00:00.000Z",
    );
    expect(info.daysRemaining).toBe(3);
    expect(info.urgency).toBe("soon");
  });

  it("singularises one day in either direction", () => {
    expect(
      expirationInfo(rec({ expiresAt: "2026-06-08" }), "2026-06-07").label,
    ).toBe("1 day left");
    expect(
      expirationInfo(rec({ expiresAt: "2026-06-06" }), "2026-06-07").label,
    ).toBe("Expired 1 day ago");
  });
});

describe("shouldAutoExpire", () => {
  it("is true only for a lapsed, non-terminal offer", () => {
    expect(
      shouldAutoExpire(
        { expiresAt: "2026-06-05", status: "sent" },
        "2026-06-07",
      ),
    ).toBe(true);
    expect(
      shouldAutoExpire(
        { expiresAt: "2026-06-10", status: "sent" },
        "2026-06-07",
      ),
    ).toBe(false);
    expect(
      shouldAutoExpire(
        { expiresAt: "2026-06-05", status: "accepted" },
        "2026-06-07",
      ),
    ).toBe(false);
  });
});
