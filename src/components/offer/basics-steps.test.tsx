import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyOffer } from "@/hooks/use-offer";
import {
  PriceStep,
  FinancingStep,
  DatesStep,
  PropertyStep,
} from "./basics-steps";

describe("PriceStep", () => {
  it("reports the typed purchase price", () => {
    const onChange = vi.fn();
    render(<PriceStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Purchase price"), {
      target: { value: "725,000" },
    });
    expect(onChange).toHaveBeenCalledWith({ price: 725000 });
  });

  it("shows the percent earnest-money field when isPercent is true", () => {
    const onChange = vi.fn();
    render(
      <PriceStep offer={emptyOffer()} onChange={onChange} hydrated />,
    );
    fireEvent.change(screen.getByLabelText("Earnest money (% of price)"), {
      target: { value: "2.5" },
    });
    expect(onChange).toHaveBeenCalledWith({ earnestMoney: 2.5 });
  });

  it("switches to a dollar earnest-money field when isPercent is false", () => {
    const offer = { ...emptyOffer(), isPercent: false, earnestMoney: 10000 };
    render(<PriceStep offer={offer} onChange={() => {}} hydrated />);
    expect(screen.queryByLabelText("Earnest money (% of price)")).toBeNull();
    expect(
      (screen.getByLabelText("Earnest money ($)") as HTMLInputElement).value,
    ).toBe("10,000");
  });

  it("toggles the percent/dollar mode via the checkbox", () => {
    const onChange = vi.fn();
    render(<PriceStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /enter earnest money as a percent/i,
      }),
    );
    // emptyOffer starts isPercent=true, so the checkbox click turns it off.
    expect(onChange).toHaveBeenCalledWith({ isPercent: false });
  });
});

describe("FinancingStep", () => {
  it("reports the chosen financing type", () => {
    const onChange = vi.fn();
    render(<FinancingStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Financing type"), {
      target: { value: "fha" },
    });
    expect(onChange).toHaveBeenCalledWith({ financingType: "fha" });
  });

  it("shows the down-payment field for financed offers", () => {
    const onChange = vi.fn();
    render(<FinancingStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Down payment (% of price)"), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledWith({ downPaymentPercent: 20 });
  });

  it("hides the down-payment field for an all-cash offer", () => {
    const offer = { ...emptyOffer(), financingType: "cash" as const };
    render(<FinancingStep offer={offer} onChange={() => {}} hydrated />);
    expect(screen.queryByLabelText("Down payment (% of price)")).toBeNull();
  });
});

describe("DatesStep", () => {
  it("reports the target closing date", () => {
    const onChange = vi.fn();
    render(<DatesStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Target closing date"), {
      target: { value: "2026-08-01" },
    });
    expect(onChange).toHaveBeenCalledWith({ closingDate: "2026-08-01" });
  });

  it("reports possession text", () => {
    const onChange = vi.fn();
    render(<DatesStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Possession"), {
      target: { value: "30-day rent-back" },
    });
    expect(onChange).toHaveBeenCalledWith({ possession: "30-day rent-back" });
  });
});

describe("PropertyStep", () => {
  it("reports included and excluded fixtures", () => {
    const onChange = vi.fn();
    render(<PropertyStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(
      screen.getByLabelText("Fixtures & personal property included"),
      { target: { value: "Refrigerator" } },
    );
    expect(onChange).toHaveBeenCalledWith({ fixturesIncluded: "Refrigerator" });
    fireEvent.change(screen.getByLabelText("Items excluded"), {
      target: { value: "Chandelier" },
    });
    expect(onChange).toHaveBeenCalledWith({ fixturesExcluded: "Chandelier" });
  });

  it("reports the closing-cost allocation choice", () => {
    const onChange = vi.fn();
    render(<PropertyStep offer={emptyOffer()} onChange={onChange} hydrated />);
    fireEvent.change(screen.getByLabelText("Closing-cost allocation"), {
      target: { value: "seller-credit" },
    });
    expect(onChange).toHaveBeenCalledWith({
      closingCostPreference: "seller-credit",
    });
  });
});
