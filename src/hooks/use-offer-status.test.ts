import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useOfferStatus } from "./use-offer-status";

const KEY = "hod:offer-status:v1";

describe("useOfferStatus", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates empty", () => {
    const { result } = renderHook(() => useOfferStatus());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.records).toEqual([]);
  });

  it("upserts a draft and defaults status to draft", () => {
    const { result } = renderHook(() => useOfferStatus());
    act(() => result.current.upsert({ listingId: "L1" }));
    expect(result.current.offers.L1.status).toBe("draft");
    expect(result.current.offers.L1.createdAt).toBeTruthy();
  });

  it("persists to the v1 key and emits a local-change event", () => {
    let emitted = false;
    const handler = () => (emitted = true);
    window.addEventListener("hod:local-change", handler);
    const { result } = renderHook(() => useOfferStatus());
    act(() => result.current.upsert({ listingId: "L1", status: "sent" }));
    window.removeEventListener("hod:local-change", handler);

    const raw = JSON.parse(window.localStorage.getItem(KEY)!);
    expect(raw.L1.status).toBe("sent");
    expect(emitted).toBe(true);
  });

  it("advances status and appends notes", () => {
    const { result } = renderHook(() => useOfferStatus());
    act(() => result.current.upsert({ listingId: "L1" }));
    act(() => result.current.setStatus("L1", "sent", "Emailed the seller"));
    expect(result.current.offers.L1.status).toBe("sent");
    expect(result.current.offers.L1.notes).toHaveLength(1);
    expect(result.current.offers.L1.notes?.[0].text).toBe("Emailed the seller");
  });

  it("patches dates", () => {
    const { result } = renderHook(() => useOfferStatus());
    act(() => result.current.upsert({ listingId: "L1" }));
    act(() =>
      result.current.patch("L1", {
        sentAt: "2026-06-01",
        expiresAt: "2026-06-10",
      }),
    );
    expect(result.current.offers.L1.sentAt).toBe("2026-06-01");
    expect(result.current.offers.L1.expiresAt).toBe("2026-06-10");
  });

  it("does not write when an action is a no-op", () => {
    const { result } = renderHook(() => useOfferStatus());
    let emitted = 0;
    const handler = () => (emitted += 1);
    window.addEventListener("hod:local-change", handler);
    act(() => result.current.setStatus("missing", "sent"));
    window.removeEventListener("hod:local-change", handler);
    expect(emitted).toBe(0);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("removes a record", () => {
    const { result } = renderHook(() => useOfferStatus());
    act(() => result.current.upsert({ listingId: "L1" }));
    act(() => result.current.remove("L1"));
    expect(result.current.offers.L1).toBeUndefined();
  });

  it("reads persisted state on mount", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        L9: {
          listingId: "L9",
          status: "countered",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );
    const { result } = renderHook(() => useOfferStatus());
    expect(result.current.offers.L9.status).toBe("countered");
    expect(result.current.records).toHaveLength(1);
  });

  it("sorts records by most recently updated", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        A: { listingId: "A", status: "draft", createdAt: "x", updatedAt: "2026-06-01T00:00:00.000Z" },
        B: { listingId: "B", status: "draft", createdAt: "x", updatedAt: "2026-06-05T00:00:00.000Z" },
      }),
    );
    const { result } = renderHook(() => useOfferStatus());
    expect(result.current.records.map((r) => r.listingId)).toEqual(["B", "A"]);
  });
});
