import { render, screen, fireEvent, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

// usePathname drives which accordion section starts expanded.
let mockPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

function openMobileMenu() {
  fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
  // The mobile panel has id="mobile-nav".
  return within(document.getElementById("mobile-nav") as HTMLElement);
}

describe("SiteHeader mobile accordion", () => {
  beforeEach(() => {
    mockPath = "/";
  });

  it("renders the mobile groups collapsed by default", () => {
    render(<SiteHeader />);
    const panel = openMobileMenu();

    const toolsHeader = panel.getByRole("button", { name: /^tools$/i });
    expect(toolsHeader).toHaveAttribute("aria-expanded", "false");
    // A link inside the Tools group is not rendered while collapsed.
    expect(panel.queryByRole("link", { name: /tracker/i })).toBeNull();
  });

  it("expands a group when its header is clicked", () => {
    render(<SiteHeader />);
    const panel = openMobileMenu();
    const toolsHeader = panel.getByRole("button", { name: /^tools$/i });

    fireEvent.click(toolsHeader);

    expect(toolsHeader).toHaveAttribute("aria-expanded", "true");
    expect(panel.getByRole("link", { name: /tracker/i })).toBeInTheDocument();
  });

  it("auto-expands the group containing the current route", () => {
    mockPath = "/tracker"; // Tracker lives in the Tools group
    render(<SiteHeader />);
    const panel = openMobileMenu();

    const toolsHeader = panel.getByRole("button", { name: /^tools$/i });
    expect(toolsHeader).toHaveAttribute("aria-expanded", "true");
    expect(panel.getByRole("link", { name: /tracker/i })).toBeInTheDocument();
  });
});
