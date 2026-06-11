import { render, screen, fireEvent, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ListingsBrowser } from "./listings-browser";

// Exercises the live-filter wiring: applying filters surfaces chips, removing a
// chip clears just that filter, and "Clear all" resets everything (issue #172).
describe("ListingsBrowser", () => {
  beforeEach(() => window.localStorage.clear());

  const filtersRegion = () => screen.getByLabelText("Active filters");

  it("renders a price-range slider and a min-baths control", () => {
    render(<ListingsBrowser />);
    expect(screen.getByLabelText("Minimum price")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum price")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum baths")).toBeInTheDocument();
  });

  it("shows chips when a price + beds filter is applied", () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });

    const chips = filtersRegion();
    expect(within(chips).getByText("3+ beds")).toBeInTheDocument();
    expect(within(chips).getByText(/Min \$400,000/)).toBeInTheDocument();
  });

  it("removing a chip clears just that filter and updates results", () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });

    const count = () => screen.getByText(/^\d+ listings?$/).textContent;
    const countBefore = count();

    // Remove only the beds chip.
    fireEvent.click(screen.getByRole("button", { name: "Remove 3+ beds" }));

    const chips = filtersRegion();
    expect(within(chips).queryByText("3+ beds")).not.toBeInTheDocument();
    expect(within(chips).getByText(/Min \$400,000/)).toBeInTheDocument();
    // Loosening the beds filter should not shrink the result set.
    expect(count()).not.toBe(countBefore);
  });

  it("Clear all resets every filter and hides the chips", () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });
    expect(filtersRegion()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByLabelText("Active filters")).not.toBeInTheDocument();
    expect((screen.getByLabelText("Min price") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Minimum beds") as HTMLSelectElement).value).toBe("0");
  });
});
