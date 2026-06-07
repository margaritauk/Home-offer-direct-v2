import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ACTIVE_DEAL_KEY, useActiveDeal } from "./use-active-deal";

// Cloud sync is unconfigured in the test environment (no Supabase env vars), so
// the hook is inert: it never calls Supabase, `deals` stays empty, and it only
// manages the persisted active id + shared-store sync. This is exactly the
// signed-out / no-keys path that must be preserved.

describe("useActiveDeal (inert / no-keys path)", () => {
  beforeEach(() => window.localStorage.clear());

  it("is disabled and loads nothing when cloud sync is unconfigured", async () => {
    const { result } = renderHook(() => useActiveDeal("user-1"));
    expect(result.current.enabled).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.deals).toEqual([]);
    expect(result.current.activeDealId).toBeNull();
  });

  it("hydrates the active deal id from localStorage on mount", () => {
    window.localStorage.setItem(ACTIVE_DEAL_KEY, "deal-abc");
    const { result } = renderHook(() => useActiveDeal(null));
    expect(result.current.activeDealId).toBe("deal-abc");
  });

  it("persists the active deal id on switch", () => {
    const { result } = renderHook(() => useActiveDeal(null));
    act(() => result.current.switchDeal("deal-xyz"));
    expect(result.current.activeDealId).toBe("deal-xyz");
    expect(window.localStorage.getItem(ACTIVE_DEAL_KEY)).toBe("deal-xyz");
  });

  it("clears the active deal id when switched to null", () => {
    const { result } = renderHook(() => useActiveDeal(null));
    act(() => result.current.switchDeal("deal-xyz"));
    act(() => result.current.switchDeal(null));
    expect(result.current.activeDealId).toBeNull();
    expect(window.localStorage.getItem(ACTIVE_DEAL_KEY)).toBeNull();
  });

  it("syncs across hook instances in the same tab (shared store)", () => {
    const a = renderHook(() => useActiveDeal(null));
    const b = renderHook(() => useActiveDeal(null));
    act(() => a.result.current.switchDeal("deal-shared"));
    // The second instance sees the change without a storage event.
    expect(b.result.current.activeDealId).toBe("deal-shared");
  });
});
