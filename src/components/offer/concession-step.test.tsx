import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyOffer } from "@/hooks/use-offer";
import { ConcessionStep } from "./concession-step";

describe("ConcessionStep", () => {
  it("reports a changed concession percent", () => {
    const onChange = vi.fn();
    render(<ConcessionStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Percent of price to ask for"), {
      target: { value: "3" },
    });
    expect(onChange).toHaveBeenCalledWith({
      concession: { type: "price-reduction", percent: 3 },
    });
  });

  it("reports a changed framing via the radio group", () => {
    const onChange = vi.fn();
    render(<ConcessionStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.click(screen.getByRole("radio", { name: /closing-cost credit/i }));
    expect(onChange).toHaveBeenCalledWith({
      concession: { type: "closing-credit", percent: 2.5 },
    });
  });

  it("shows $0 at stake when the buyer is not asking", () => {
    const offer = {
      ...emptyOffer(),
      price: 700000,
      concession: { type: "none" as const, percent: 2.5 },
    };
    render(<ConcessionStep offer={offer} onChange={() => {}} hydrated />);
    expect(screen.getByTestId("concession-at-stake").textContent).toBe("$0");
  });
});
