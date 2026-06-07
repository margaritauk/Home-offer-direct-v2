import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchDealData, pushDealData } from "./remote";
import { defaultOffsets } from "@/lib/deadlines";
import type { SyncData } from "./types";

const sample: SyncData = {
  progress: { "a/b": true },
  stateCode: "CA",
  tracker: { underContractDate: "2026-06-01", closingDate: "", offsets: { ...defaultOffsets }, docs: { deed: true } },
  offer: null,
  showings: {},
  offerStatus: {},
};

describe("fetchDealData", () => {
  it("maps a deal_data row into SyncData", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        deal_id: "d1",
        progress: { x: true },
        state_code: "TX",
        tracker: { underContractDate: "2026-07-01", closingDate: "", offsets: {}, docs: {} },
        offer: null,
        showings: {},
        offer_status: {},
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as unknown as SupabaseClient;

    const out = await fetchDealData(supabase, "d1");
    expect(from).toHaveBeenCalledWith("deal_data");
    expect(eq).toHaveBeenCalledWith("deal_id", "d1");
    expect(out?.stateCode).toBe("TX");
    expect(out?.progress).toEqual({ x: true });
    expect(out?.tracker.offsets).toMatchObject(defaultOffsets);
  });

  it("returns null when there is no row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as unknown as SupabaseClient;
    expect(await fetchDealData(supabase, "d1")).toBeNull();
  });
});

describe("pushDealData", () => {
  it("upserts the full SyncData payload keyed by deal_id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = { from } as unknown as SupabaseClient;

    const res = await pushDealData(supabase, "d1", sample);
    expect(res).toEqual({});
    expect(from).toHaveBeenCalledWith("deal_data");
    expect(upsert).toHaveBeenCalledWith({
      deal_id: "d1",
      progress: sample.progress,
      state_code: sample.stateCode,
      tracker: sample.tracker,
      offer: sample.offer,
      showings: sample.showings,
      offer_status: sample.offerStatus,
    });
  });

  it("returns the error message on failure", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = { from } as unknown as SupabaseClient;
    expect(await pushDealData(supabase, "d1", sample)).toEqual({ error: "denied" });
  });
});
