import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { MyHome } from "@/lib/homes/my-homes";

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

// One listing-sourced home so the picker can surface a photo+facts row.
const PICK_HOME: MyHome = {
  key: "listing:l1",
  label: "123 Maple St",
  address: "123 Maple St",
  city: "Austin",
  state: "TX",
  listingId: "l1",
  price: 525000,
  beds: 3,
  baths: 2,
  sqft: 1840,
  propertyType: "single-family",
  source: "Home search",
};
vi.mock("@/hooks/use-my-homes", () => ({
  useMyHomes: () => ({ homes: [PICK_HOME], hydrated: true }),
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

  it("adds a home from the picker with a snapshot photo + facts header (link carried)", () => {
    render(<TourScorecard />);
    // Open the picker and pick the listing-sourced home.
    fireEvent.click(
      screen.getByRole("button", { name: "Add from search / showings" }),
    );
    fireEvent.click(screen.getByText("123 Maple St"));

    // The redesigned HomeCard header shows the snapshot facts, not a bare input.
    expect(screen.getByText("$525,000")).toBeInTheDocument();
    expect(screen.getByText(/3 bd · 2 ba · 1,840 sqft/)).toBeInTheDocument();
    // "View listing" deep-links back to the listing (link no longer discarded).
    const viewLink = screen.getByRole("link", { name: /view listing/i });
    expect(viewLink).toHaveAttribute("href", "/listings/l1");
    // The manual address input is NOT rendered for a linked/snapshot home.
    expect(screen.queryByPlaceholderText("123 Maple St")).toBeNull();
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
