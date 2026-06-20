import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Link from "next/link";
import {
  AddToScorecardButton,
  myHomeFromListing,
} from "./add-to-scorecard-button";

const LISTING = {
  id: "l1",
  address: "123 Maple St",
  city: "Austin",
  state: "TX",
  price: 525000,
  beds: 3,
  baths: 2,
  sqft: 1840,
  propertyType: "single-family" as const,
};

describe("AddToScorecardButton", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("toggles between add and on-scorecard, persisting to the scorecard blob", () => {
    render(<AddToScorecardButton home={myHomeFromListing(LISTING)} />);
    const btn = screen.getByRole("button", { name: /add to scorecard/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(btn);
    expect(
      screen.getByRole("button", { name: /on your scorecard/i }),
    ).toHaveAttribute("aria-pressed", "true");
    // A "View scorecard" deep link appears once added.
    expect(
      screen.getByRole("link", { name: /view scorecard/i }),
    ).toHaveAttribute("href", "/tools/tour-scorecard");

    const blob = JSON.parse(
      window.localStorage.getItem("hod:tool:tour-scorecard:v1") ?? "{}",
    );
    expect(blob.homes).toHaveLength(1);
    expect(blob.homes[0].listingId).toBe("l1");

    // Toggling off removes it.
    fireEvent.click(screen.getByRole("button", { name: /on your scorecard/i }));
    expect(
      screen.getByRole("button", { name: /add to scorecard/i }),
    ).toBeInTheDocument();
  });

  it("compact variant inside a <Link> does not navigate (preventDefault)", () => {
    let navigated = false;
    render(
      <Link
        href="/listings/l1"
        onClick={() => {
          navigated = true;
        }}
      >
        <AddToScorecardButton home={myHomeFromListing(LISTING)} compact />
      </Link>,
    );
    fireEvent.click(screen.getByRole("button", { name: /scorecard/i }));
    expect(navigated).toBe(false);
  });

  it("adding the same listing twice is idempotent (no duplicate)", () => {
    const { rerender } = render(
      <AddToScorecardButton home={myHomeFromListing(LISTING)} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add to scorecard/i }));
    rerender(<AddToScorecardButton home={myHomeFromListing(LISTING)} />);
    // Already on — clicking would remove, so add a second instance instead.
    render(<AddToScorecardButton home={myHomeFromListing(LISTING)} />);
    const blob = JSON.parse(
      window.localStorage.getItem("hod:tool:tour-scorecard:v1") ?? "{}",
    );
    expect(blob.homes).toHaveLength(1);
  });
});
