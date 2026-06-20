import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// The embedded tools persist via useStageTool — give them a working in-memory
// stub so they hydrate and render their interactive controls.
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
      undoReset: () => {},
      canUndoReset: false,
    };
  },
}));

vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({
    stateCode: "CA",
    hydrated: true,
    selectState: () => {},
  }),
}));

import { StateToolPage } from "./state-tool-page";
import { SavingsCalculator } from "@/components/savings-calculator";
import { ClosingDayTool } from "./closing-day";
import { getStateProfile } from "@/lib/states/data";

const CA = getStateProfile("CA")!;

describe("StateToolPage (S7-SEO1 generated tool page)", () => {
  it("renders the '…in <state>' heading, the working savings tool, and a state CTA", () => {
    render(
      <StateToolPage slug="savings-calculator" profile={CA}>
        <SavingsCalculator />
      </StateToolPage>,
    );
    expect(
      screen.getByRole("heading", {
        name: /commission savings calculator for california/i,
      }),
    ).toBeInTheDocument();
    // The embedded tool's interactive controls are present (above the fold).
    expect(screen.getByLabelText(/home price/i)).toBeInTheDocument();
    // Keyboard-reachable, descriptive activation CTA (a link, not "click here").
    const cta = screen.getByRole("link", {
      name: /start your california journey/i,
    });
    expect(cta).toHaveAttribute("href", "/journey");
  });

  it("renders objective state facts with a SourceStamp on the closing-path page", () => {
    render(
      <StateToolPage slug="closing-path" profile={CA}>
        <ClosingDayTool />
      </StateToolPage>,
    );
    const facts = screen.getByRole("region", {
      name: /objective california facts/i,
    });
    expect(within(facts).getByText(/closing path/i)).toBeInTheDocument();
    // SourceStamp text is present (source + as-of), not a tooltip.
    expect(screen.getByText(/as of 2026-01-01/i)).toBeInTheDocument();
  });

  it("emits JSON-LD structured data (interactive tool, not pure prose)", () => {
    const { container } = render(
      <StateToolPage slug="savings-calculator" profile={CA}>
        <SavingsCalculator />
      </StateToolPage>,
    );
    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(ld).not.toBeNull();
    expect(ld!.textContent).toContain("WebApplication");
  });

  it("empty/unknown state → sensible default + a state picker (no crash, no 404)", () => {
    render(
      <StateToolPage slug="savings-calculator" profile={null}>
        <SavingsCalculator />
      </StateToolPage>,
    );
    // The tool still renders.
    expect(screen.getByLabelText(/home price/i)).toBeInTheDocument();
    // A state picker prompt is shown.
    expect(screen.getByText(/choose your state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your state/i)).toBeInTheDocument();
  });
});
