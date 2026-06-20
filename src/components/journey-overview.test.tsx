import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JourneyOverview } from "./journey-overview";
import { getStages } from "@/lib/journey";

afterEach(() => window.localStorage.clear());

describe("JourneyOverview tri-state (Item 2 / S0b)", () => {
  it("marks a stage 'In progress' when a mapped tool has data — not complete", async () => {
    // The tour scorecard maps to the tour-and-evaluate stage; one home = data.
    window.localStorage.setItem(
      "hod:tool:tour-scorecard:v1",
      JSON.stringify({ homes: [{ id: "h", label: "X", ratings: {} }] }),
    );
    render(<JourneyOverview stages={getStages()} />);

    await waitFor(() =>
      expect(
        screen.getByLabelText(/Tour & Evaluate — in progress/i),
      ).toBeInTheDocument(),
    );
    // It must NOT read complete.
    expect(
      screen.queryByLabelText(/Tour & Evaluate — complete/i),
    ).not.toBeInTheDocument();
  });

  it("an untouched stage reads 'not started'", async () => {
    render(<JourneyOverview stages={getStages()} />);
    await waitFor(() =>
      expect(
        screen.getAllByLabelText(/not started/i).length,
      ).toBeGreaterThan(0),
    );
  });
});
