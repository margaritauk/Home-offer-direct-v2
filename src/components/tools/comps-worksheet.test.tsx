import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

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
      undoReset: () => {},
      canUndoReset: false,
    };
  },
}));

import { CompsWorksheet } from "./comps-worksheet";

/** Add a home and one comp so the I4 guidance surfaces render. */
function seedHomeWithComp() {
  fireEvent.click(screen.getByRole("button", { name: /add a home/i }));
  fireEvent.click(screen.getByRole("button", { name: /add a comp/i }));
}

describe("CompsWorksheet — guided comp adjustments (I4)", () => {
  it("shows the adjustment-methodology explainer once a comp exists", () => {
    render(<CompsWorksheet />);
    seedHomeWithComp();
    const methodology = screen.getByTestId("adjustment-methodology");
    expect(methodology).toHaveTextContent(/comp toward your subject/i);
    // Worked direction example guards the classic sign error.
    expect(methodology).toHaveTextContent(/superior/i);
    expect(methodology).toHaveTextContent(/DOWN/);
  });

  it("renders the per-comp adjustment prompts for the standard categories", () => {
    render(<CompsWorksheet />);
    seedHomeWithComp();
    const guidance = screen.getByTestId("adjustment-guidance");
    expect(guidance).toHaveTextContent(/Condition & updates/i);
    expect(guidance).toHaveTextContent(/Living area/i);
    expect(guidance).toHaveTextContent(/Recency/i);
  });

  it("notes the adjustment is an estimate, not an appraisal (UPL) and emits no offer number", () => {
    render(<CompsWorksheet />);
    seedHomeWithComp();
    const methodology = screen.getByTestId("adjustment-methodology");
    expect(methodology).toHaveTextContent(/not an appraisal/i);
    expect(methodology.textContent ?? "").not.toMatch(/offer \$|you should offer/i);
  });
});
