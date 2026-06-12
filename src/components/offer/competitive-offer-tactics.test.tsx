import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// No state selected by default → no escalation caution banner.
vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({ stateCode: null, hydrated: true }),
}));

import { CompetitiveOfferTactics } from "./competitive-offer-tactics";

describe("CompetitiveOfferTactics (A3)", () => {
  it("models the escalation result from the buyer's own numbers", () => {
    render(<CompetitiveOfferTactics />);

    fireEvent.change(screen.getByLabelText("Your base (starting) offer"), {
      target: { value: "400000" },
    });
    fireEvent.change(screen.getByLabelText("Beat-by increment"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText("Your cap (maximum price)"), {
      target: { value: "430000" },
    });
    fireEvent.change(screen.getByLabelText("Assumed competing offer"), {
      target: { value: "410000" },
    });

    const result = screen.getByLabelText("Escalation result");
    // min(410k + 5k, 430k) = 415k
    expect(within(result).getByText("$415,000")).toBeInTheDocument();
  });

  it("shows the appraisal-gap cash impact and a zero-gap empty state", () => {
    render(<CompetitiveOfferTactics />);

    fireEvent.change(screen.getByLabelText("Your contract / offer price"), {
      target: { value: "410000" },
    });
    fireEvent.change(screen.getByLabelText("Hypothetical appraised value"), {
      target: { value: "400000" },
    });

    const gap = screen.getByLabelText("Appraisal-gap result");
    expect(within(gap).getByText("$10,000")).toBeInTheDocument();

    // Raise appraised above contract → no gap to cover.
    fireEvent.change(screen.getByLabelText("Hypothetical appraised value"), {
      target: { value: "420000" },
    });
    expect(within(gap).getByText(/No gap to cover/i)).toBeInTheDocument();
  });

  it("notes that some markets restrict escalation clauses and routes drafting to an attorney", () => {
    render(<CompetitiveOfferTactics />);
    expect(
      screen.getByText(/some markets restrict or disfavor them/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /attorney draft the clause/i }),
    ).toBeInTheDocument();
  });

  it("renders the multiple-offer playbook with a UPL disclaimer and no directive", () => {
    render(<CompetitiveOfferTactics />);
    expect(
      screen.getByText(/Education only — not legal/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Earnest-money size as a signal/i)).toBeInTheDocument();
    // UPL: no directive imperatives in the rendered tactics.
    expect(screen.queryByText(/you should offer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/waive your appraisal/i)).not.toBeInTheDocument();
  });
});
