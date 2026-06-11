import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real React state so add/patch/reset behave like prod.
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

import { TourScorecard } from "./tour-scorecard";

function addHome() {
  fireEvent.click(screen.getByRole("button", { name: "Add a home" }));
}

describe("TourScorecard", () => {
  it("shows the empty state until a home is added", () => {
    render(<TourScorecard />);
    expect(screen.getByText(/no homes yet/i)).toBeInTheDocument();
  });

  it("records the typed home label", () => {
    render(<TourScorecard />);
    addHome();
    const label = screen.getByPlaceholderText("123 Maple St") as HTMLInputElement;
    fireEvent.change(label, { target: { value: "12 Oak Ave" } });
    expect(label.value).toBe("12 Oak Ave");
  });

  it("ranks the home once a criterion is rated", () => {
    render(<TourScorecard />);
    addHome();
    // No ranked section until at least one rating exists.
    expect(screen.queryByLabelText("Ranked homes")).toBeNull();
    fireEvent.click(screen.getByLabelText("Location — 5"));
    expect(screen.getByLabelText("Ranked homes")).toBeInTheDocument();
  });

  it("screens protected-class terms out of the notes on blur", () => {
    render(<TourScorecard />);
    addHome();
    const notes = screen.getByPlaceholderText(
      /roof recently replaced/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Great yard for kids" } });
    fireEvent.blur(notes);
    expect(notes.value).not.toMatch(/kids/i);
    expect(notes.value).toContain("[removed]");
  });
});
