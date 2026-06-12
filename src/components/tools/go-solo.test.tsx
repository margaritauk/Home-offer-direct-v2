import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real state so the checklist is interactive without
// touching localStorage (mirrors the clear-to-close component test).
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

import { GoSolo } from "./go-solo";

describe("GoSolo", () => {
  it("opens with the neutral, balanced 'solo is reasonable' read", () => {
    render(<GoSolo />);
    expect(
      screen.getByText(/going solo is reasonable for many straightforward purchases/i),
    ).toBeInTheDocument();
  });

  it("surfaces a two-sided 'consider help' read when factors are checked — never a verdict", () => {
    render(<GoSolo />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: /complex or clouded title/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /new construction/i }),
    );
    expect(screen.getByText(/higher-stakes factors apply/i)).toBeInTheDocument();
    expect(screen.getAllByText(/many buyers/i).length).toBeGreaterThan(0);
    // UPL: no directive.
    expect(screen.queryByText(/you must hire/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do not use an agent/i)).not.toBeInTheDocument();
  });

  it("renders the post-NAR facts block (written agreement since Aug 2024; comp negotiable)", () => {
    render(<GoSolo />);
    expect(screen.getByText(/August 17, 2024/)).toBeInTheDocument();
    expect(
      screen.getByText(/written buyer-agency agreement before touring/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/negotiable and not guaranteed seller-paid/i),
    ).toBeInTheDocument();
    // Frames clearly that the unrepresented path does NOT trigger the requirement.
    expect(
      screen.getByText(/does not trigger that agreement requirement/i),
    ).toBeInTheDocument();
  });

  it("renders a citation + date node (accuracy compliance)", () => {
    render(<GoSolo />);
    const source = screen.getByTestId("go-solo-source");
    expect(source.textContent).toMatch(/NAR Settlement FAQs/i);
    expect(source.textContent).toMatch(/Aug 17, 2024/);
    expect(source.textContent).toMatch(/As of 2026/);
  });

  it("names the menu of help and links to /pros as optional, not a funnel-out", () => {
    render(<GoSolo />);
    expect(screen.getByText(/flat-fee or hourly real-estate attorney/i)).toBeInTheDocument();
    const pros = screen.getByRole("link", { name: /flat-fee attorneys/i });
    expect(pros).toHaveAttribute("href", "/pros");
  });
});
