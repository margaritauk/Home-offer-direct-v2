import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock the two tool stores by toolId. Inspection has findings; counter-offer has
// a private walk-away max.
vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: (toolId: string) => {
    if (toolId === "inspection") {
      return {
        value: {
          findings: [
            { id: "1", item: "Roof", severity: "major", estCost: 6000, decision: "request-credit" },
            { id: "2", item: "Outlet", severity: "minor", estCost: 200, decision: "accept" },
          ],
        },
        hydrated: true,
      };
    }
    if (toolId === "counter-offer") {
      return { value: { maxPrice: 425000 }, hydrated: true };
    }
    return { value: {}, hydrated: true };
  },
}));

import { NegotiationPlaybook } from "./negotiation-playbook";

describe("NegotiationPlaybook (I2)", () => {
  it("renders the core playbook sections", () => {
    render(<NegotiationPlaybook />);
    expect(screen.getByText("Reading a counter")).toBeInTheDocument();
    expect(screen.getByText("Anchoring & concessions")).toBeInTheDocument();
    expect(screen.getByText("Levers beyond price")).toBeInTheDocument();
    expect(screen.getByText("Repair-negotiation leverage")).toBeInTheDocument();
    expect(screen.getByText("Walk-away discipline")).toBeInTheDocument();
  });

  it("pulls the inspection summary into the repair-leverage note (mocked)", () => {
    render(<NegotiationPlaybook />);
    const panel = screen.getByTestId("repair-leverage");
    // 2 findings, 1 major; buyer's own estimated total $6,200.
    expect(within(panel).getByText(/2 findings/)).toBeInTheDocument();
    expect(within(panel).getByText(/\$6,200/)).toBeInTheDocument();
  });

  it("surfaces the private walk-away max as a quiet, private reminder", () => {
    render(<NegotiationPlaybook />);
    // The reminder shows the stored max and frames it as private.
    expect(screen.getByText(/\$425,000/)).toBeInTheDocument();
    expect(
      screen.getAllByText((content) =>
        /it never goes into a counter/i.test(content),
      ).length,
    ).toBeGreaterThan(0);
  });

  it("frames itself as principles + trade-offs only, never a directive (UPL)", () => {
    render(<NegotiationPlaybook />);
    // The intro explicitly disclaims directive counters.
    expect(
      screen.getByText(/we never tell you to .counter at \$X/i),
    ).toBeInTheDocument();
  });
});
