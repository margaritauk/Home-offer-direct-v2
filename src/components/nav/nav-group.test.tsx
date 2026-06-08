import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavGroup } from "./nav-group";

// next/navigation + next/link need light mocks under jsdom.
vi.mock("next/navigation", () => ({
  usePathname: () => "/tracker",
}));
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

const items = [
  { href: "/tools/savings-calculator", label: "Savings Calculator" },
  { href: "/tracker", label: "Tracker" },
];

describe("NavGroup", () => {
  it("is collapsed by default with aria-expanded=false", () => {
    render(<NavGroup label="Tools" items={items} />);
    const trigger = screen.getByRole("button", { name: /tools/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks the trigger active when a child route matches the pathname", () => {
    // pathname is mocked to /tracker, which is one of the items.
    render(<NavGroup label="Tools" items={items} />);
    const trigger = screen.getByRole("button", { name: /tools/i });
    expect(trigger.className).toContain("text-brand-700");
  });

  it("opens on click and exposes a menu with menuitems", () => {
    render(<NavGroup label="Tools" items={items} />);
    const trigger = screen.getByRole("button", { name: /tools/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(items.length);
  });

  it("opens via ArrowDown / Enter on the trigger", () => {
    render(<NavGroup label="Tools" items={items} />);
    const trigger = screen.getByRole("button", { name: /tools/i });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape from within the menu", () => {
    render(<NavGroup label="Tools" items={items} />);
    const trigger = screen.getByRole("button", { name: /tools/i });
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders hosted children (e.g. the deal switcher) above the items", () => {
    render(
      <NavGroup label="My Deal" items={items}>
        <div data-testid="hosted">switcher</div>
      </NavGroup>,
    );
    fireEvent.click(screen.getByRole("button", { name: /my deal/i }));
    expect(screen.getByTestId("hosted")).toBeInTheDocument();
  });
});
