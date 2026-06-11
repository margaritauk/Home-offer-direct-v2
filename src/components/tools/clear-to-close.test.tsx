import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real state (mirrors the budget-calculator test) so the
// component is interactive without touching localStorage.
vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_toolId: string, initial: T) => {
    const [value, setValue] = useState<T>(initial);
    return {
      value,
      hydrated: true,
      save: (next: T | ((prev: T) => T)) =>
        setValue((prev) =>
          typeof next === "function" ? (next as (p: T) => T)(prev) : next,
        ),
      reset: () => setValue(initial),
    };
  },
}));

import { ClearToClose } from "./clear-to-close";

describe("ClearToClose", () => {
  it("flags an out-of-range contract price inline but still computes the gap", () => {
    render(<ClearToClose />);

    // Hard max is $5,000,000 → 6,000,000 is an error.
    fireEvent.change(screen.getByLabelText("Contract price"), {
      target: { value: "6000000" },
    });
    fireEvent.change(screen.getByLabelText("Appraised value"), {
      target: { value: "450000" },
    });

    expect(screen.getByText(/Must be (at most|between)/)).toBeInTheDocument();
    // Non-blocking: the appraisal-gap result still renders.
    expect(screen.getByText("Appraisal gap")).toBeInTheDocument();
  });
});
