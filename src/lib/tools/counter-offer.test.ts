import { describe, expect, it } from "vitest";
import { currentTerms, type Round } from "./counter-offer";

function round(partial: Partial<Round>): Round {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    who: partial.who ?? "buyer",
    price: partial.price ?? 0,
    termChanges: partial.termChanges,
    date: partial.date ?? "2026-06-08",
    status: partial.status ?? "sent",
  };
}

describe("currentTerms", () => {
  it("returns an awaiting state for no rounds", () => {
    const t = currentTerms([]);
    expect(t.latest).toBeNull();
    expect(t.livePrice).toBeNull();
    expect(t.ballWith).toBeNull();
    expect(t.accepted).toBe(false);
    expect(t.rejected).toBe(false);
    expect(t.roundCount).toBe(0);
  });

  it("takes the live price from the latest round", () => {
    const t = currentTerms([
      round({ who: "buyer", price: 500_000, status: "sent" }),
      round({ who: "seller", price: 520_000, status: "countered" }),
    ]);
    expect(t.livePrice).toBe(520_000);
    expect(t.roundCount).toBe(2);
  });

  it("puts the ball with the other party after a sent/countered move", () => {
    const buyerSent = currentTerms([round({ who: "buyer", status: "sent" })]);
    expect(buyerSent.ballWith).toBe("seller");

    const sellerCountered = currentTerms([round({ who: "seller", status: "countered" })]);
    expect(sellerCountered.ballWith).toBe("buyer");
  });

  it("keeps the ball with the receiving party on a 'received' status", () => {
    const t = currentTerms([round({ who: "buyer", status: "received" })]);
    expect(t.ballWith).toBe("buyer");
  });

  it("marks accepted and clears the ball", () => {
    const t = currentTerms([
      round({ who: "buyer", price: 500_000, status: "sent" }),
      round({ who: "seller", price: 500_000, status: "accepted" }),
    ]);
    expect(t.accepted).toBe(true);
    expect(t.ballWith).toBeNull();
  });

  it("treats a final rejection as rejected with no ball", () => {
    const t = currentTerms([
      round({ who: "buyer", status: "sent" }),
      round({ who: "seller", status: "rejected" }),
    ]);
    expect(t.rejected).toBe(true);
    expect(t.ballWith).toBeNull();
  });

  it("reopens after a rejection when a later counter exists", () => {
    const t = currentTerms([
      round({ who: "seller", status: "rejected" }),
      round({ who: "buyer", price: 510_000, status: "countered" }),
    ]);
    expect(t.rejected).toBe(false);
    expect(t.ballWith).toBe("seller");
    expect(t.livePrice).toBe(510_000);
  });

  it("nulls the live price when the latest price is invalid", () => {
    const t = currentTerms([round({ price: 0, status: "sent" })]);
    expect(t.livePrice).toBeNull();
  });
});
