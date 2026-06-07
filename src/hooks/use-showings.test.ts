import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useShowings } from "./use-showings";

const listing = {
  listingId: "L1",
  address: "123 Maple St",
  city: "Austin",
  state: "tx",
};

describe("useShowings", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates empty", () => {
    const { result } = renderHook(() => useShowings());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.records).toEqual([]);
  });

  it("syncs across hook instances in the same tab (fixes date/rating not sticking)", () => {
    // Mirrors the tracker list + a card both calling useShowings.
    const a = renderHook(() => useShowings());
    const b = renderHook(() => useShowings());

    act(() => a.result.current.track(listing));
    // The second instance sees the new record without a storage event.
    expect(b.result.current.showings["L1"]).toBeTruthy();

    act(() => b.result.current.update("L1", { rating: 4, scheduledAt: "2026-06-10T10:00" }));
    // The first instance reflects the card's write immediately.
    expect(a.result.current.showings["L1"].rating).toBe(4);
    expect(a.result.current.showings["L1"].scheduledAt).toBe("2026-06-10T10:00");
  });

  it("tracks a listing with defaults and uppercases the state", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));

    const rec = result.current.showings["L1"];
    expect(rec.status).toBe("interested");
    expect(rec.state).toBe("TX");
    expect(rec.address).toBe("123 Maple St");
    expect(rec.createdAt).toBeTruthy();
  });

  it("persists to localStorage and emits change", () => {
    let emitted = false;
    const handler = () => (emitted = true);
    window.addEventListener("hod:local-change", handler);
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));
    window.removeEventListener("hod:local-change", handler);

    const raw = JSON.parse(window.localStorage.getItem("hod:showings:v1")!);
    expect(raw.L1.status).toBe("interested");
    expect(emitted).toBe(true);
  });

  it("is idempotent — re-tracking keeps the existing record", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));
    const first = result.current.showings["L1"].createdAt;
    act(() => result.current.track({ ...listing, status: "requested" }));
    expect(result.current.showings["L1"].status).toBe("interested");
    expect(result.current.showings["L1"].createdAt).toBe(first);
  });

  it("transitions status through the pipeline", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));
    for (const status of ["requested", "scheduled", "seen", "offer"] as const) {
      act(() => result.current.setStatus("L1", status));
      expect(result.current.showings["L1"].status).toBe(status);
    }
  });

  it("updates notes, rating, and schedule and bumps updatedAt", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));
    const before = result.current.showings["L1"].updatedAt;
    act(() =>
      result.current.update("L1", {
        notes: "Great light",
        rating: 4,
        scheduledAt: "2026-06-10T10:00",
      }),
    );
    const rec = result.current.showings["L1"];
    expect(rec.notes).toBe("Great light");
    expect(rec.rating).toBe(4);
    expect(rec.scheduledAt).toBe("2026-06-10T10:00");
    expect(rec.updatedAt >= before).toBe(true);
  });

  it("update is a no-op for an untracked listing", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.update("missing", { notes: "x" }));
    expect(result.current.showings["missing"]).toBeUndefined();
  });

  it("removes a record", () => {
    const { result } = renderHook(() => useShowings());
    act(() => result.current.track(listing));
    act(() => result.current.remove("L1"));
    expect(result.current.showings["L1"]).toBeUndefined();
  });

  it("reads persisted state on mount", () => {
    window.localStorage.setItem(
      "hod:showings:v1",
      JSON.stringify({
        L9: {
          listingId: "L9",
          address: "9 Oak",
          city: "Reno",
          state: "NV",
          status: "seen",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );
    const { result } = renderHook(() => useShowings());
    expect(result.current.showings["L9"].status).toBe("seen");
    expect(result.current.records).toHaveLength(1);
  });
});
