import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListingAlertsGuide } from "./listing-alerts-guide";

describe("ListingAlertsGuide", () => {
  it("renders the portal links with rel=noopener and no endorsement", () => {
    render(<ListingAlertsGuide />);
    const zillow = screen.getByRole("link", { name: /Zillow/i });
    expect(zillow).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: /Redfin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Realtor\.com/i })).toBeInTheDocument();
  });

  it("is honest about the MLS gap (not a full search)", () => {
    render(<ListingAlertsGuide />);
    expect(screen.getByText(/not all the way/i)).toBeInTheDocument();
    expect(
      screen.getByText(/some inventory genuinely isn't on the portals/i),
    ).toBeInTheDocument();
  });

  it("cross-links to showings (dual-agency / scripts) and the sample listings", () => {
    render(<ListingAlertsGuide />);
    expect(screen.getByRole("link", { name: /showings tracker/i })).toHaveAttribute(
      "href",
      "/showings",
    );
    expect(screen.getByRole("link", { name: /sample listings/i })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("renders a dated source line", () => {
    render(<ListingAlertsGuide />);
    expect(screen.getByTestId("listing-alerts-source").textContent).toMatch(/2026/);
  });
});
