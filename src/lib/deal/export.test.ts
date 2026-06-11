import { beforeEach, describe, expect, it } from "vitest";
import { readLocal, writeLocal } from "@/lib/sync/local-store";
import type { SyncData } from "@/lib/sync/types";
import { defaultOffsets } from "@/lib/deadlines";
import {
  DEAL_SCHEMA_VERSION,
  collectDeal,
  dealToJson,
  parseDealJson,
  restoreDeal,
} from "./export";

/** A fully-populated SyncData to round-trip. */
const FULL: SyncData = {
  progress: { "stage-1": true, "stage-2": true },
  stateCode: "CO",
  tracker: {
    underContractDate: "2026-06-01",
    closingDate: "2026-07-15",
    offsets: { ...defaultOffsets },
    docs: { inspection: true },
  },
  offer: { price: 425_000 } as unknown as SyncData["offer"],
  showings: { "listing-1": { rating: 4 } } as unknown as SyncData["showings"],
  offerStatus: { "listing-1": { status: "accepted" } } as unknown as SyncData["offerStatus"],
  stageTools: { "budget-wizard": { mode: "piti" }, comps: [1, 2, 3] },
};

describe("collectDeal", () => {
  beforeEach(() => window.localStorage.clear());

  it("stamps schemaVersion and an ISO exportedAt", () => {
    const bundle = collectDeal();
    expect(bundle.schemaVersion).toBe(DEAL_SCHEMA_VERSION);
    expect(typeof bundle.exportedAt).toBe("string");
    expect(Number.isNaN(Date.parse(bundle.exportedAt))).toBe(false);
  });

  it("gathers the current local data", () => {
    writeLocal(FULL);
    const bundle = collectDeal();
    expect(bundle.data).toEqual(FULL);
  });
});

describe("round-trip", () => {
  beforeEach(() => window.localStorage.clear());

  it("collect -> json -> parse -> restore -> readLocal deep-equals the original", () => {
    writeLocal(FULL);
    const original = readLocal();

    const json = dealToJson(collectDeal());
    const parsed = parseDealJson(json);
    expect(parsed).not.toBeNull();

    // Wipe, then restore from the parsed bundle.
    window.localStorage.clear();
    const res = restoreDeal(parsed);
    expect(res).toEqual({ ok: true });

    expect(readLocal()).toEqual(original);
  });
});

describe("partial / empty deals", () => {
  beforeEach(() => window.localStorage.clear());

  it("exports and restores an empty deal without crashing", () => {
    const bundle = collectDeal();
    const round = parseDealJson(dealToJson(bundle));
    expect(round).not.toBeNull();
    const res = restoreDeal(round);
    expect(res).toEqual({ ok: true });
  });

  it("restores a bundle whose data is missing slices (fills from defaults)", () => {
    const partial = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: { stateCode: "TX" }, // every other slice missing
    };
    const res = restoreDeal(partial);
    expect(res).toEqual({ ok: true });

    const after = readLocal();
    expect(after.stateCode).toBe("TX");
    // Missing slices fall back to SyncData defaults — no crash, sane values.
    expect(after.progress).toEqual({});
    expect(after.showings).toEqual({});
    expect(after.offer).toBeNull();
  });
});

describe("parseDealJson", () => {
  it("returns null on garbage / non-JSON", () => {
    expect(parseDealJson("not json {{{")).toBeNull();
    expect(parseDealJson("")).toBeNull();
  });

  it("returns null on JSON that isn't bundle-shaped", () => {
    expect(parseDealJson(JSON.stringify({ hello: "world" }))).toBeNull();
    expect(parseDealJson(JSON.stringify([1, 2, 3]))).toBeNull();
    expect(parseDealJson(JSON.stringify(42))).toBeNull();
    expect(parseDealJson(JSON.stringify({ schemaVersion: 1 }))).toBeNull(); // no data
  });

  it("parses a valid bundle", () => {
    const json = dealToJson(collectDeal());
    expect(parseDealJson(json)).not.toBeNull();
  });
});

describe("restoreDeal validation", () => {
  beforeEach(() => window.localStorage.clear());

  it("rejects non-bundle objects without throwing", () => {
    expect(restoreDeal({ foo: "bar" })).toEqual({
      ok: false,
      error: expect.any(String),
    });
    expect(restoreDeal(null).ok).toBe(false);
    expect(restoreDeal("string").ok).toBe(false);
    expect(restoreDeal(123).ok).toBe(false);
    expect(restoreDeal({ schemaVersion: 1 }).ok).toBe(false); // missing data
    expect(restoreDeal({ data: {} }).ok).toBe(false); // missing schemaVersion
  });
});
