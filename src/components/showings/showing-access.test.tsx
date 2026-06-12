import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let mockState: string | undefined;
vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({ stateCode: mockState, hydrated: true }),
}));

import { ShowingAccess } from "./showing-access";

beforeEach(() => {
  mockState = undefined;
});

describe("ShowingAccess", () => {
  it("renders the scenario script picker with the access scripts", () => {
    render(<ShowingAccess />);
    const picker = screen.getByLabelText("Showing scenario") as HTMLSelectElement;
    expect(picker).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /won't show to an unrepresented buyer/i }),
    ).toBeInTheDocument();
  });

  it('offers the "I have my own attorney" fallback', () => {
    render(<ShowingAccess />);
    expect(
      screen.getByRole("option", { name: /representing myself and have my own attorney/i }),
    ).toBeInTheDocument();
  });

  it("prompts for a state before showing the dual-agency caution", () => {
    render(<ShowingAccess />);
    expect(
      screen.getByText(/pick your state to see local rules/i),
    ).toBeInTheDocument();
  });

  it("shows a state-aware dual-agency caution when a banned state is selected (FL)", () => {
    mockState = "FL";
    render(<ShowingAccess />);
    expect(screen.getByText(/Dual agency banned/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot represent both/i)).toBeInTheDocument();
  });

  it("feeds the Tour Scorecard via a handoff link", () => {
    render(<ShowingAccess />);
    expect(screen.getByTestId("tour-scorecard-link")).toHaveAttribute(
      "href",
      "/tools/tour-scorecard",
    );
  });

  it("screens protected-class terms out of the custom line on blur", () => {
    render(<ShowingAccess />);
    const extra = screen.getByLabelText("Add your own line") as HTMLTextAreaElement;
    fireEvent.change(extra, { target: { value: "We have two children" } });
    fireEvent.blur(extra);
    expect(extra.value).not.toMatch(/children/i);
    expect(extra.value).toContain("[removed]");
  });
});
