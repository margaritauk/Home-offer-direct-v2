import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { emptyOffer, useOffer } from "./use-offer";

const KEY = "hod:offer:v1";

describe("useOffer", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates with an empty offer and sensible defaults", () => {
    const { result } = renderHook(() => useOffer());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.offer.price).toBe(0);
    expect(result.current.offer.financingType).toBe("conventional");
    expect(result.current.offer.contingencies.inspection.included).toBe(true);
    expect(result.current.offer.concession.type).toBe("price-reduction");
  });

  it("persists an update and stamps updatedAt", () => {
    const { result } = renderHook(() => useOffer());
    act(() => result.current.update({ price: 450_000 }));

    expect(result.current.offer.price).toBe(450_000);
    expect(result.current.offer.updatedAt).not.toBe("");

    const raw = JSON.parse(window.localStorage.getItem(KEY)!);
    expect(raw.price).toBe(450_000);
    expect(typeof raw.updatedAt).toBe("string");
    expect(raw.updatedAt.length).toBeGreaterThan(0);
  });

  it("updates a single contingency without clobbering others", () => {
    const { result } = renderHook(() => useOffer());
    act(() => result.current.setContingency("inspection", { included: false }));
    act(() => result.current.setContingency("appraisal", { days: 20 }));

    expect(result.current.offer.contingencies.inspection.included).toBe(false);
    // Days preserved from default when only toggling included.
    expect(result.current.offer.contingencies.inspection.days).toBe(10);
    expect(result.current.offer.contingencies.appraisal.days).toBe(20);
    expect(result.current.offer.contingencies.appraisal.included).toBe(true);

    const raw = JSON.parse(window.localStorage.getItem(KEY)!);
    expect(raw.contingencies.inspection.included).toBe(false);
    expect(raw.contingencies.appraisal.days).toBe(20);
  });

  it("reads persisted state on mount (save/resume) and merges missing fields", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ price: 525_000, possession: "30-day rent-back" }),
    );
    const { result } = renderHook(() => useOffer());
    expect(result.current.offer.price).toBe(525_000);
    expect(result.current.offer.possession).toBe("30-day rent-back");
    // Missing contingencies backfilled from defaults.
    expect(result.current.offer.contingencies.title.included).toBe(true);
  });

  it("resets to a fresh offer", () => {
    const { result } = renderHook(() => useOffer());
    act(() => result.current.update({ price: 600_000 }));
    act(() => result.current.reset());
    expect(result.current.offer.price).toBe(0);
  });

  it("emptyOffer is a pure factory returning independent maps", () => {
    const a = emptyOffer();
    const b = emptyOffer();
    a.contingencies.inspection.included = false;
    expect(b.contingencies.inspection.included).toBe(true);
  });
});
