import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Per-toolId stage-tool mock: seed comps + market state for the bridge.
const stageState: Record<string, unknown> = {};

vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: (toolId: string, initial: unknown) => ({
    value: stageState[toolId] ?? initial,
    hydrated: true,
    save: vi.fn(),
    reset: vi.fn(),
  }),
}));

// Keep analytics inert in the component test.
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { SuggestedRangeStep } from "./suggested-range-step";

afterEach(() => {
  for (const k of Object.keys(stageState)) delete stageState[k];
});

/** Seed a comps tool state with one home + comps that yield a ~$380–410k range. */
function seedComps() {
  stageState["comps"] = {
    homes: [
      {
        id: "h1",
        label: "Subject",
        sqft: 2000,
        mode: "manual",
        comps: [
          { id: "c1", label: "A", salePrice: 380000, sqft: 2000, adjustment: 0 },
          { id: "c2", label: "B", salePrice: 410000, sqft: 2000, adjustment: 0 },
          { id: "c3", label: "C", salePrice: 395000, sqft: 2000, adjustment: 0 },
        ],
      },
    ],
  };
}

function seedSellerMarket() {
  stageState["market"] = {
    monthsOfSupply: 1.5,
    listToSaleRatio: 103,
    daysOnMarket: 8,
  };
}

describe("SuggestedRangeStep", () => {
  it("renders the comp-anchored band + rationale from comps + market", () => {
    seedComps();
    seedSellerMarket();
    render(<SuggestedRangeStep />);
    expect(screen.getByText(/comps suggest a range of/i)).toBeInTheDocument();
    // Band echoes the comp range (shown in the headline number + rationale).
    expect(
      screen.getAllByText(/\$380,000\s*–\s*\$410,000/).length,
    ).toBeGreaterThan(0);
    // Seller-market rationale references the upper end.
    expect(screen.getByText(/top of/i)).toBeInTheDocument();
  });

  it("NEVER auto-fills the price — there is no 'use this price' control", () => {
    seedComps();
    seedSellerMarket();
    render(<SuggestedRangeStep />);
    expect(
      screen.queryByRole("button", { name: /use this price/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/you should offer/i)).not.toBeInTheDocument();
  });

  it("comps-only (no market) shows the band with an 'add a market read' nudge", () => {
    seedComps();
    render(<SuggestedRangeStep />);
    expect(screen.getByText(/comps suggest a range of/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /add a market read/i }),
    ).toBeInTheDocument();
  });

  it("no comps → empty prompt, no fabricated number", () => {
    seedSellerMarket();
    render(<SuggestedRangeStep />);
    expect(screen.getByText(/add comps to see a suggested range/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$380,000/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open comps worksheet/i }),
    ).toBeInTheDocument();
  });

  it("carries the loud amber UPL disclaimer (offer surface)", () => {
    seedComps();
    seedSellerMarket();
    render(<SuggestedRangeStep />);
    expect(
      screen.getByText(/never tells you what to offer or auto-fills/i),
    ).toBeInTheDocument();
  });

  it("includes I3 pre-offer diligence fields (FHA-neutral)", () => {
    seedComps();
    render(<SuggestedRangeStep />);
    expect(screen.getByText(/pre-offer context/i)).toBeInTheDocument();
    expect(screen.getByText(/why selling, if known/i)).toBeInTheDocument();
  });
});
