import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfferStrength } from "./offer-strength";
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
      "attorney-review": { included: true, days: 5 },
    },
    concession: { type: "price-reduction", percent: 2.5 },
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  };
}

describe("OfferStrength AI surface", () => {
  // NEXT_PUBLIC_AI_EXPLAINER is unset in the test env (default off), so the
  // module-level flag resolves false and the AI surface stays "Coming soon".
  it("stays 'Coming soon' and offers NO AI action when the flag is unset", () => {
    render(<OfferStrength offer={makeOffer()} />);

    // The deterministic read still renders.
    expect(
      screen.getByRole("heading", { name: /how your offer reads/i }),
    ).toBeInTheDocument();

    // No AI action button.
    expect(
      screen.queryByRole("button", { name: /explain my offer's strength \(ai\)/i }),
    ).not.toBeInTheDocument();

    // The "Coming soon" affordance is present.
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();

    // And no live AI not-advice label is shown until the feature is on + run.
    expect(
      screen.queryByText(/no acceptance guarantee/i),
    ).not.toBeInTheDocument();
  });
});
