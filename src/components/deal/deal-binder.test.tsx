import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DealBinder } from "./deal-binder";
import { getStages } from "@/lib/journey";
import { stageTaskKeys } from "@/lib/journey/progress";
import { NOT_A_LAW_FIRM } from "@/components/legal-notice";

// Exercises the REAL localStorage-backed collectDeal() path (jsdom). We seed the
// individual tool/store keys exactly as the live tools do, render the binder,
// and assert each seeded section surfaces its key figure — and that an empty
// store degrades to "Not yet entered" everywhere without crashing.

function findSection(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title, level: 2 });
  // The <section className="card"> wrapping the heading.
  const section = heading.closest("section");
  if (!section) throw new Error(`No section wrapper for "${title}"`);
  return section as HTMLElement;
}

describe("DealBinder", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders each seeded section's key value", () => {
    // Budget — a $400k home, 10% down, 6.5% / 30yr → a known non-zero payment.
    window.localStorage.setItem(
      "hod:tool:budget:v1",
      JSON.stringify({
        mode: "payment",
        piti: {
          price: 400_000,
          downPct: 10,
          ratePct: 6.5,
          termYears: 30,
          propTaxYr: 4_400,
          insuranceYr: 1_500,
          hoaMo: 0,
          pmiRatePct: 0.5,
        },
      }),
    );

    // Savings — 2.5% of $400k captured at 100% = $10,000.
    window.localStorage.setItem(
      "hod:tool:savings:v1",
      JSON.stringify({
        homePrice: 400_000,
        downPaymentPercent: 10,
        buyerCommissionPercent: 2.5,
        captureRatePercent: 100,
        closingCostPercent: 3,
      }),
    );

    // Comps — one home with two comps and a subject sqft → a value range.
    window.localStorage.setItem(
      "hod:tool:comps:v1",
      JSON.stringify({
        homes: [
          {
            id: "h1",
            label: "123 Maple St",
            sqft: 2_000,
            mode: "manual",
            comps: [
              { id: "c1", label: "A", salePrice: 400_000, sqft: 2_000, adjustment: 0 },
              { id: "c2", label: "B", salePrice: 420_000, sqft: 2_000, adjustment: 0 },
            ],
          },
        ],
      }),
    );

    // Offer — a concrete purchase price the term-sheet will print.
    window.localStorage.setItem(
      "hod:offer:v1",
      JSON.stringify({
        price: 425_000,
        earnestMoney: 5_000,
        isPercent: false,
        financingType: "conventional",
        downPaymentPercent: 10,
        closingDate: "2026-08-15",
        possession: "At closing",
        fixturesIncluded: "",
        fixturesExcluded: "",
        closingCostPreference: "buyer-pays",
        contingencies: {},
        concession: { type: "none", percent: 0 },
        updatedAt: "2026-06-11T00:00:00.000Z",
      }),
    );

    // Tracker — both dates so milestones (incl. the closing date) appear.
    window.localStorage.setItem(
      "hod:tracker:v1",
      JSON.stringify({
        underContractDate: "2026-07-01",
        closingDate: "2026-08-15",
        offsets: {
          earnestMoneyDays: 3,
          inspectionContingencyDays: 10,
          appraisalContingencyDays: 17,
          financingContingencyDays: 21,
          titleReviewDays: 14,
        },
        docs: {},
      }),
    );

    // Progress — complete one real task so the journey percent is > 0%.
    const firstStage = getStages()[0];
    const firstTaskKey = stageTaskKeys(firstStage)[0];
    window.localStorage.setItem(
      "hod:progress:v1",
      JSON.stringify({ [firstTaskKey]: true }),
    );

    render(<DealBinder />);

    // Budget: the recomputed monthly payment is shown.
    expect(screen.getByTestId("binder-piti-total").textContent).toMatch(/\/mo$/);
    expect(screen.getByTestId("binder-piti-total").textContent).not.toMatch(
      /\$0\/mo/,
    );

    // Savings: the captured-savings figure.
    expect(screen.getByTestId("binder-captured-savings").textContent).toMatch(
      /\$10,000/,
    );

    // Comps: the seeded home label + a fair-value range.
    const comps = findSection("Comps");
    expect(within(comps).getByText("123 Maple St")).toBeInTheDocument();
    expect(within(comps).getByText(/Estimated fair value/)).toBeInTheDocument();

    // Offer: the purchase price from the term-sheet.
    const offer = findSection("Offer");
    expect(within(offer).getByText(/\$425,000/)).toBeInTheDocument();

    // Deadlines: the seeded closing date appears in the milestone list.
    const deadlines = findSection("Deadlines");
    expect(within(deadlines).getAllByText("2026-08-15").length).toBeGreaterThan(0);

    // Journey progress: a non-zero percent.
    expect(screen.getByTestId("binder-progress").textContent).not.toBe("0%");
  });

  it("shows 'Not yet entered' in every section when storage is empty", () => {
    render(<DealBinder />);

    for (const title of ["Budget", "Savings", "Comps", "Offer", "Deadlines"]) {
      const section = findSection(title);
      expect(
        within(section).getByTestId("not-yet-entered"),
      ).toBeInTheDocument();
    }

    // Journey progress still renders (0%), never crashes.
    expect(screen.getByTestId("binder-progress").textContent).toBe("0%");
  });

  it("carries the attorney-review framing and a no-print print button", () => {
    render(<DealBinder />);

    // The "not a law firm" framing is present.
    expect(screen.getAllByText(new RegExp(NOT_A_LAW_FIRM)).length).toBeGreaterThan(
      0,
    );

    // The print button opts out of printing via .no-print on its container.
    const printButton = screen.getByRole("button", {
      name: /Print \/ Save as PDF/,
    });
    expect(printButton.closest(".no-print")).not.toBeNull();
  });
});
