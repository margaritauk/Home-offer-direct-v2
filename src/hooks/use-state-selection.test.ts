import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useStateSelection } from "./use-state-selection";

const KEY = "hod:state:v1";

describe("useStateSelection", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates with no selection by default", () => {
    const { result } = renderHook(() => useStateSelection());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.stateCode).toBeNull();
  });

  it("selects a state and persists it", () => {
    const { result } = renderHook(() => useStateSelection());
    act(() => result.current.selectState("CA"));
    expect(result.current.stateCode).toBe("CA");
    expect(window.localStorage.getItem(KEY)).toBe("CA");
  });

  it("clears the selection when passed null", () => {
    const { result } = renderHook(() => useStateSelection());
    act(() => result.current.selectState("TX"));
    act(() => result.current.selectState(null));
    expect(result.current.stateCode).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("reads an existing selection from storage on mount", () => {
    window.localStorage.setItem(KEY, "NY");
    const { result } = renderHook(() => useStateSelection());
    expect(result.current.stateCode).toBe("NY");
  });
});
