import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useStageTool } from "./use-stage-tool";

describe("useStageTool", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates with the initial value", () => {
    const { result } = renderHook(() => useStageTool("demo", { n: 0 }));
    expect(result.current.hydrated).toBe(true);
    expect(result.current.value).toEqual({ n: 0 });
  });

  it("saves a value and persists under a namespaced key", () => {
    const { result } = renderHook(() => useStageTool("demo", { n: 0 }));
    act(() => result.current.save({ n: 5 }));
    expect(result.current.value).toEqual({ n: 5 });
    expect(window.localStorage.getItem("hod:tool:demo:v1")).toContain("5");
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useStageTool("demo", { n: 1 }));
    act(() => result.current.save((p) => ({ n: p.n + 1 })));
    expect(result.current.value).toEqual({ n: 2 });
  });

  it("syncs across instances in the same tab", () => {
    const a = renderHook(() => useStageTool("shared", { v: "x" }));
    const b = renderHook(() => useStageTool("shared", { v: "x" }));
    act(() => a.result.current.save({ v: "y" }));
    expect(b.result.current.value).toEqual({ v: "y" });
  });

  it("reads an existing value on mount and resets", () => {
    window.localStorage.setItem("hod:tool:demo:v1", JSON.stringify({ n: 9 }));
    const { result } = renderHook(() => useStageTool("demo", { n: 0 }));
    expect(result.current.value).toEqual({ n: 9 });
    act(() => result.current.reset());
    expect(result.current.value).toEqual({ n: 0 });
  });

  it("namespaces different tools separately", () => {
    const a = renderHook(() => useStageTool("a", 1));
    const b = renderHook(() => useStageTool("b", 2));
    act(() => a.result.current.save(10));
    expect(b.result.current.value).toBe(2);
  });

  it("offers undo after a reset and restores the exact prior value", () => {
    const { result } = renderHook(() =>
      useStageTool("undo-demo", { n: 0 }),
    );
    act(() => result.current.save({ n: 42 }));
    expect(result.current.canUndoReset).toBe(false);

    act(() => result.current.reset());
    expect(result.current.value).toEqual({ n: 0 });
    expect(result.current.canUndoReset).toBe(true);

    act(() => result.current.undoReset());
    expect(result.current.value).toEqual({ n: 42 });
    expect(result.current.canUndoReset).toBe(false);
    // Undo re-persisted the prior value to localStorage.
    expect(window.localStorage.getItem("hod:tool:undo-demo:v1")).toContain(
      "42",
    );
  });

  it("clears the undo opportunity once a save happens after reset", () => {
    const { result } = renderHook(() =>
      useStageTool("undo-stale", { n: 7 }),
    );
    act(() => result.current.save({ n: 7 }));
    act(() => result.current.reset());
    expect(result.current.canUndoReset).toBe(true);

    // A manual change after reset invalidates the stale undo snapshot.
    act(() => result.current.save({ n: 9 }));
    expect(result.current.canUndoReset).toBe(false);

    // undoReset is now a no-op and must not clobber the new value.
    act(() => result.current.undoReset());
    expect(result.current.value).toEqual({ n: 9 });
  });
});
