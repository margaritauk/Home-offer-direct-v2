import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real state so the component is interactive without
// touching localStorage (mirrors the budget-calculator test).
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

import { LenderCompare } from "./lender-compare";

describe("LenderCompare", () => {
  it("flags an out-of-range rate inline but still computes the row totals", () => {
    render(<LenderCompare />);
    fireEvent.click(screen.getByRole("button", { name: "Add a lender" }));

    // Rate hard max is 20% → 99 is an error.
    fireEvent.change(screen.getByLabelText("Rate %"), {
      target: { value: "99" },
    });
    expect(screen.getByText(/Must be (at most|between)/)).toBeInTheDocument();

    // Non-blocking: the totals row still renders.
    expect(screen.getByText("Total cost")).toBeInTheDocument();
  });
});
