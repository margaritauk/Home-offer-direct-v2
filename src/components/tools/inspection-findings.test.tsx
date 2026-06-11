import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_id: string, initial: T) => {
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

import { InspectionFindings } from "./inspection-findings";

function addFinding() {
  fireEvent.click(screen.getByRole("button", { name: "Add a finding" }));
}

describe("InspectionFindings", () => {
  it("records the scheduled inspection date", () => {
    render(<InspectionFindings />);
    const date = screen.getByLabelText(
      "Scheduled inspection date",
    ) as HTMLInputElement;
    fireEvent.change(date, { target: { value: "2026-07-15" } });
    expect(date.value).toBe("2026-07-15");
  });

  it("shows the empty state until a finding is added", () => {
    render(<InspectionFindings />);
    expect(screen.getByText(/log each inspection finding/i)).toBeInTheDocument();
  });

  it("records the finding item, severity and estimated cost in the summary", () => {
    render(<InspectionFindings />);
    addFinding();

    fireEvent.change(
      screen.getByPlaceholderText(/Roof, Water heater, Electrical panel/i),
      { target: { value: "Roof" } },
    );
    fireEvent.change(screen.getByLabelText("Est. cost"), {
      target: { value: "5000" },
    });
    // Summary reflects the estimated cost.
    expect(screen.getByLabelText("Findings summary").textContent).toMatch(
      /\$5,000 estimated/,
    );
  });

  it("flags a major/safety finding in the summary", () => {
    render(<InspectionFindings />);
    addFinding();
    fireEvent.change(screen.getByLabelText("Severity"), {
      target: { value: "safety" },
    });
    expect(screen.getByText(/major \/ safety items flagged/i)).toBeInTheDocument();
  });

  it("records the decision selection", () => {
    render(<InspectionFindings />);
    addFinding();
    const decision = screen.getByLabelText("Decision") as HTMLSelectElement;
    fireEvent.change(decision, { target: { value: "request-repair" } });
    expect(decision.value).toBe("request-repair");
  });

  it("screens protected-class terms out of the notes on blur", () => {
    render(<InspectionFindings />);
    addFinding();
    const notes = screen.getByPlaceholderText(
      /facts from the inspection/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Near a church" } });
    fireEvent.blur(notes);
    expect(notes.value).not.toMatch(/church/i);
    expect(notes.value).toContain("[removed]");
  });
});
