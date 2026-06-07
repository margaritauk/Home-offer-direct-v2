import { describe, expect, it } from "vitest";
import { mergeFlags, mergeOffer, mergeShowings, mergeSyncData } from "./merge";
import { defaultOffsets } from "@/lib/deadlines";
import type { SyncData } from "./types";
import type { ShowingRecord } from "@/lib/showings/types";

const tracker = (over: Partial<SyncData["tracker"]> = {}): SyncData["tracker"] => ({
  underContractDate: "",
  closingDate: "",
  offsets: { ...defaultOffsets },
  docs: {},
  ...over,
});

const data = (over: Partial<SyncData> = {}): SyncData => ({
  progress: {},
  stateCode: null,
  tracker: tracker(),
  offer: null,
  showings: {},
  ...over,
});

const showing = (id: string, updatedAt: string, over: Partial<ShowingRecord> = {}): ShowingRecord => ({
  listingId: id,
  address: "1 Test St",
  city: "Townsville",
  state: "CA",
  status: "interested",
  createdAt: updatedAt,
  updatedAt,
  ...over,
});

describe("mergeFlags", () => {
  it("unions the truthy keys from both sides", () => {
    expect(mergeFlags({ a: true }, { b: true })).toEqual({ a: true, b: true });
  });
  it("keeps a key done if either side has it", () => {
    expect(mergeFlags({ a: true }, {})).toEqual({ a: true });
    expect(mergeFlags({}, { a: true })).toEqual({ a: true });
  });
});

describe("mergeSyncData", () => {
  it("returns local unchanged when there is no remote row (first sign-in)", () => {
    const local = data({ progress: { x: true }, stateCode: "CA" });
    expect(mergeSyncData(local, null)).toEqual(local);
  });

  it("unions progress so no completed task is lost across devices", () => {
    const local = data({ progress: { "a/b/c": true } });
    const remote = data({ progress: { "d/e/f": true } });
    expect(mergeSyncData(local, remote).progress).toEqual({
      "a/b/c": true,
      "d/e/f": true,
    });
  });

  it("prefers the account's state, falling back to local", () => {
    expect(mergeSyncData(data({ stateCode: "TX" }), data({ stateCode: "NY" })).stateCode).toBe("NY");
    expect(mergeSyncData(data({ stateCode: "TX" }), data({ stateCode: null })).stateCode).toBe("TX");
  });

  it("adopts local deal dates when the account has none", () => {
    const local = data({ tracker: tracker({ underContractDate: "2026-06-01", closingDate: "2026-07-01" }) });
    const remote = data();
    const merged = mergeSyncData(local, remote);
    expect(merged.tracker.underContractDate).toBe("2026-06-01");
    expect(merged.tracker.closingDate).toBe("2026-07-01");
  });

  it("keeps the account's deal dates when it has them", () => {
    const local = data({ tracker: tracker({ underContractDate: "2026-01-01" }) });
    const remote = data({ tracker: tracker({ underContractDate: "2026-09-09", closingDate: "2026-10-10" }) });
    expect(mergeSyncData(local, remote).tracker.underContractDate).toBe("2026-09-09");
  });

  it("unions document statuses regardless of which side has dates", () => {
    const local = data({ tracker: tracker({ docs: { deed: true } }) });
    const remote = data({ tracker: tracker({ underContractDate: "2026-09-09", docs: { "pay-stubs": true } }) });
    expect(mergeSyncData(local, remote).tracker.docs).toEqual({
      deed: true,
      "pay-stubs": true,
    });
  });
});

const offer = (updatedAt: string, price: number) => ({
  price,
  earnestMoney: 0,
  isPercent: false,
  financingType: "conventional" as const,
  downPaymentPercent: 10,
  closingDate: "",
  possession: "",
  fixturesIncluded: "",
  fixturesExcluded: "",
  closingCostPreference: "buyer-pays" as const,
  contingencies: {} as never,
  concession: { type: "none" as const, percent: 0 },
  updatedAt,
});

describe("mergeOffer", () => {
  it("keeps whichever side exists when the other is null", () => {
    const o = offer("2026-06-01T00:00:00Z", 100);
    expect(mergeOffer(o, null)).toBe(o);
    expect(mergeOffer(null, o)).toBe(o);
    expect(mergeOffer(null, null)).toBeNull();
  });
  it("the more recently updated offer wins", () => {
    const older = offer("2026-06-01T00:00:00Z", 100);
    const newer = offer("2026-06-02T00:00:00Z", 200);
    expect(mergeOffer(older, newer)!.price).toBe(200);
    expect(mergeOffer(newer, older)!.price).toBe(200);
  });
});

describe("mergeShowings", () => {
  it("unions by listing id", () => {
    const local = { a: showing("a", "2026-06-01T00:00:00Z") };
    const remote = { b: showing("b", "2026-06-01T00:00:00Z") };
    expect(Object.keys(mergeShowings(local, remote)).sort()).toEqual(["a", "b"]);
  });
  it("per id, the more recently updated record wins", () => {
    const local = { a: showing("a", "2026-06-01T00:00:00Z", { status: "interested" }) };
    const remote = { a: showing("a", "2026-06-05T00:00:00Z", { status: "seen" }) };
    expect(mergeShowings(local, remote).a.status).toBe("seen");
    expect(mergeShowings(remote, local).a.status).toBe("seen");
  });
});

describe("mergeSyncData — offer & showings", () => {
  it("merges offer (newest) and unions showings", () => {
    const local = data({ offer: offer("2026-06-01T00:00:00Z", 100), showings: { a: showing("a", "2026-06-01T00:00:00Z") } });
    const remote = data({ offer: offer("2026-06-09T00:00:00Z", 999), showings: { b: showing("b", "2026-06-02T00:00:00Z") } });
    const merged = mergeSyncData(local, remote);
    expect(merged.offer?.price).toBe(999);
    expect(Object.keys(merged.showings).sort()).toEqual(["a", "b"]);
  });
});
