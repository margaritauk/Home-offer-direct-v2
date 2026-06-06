import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { taskKey, useProgress } from "./use-progress";

describe("taskKey", () => {
  it("namespaces a task id by stage and step", () => {
    expect(taskKey("make-an-offer", "negotiate-commission", "ask-for-credit")).toBe(
      "make-an-offer/negotiate-commission/ask-for-credit",
    );
  });
});

describe("useProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hydrates and starts empty", () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.completed).toEqual({});
  });

  it("toggles a task on and off and persists to localStorage", () => {
    const { result } = renderHook(() => useProgress());
    const key = "a/b/c";

    act(() => result.current.toggleTask(key));
    expect(result.current.isDone(key)).toBe(true);
    expect(window.localStorage.getItem("hod:progress:v1")).toContain(key);

    act(() => result.current.toggleTask(key));
    expect(result.current.isDone(key)).toBe(false);
  });

  it("reads existing progress from storage on mount", () => {
    window.localStorage.setItem("hod:progress:v1", JSON.stringify({ "x/y/z": true }));
    const { result } = renderHook(() => useProgress());
    expect(result.current.isDone("x/y/z")).toBe(true);
  });

  it("reset clears all progress", () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.toggleTask("a/b/c"));
    act(() => result.current.reset());
    expect(result.current.completed).toEqual({});
  });
});
