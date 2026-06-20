import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// usePathname is read by the footer; default to a mapped tool.
let mockPath = "/tools/tour-scorecard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
}));

import { ToolJourneyFooter } from "./tool-journey-footer";

describe("ToolJourneyFooter", () => {
  it("renders back-to-journey + next-step for a mapped tool (no dead-end)", () => {
    mockPath = "/tools/tour-scorecard";
    render(<ToolJourneyFooter />);
    const nav = screen.getByRole("navigation", { name: "Journey navigation" });
    expect(nav).toBeInTheDocument();

    const back = screen.getByRole("link", { name: /Back to Tour & Evaluate/i });
    expect(back).toHaveAttribute(
      "href",
      "/journey/tour-and-evaluate/schedule-and-assess",
    );
    const next = screen.getByRole("link", { name: /^Next:/i });
    expect(next).toHaveAttribute("href", "/journey/make-an-offer/draft-the-offer");
  });

  it("degrades to a single back-link for an unmapped tool", () => {
    mockPath = "/tools/this-tool-does-not-exist";
    render(<ToolJourneyFooter />);
    const back = screen.getByRole("link", { name: "← Back to your journey" });
    expect(back).toHaveAttribute("href", "/journey");
    // No "Next:" link in the degrade case.
    expect(screen.queryByRole("link", { name: /^Next:/i })).toBeNull();
  });

  it("accepts an explicit toolHref override", () => {
    mockPath = "/somewhere-else";
    render(<ToolJourneyFooter toolHref="/tools/compare" />);
    expect(
      screen.getByRole("link", { name: /Back to Search/i }),
    ).toBeInTheDocument();
  });
});
