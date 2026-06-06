import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTracker } from "./use-tracker";
import { defaultOffsets } from "@/lib/deadlines";

describe("useTracker", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates with empty dates and default offsets", () => {
    const { result } = renderHook(() => useTracker());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.state.underContractDate).toBe("");
    expect(result.current.state.offsets).toEqual(defaultOffsets);
  });

  it("persists dates without clobbering docs, and vice versa", () => {
    const { result } = renderHook(() => useTracker());
    act(() => result.current.setDates({ underContractDate: "2026-06-01" }));
    act(() => result.current.toggleDoc("pay-stubs"));

    expect(result.current.state.underContractDate).toBe("2026-06-01");
    expect(result.current.state.docs["pay-stubs"]).toBe(true);

    // Persisted together.
    const raw = JSON.parse(window.localStorage.getItem("hod:tracker:v1")!);
    expect(raw.underContractDate).toBe("2026-06-01");
    expect(raw.docs["pay-stubs"]).toBe(true);
  });

  it("updates a single offset", () => {
    const { result } = renderHook(() => useTracker());
    act(() => result.current.setOffset("inspectionContingencyDays", 7));
    expect(result.current.state.offsets.inspectionContingencyDays).toBe(7);
    expect(result.current.state.offsets.financingContingencyDays).toBe(
      defaultOffsets.financingContingencyDays,
    );
  });

  it("toggles a document off again", () => {
    const { result } = renderHook(() => useTracker());
    act(() => result.current.toggleDoc("deed"));
    act(() => result.current.toggleDoc("deed"));
    expect(result.current.state.docs["deed"]).toBeUndefined();
  });

  it("reads persisted state on mount and resets it", () => {
    window.localStorage.setItem(
      "hod:tracker:v1",
      JSON.stringify({ underContractDate: "2026-05-01", closingDate: "2026-06-01", docs: { id: "deed" } }),
    );
    const { result } = renderHook(() => useTracker());
    expect(result.current.state.underContractDate).toBe("2026-05-01");
    act(() => result.current.reset());
    expect(result.current.state.underContractDate).toBe("");
  });
});
