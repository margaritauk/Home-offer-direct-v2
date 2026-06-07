import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TermSheetPreview } from "./term-sheet-preview";
import type { Offer } from "@/lib/offer/types";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    fixturesIncluded: "Refrigerator",
    fixturesExcluded: "Chandelier",
    closingCostPreference: "buyer-pays",
    contingencies: {
      inspection: { included: true, days: 10 },
      appraisal: { included: true, days: 17 },
      financing: { included: true, days: 21 },
      "sale-of-home": { included: false, days: 45 },
      title: { included: true, days: 14 },
    },
    concession: { type: "price-reduction", percent: 2.5 },
    updatedAt: "2026-06-07T00:00:00.000Z",
  };
}

describe("TermSheetPreview", () => {
  it("renders the diagonal SAMPLE watermark", () => {
    render(<TermSheetPreview offer={makeOffer()} />);
    const watermark = screen.getByTestId("term-sheet-watermark");
    expect(watermark).toBeInTheDocument();
    expect(watermark.textContent).toMatch(/HomeOffer Direct — SAMPLE/);
  });

  it("renders inside a print-styled document container", () => {
    render(<TermSheetPreview offer={makeOffer()} />);
    expect(screen.getByTestId("term-sheet-document")).toBeInTheDocument();
  });

  it("shows the persistent worksheet / attorney-review disclaimer", () => {
    render(<TermSheetPreview offer={makeOffer()} />);
    // Appears in the OfferDisclaimer notes and the document footer.
    const notes = screen.getAllByText(/subject to attorney review/i);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/worksheet — not a binding contract; subject to attorney review/i),
    ).toBeInTheDocument();
  });

  it("renders the term-sheet content (price section)", () => {
    render(<TermSheetPreview offer={makeOffer()} />);
    expect(screen.getByText("Price & deposit")).toBeInTheDocument();
    expect(screen.getByText("Purchase price")).toBeInTheDocument();
  });

  it("disables the 'Remove watermark & export' CTA (coming soon, not paid flow yet)", () => {
    render(<TermSheetPreview offer={makeOffer()} />);
    const cta = screen.getByRole("button", { name: /remove watermark & export/i });
    expect(cta).toBeDisabled();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
