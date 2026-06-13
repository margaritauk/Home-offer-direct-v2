import { render, screen, fireEvent, within } from "@testing-library/react";
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
    };
  },
}));

import { CriteriaWorksheet } from "./criteria-worksheet";

describe("CriteriaWorksheet", () => {
  it("renders the three tier buckets", () => {
    render(<CriteriaWorksheet />);
    expect(
      screen.getByRole("heading", { name: /^Must-haves$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Nice-to-haves$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Deal-breakers$/i }),
    ).toBeInTheDocument();
  });

  it("adds a suggested criterion as a must-have", () => {
    render(<CriteriaWorksheet />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Bedrooms/i }));
    const mustSection = screen
      .getByRole("heading", { name: /^Must-haves$/i })
      .closest("section")!;
    expect(within(mustSection).getByText("Bedrooms")).toBeInTheDocument();
  });

  it("screens protected-class phrasing out of a custom criterion before saving", () => {
    render(<CriteriaWorksheet />);
    const input = screen.getByLabelText(/Add your own criterion/i);
    fireEvent.change(input, {
      target: { value: "Near a Catholic church" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));
    // The saved label is neutralized — no protected-class term persists.
    expect(screen.queryByText(/catholic/i)).not.toBeInTheDocument();
    // The neutralized label renders (in the row + its sr-only move-label).
    expect(screen.getAllByText(/\[removed\]/i).length).toBeGreaterThan(0);
  });

  it("links to the Tour Scorecard (navigational hand-off, not storage mutation)", () => {
    render(<CriteriaWorksheet />);
    expect(screen.getByTestId("tour-scorecard-link")).toHaveAttribute(
      "href",
      "/tools/tour-scorecard",
    );
  });

  it("surfaces the FHA-neutrality guidance", () => {
    render(<CriteriaWorksheet />);
    expect(
      screen.getByText(/keep your criteria objective/i),
    ).toBeInTheDocument();
  });
});
