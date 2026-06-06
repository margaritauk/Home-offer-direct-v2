import { describe, expect, it } from "vitest";
import { mergeFlags, mergeSyncData } from "./merge";
import { defaultOffsets } from "@/lib/deadlines";
import type { SyncData } from "./types";

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
