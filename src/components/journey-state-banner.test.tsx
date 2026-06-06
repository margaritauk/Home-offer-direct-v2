import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyStateBanner } from "./journey-state-banner";

// next/link needs Next's router context; render a plain anchor for unit tests.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const KEY = "hod:state:v1";

describe("JourneyStateBanner", () => {
  beforeEach(() => window.localStorage.clear());

  it("prompts for a state when none is saved", async () => {
    render(<JourneyStateBanner />);
    expect(await screen.findByText(/tell us your state/i)).toBeInTheDocument();
  });

  it("reflects a previously saved state instead of nagging", async () => {
    // Simulates landing on the journey after selecting a state on a prior page.
    window.localStorage.setItem(KEY, "IL");
    render(<JourneyStateBanner />);

    expect(await screen.findByText(/personalized for/i)).toBeInTheDocument();
    expect(screen.getByText(/illinois/i)).toBeInTheDocument();
    expect(screen.queryByText(/tell us your state/i)).not.toBeInTheDocument();
  });
});
