import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real React state so the component is interactive but
// never touches localStorage (the persistence path is covered by the hook's own
// store). This mirrors how a tool component reads/writes its persisted blob.
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

import { BudgetCalculator } from "./budget-calculator";

describe("BudgetCalculator", () => {
  it("renders the PITI total and a full breakdown in payment mode", () => {
    render(<BudgetCalculator />);
    expect(screen.getByTestId("piti-total").textContent).toMatch(/\/mo$/);
    expect(screen.getByText("Principal & interest")).toBeInTheDocument();
    expect(screen.getByText("Total monthly (PITI)")).toBeInTheDocument();
  });

  it("updates the displayed total when an input changes (the #54 DoR test)", () => {
    render(<BudgetCalculator />);
    const before = screen.getByTestId("piti-total").textContent;

    // Raising the interest rate must raise the monthly payment.
    fireEvent.change(screen.getByLabelText("Interest rate"), {
      target: { value: "9" },
    });

    const after = screen.getByTestId("piti-total").textContent;
    expect(after).not.toBe(before);
  });

  it("shows the PMI badge when the down payment is below 20%", () => {
    render(<BudgetCalculator />);
    // Default down payment is 10% → PMI applies.
    expect(screen.getByTestId("pmi-badge")).toBeInTheDocument();

    // Push the down payment to 20%+ → PMI drops off, badge disappears.
    fireEvent.change(screen.getByLabelText("Down payment"), {
      target: { value: "25" },
    });
    expect(screen.queryByTestId("pmi-badge")).not.toBeInTheDocument();
  });

  it("switches to affordability mode and shows a max price + binding constraint", () => {
    render(<BudgetCalculator />);
    fireEvent.click(screen.getByRole("tab", { name: "Affordability" }));

    expect(screen.getByTestId("max-price")).toBeInTheDocument();
    expect(screen.getByTestId("binding-constraint").textContent).toMatch(
      /cap is the limit/,
    );
  });

  it("recomputes affordability when income changes", () => {
    render(<BudgetCalculator />);
    fireEvent.click(screen.getByRole("tab", { name: "Affordability" }));
    const before = screen.getByTestId("max-price").textContent;

    fireEvent.change(screen.getByLabelText("Gross monthly income"), {
      target: { value: "20000" },
    });
    expect(screen.getByTestId("max-price").textContent).not.toBe(before);
  });

  it("renders the not-financial-advice disclaimer", () => {
    const { container } = render(<BudgetCalculator />);
    expect(
      within(container).getByText(/not financial advice/i),
    ).toBeInTheDocument();
  });
});
