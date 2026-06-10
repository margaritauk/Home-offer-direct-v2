import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real React state, keyed by toolId so the walkthrough's
// own state and the repair-request blob it reads stay independent. The
// repair-request tool is seeded with one negotiated repair.
vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(toolId: string, initial: T) => {
    const seed =
      toolId === "repair-request"
        ? ({
            items: [
              { id: "r1", item: "Fix the roof", resolution: "repair" },
            ],
          } as unknown as T)
        : initial;
    const [value, setValue] = useState<T>(seed);
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

import { FinalWalkthrough } from "./final-walkthrough";

describe("FinalWalkthrough", () => {
  it("auto-lists the negotiated repair from the repair-request tool", () => {
    render(<FinalWalkthrough />);
    expect(screen.getByText("Fix the roof")).toBeInTheDocument();
  });

  it("surfaces an attention summary once an item is marked failed", () => {
    render(<FinalWalkthrough />);
    expect(screen.queryByTestId("attention-summary")).not.toBeInTheDocument();

    // Mark the first standard item as failed.
    const failButtons = screen.getAllByRole("button", { name: "Fail" });
    fireEvent.click(failButtons[0]);

    const summary = screen.getByTestId("attention-summary");
    expect(summary.textContent).toMatch(/need.*attention before closing/i);
  });
});
