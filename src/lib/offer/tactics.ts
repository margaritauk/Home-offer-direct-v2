/**
 * Advanced offer-tactics education (issue #15).
 *
 * Pure data: a small set of tactic cards the buyer is likely to hear about when
 * competing for a home. This is EDUCATION ONLY. Per the UPL guardrail we never
 * generate the tactic for the buyer — no escalation caps, no dollar amounts, no
 * appraisal-gap figures, and no "waive X" recommendations. Each card explains
 * what the tactic is, how it can help, and — critically — how it can backfire,
 * and routes the buyer to a licensed real-estate attorney for the actual
 * drafting and the go/no-go call.
 */

export interface OfferTactic {
  id: string;
  name: string;
  /** Plain-language definition of the tactic. */
  whatItIs: string;
  /** How it can strengthen the buyer's position. */
  howItHelps: string;
  /** The specific, concrete way it can hurt the buyer (the risk note). */
  howItBackfires: string;
}

export const OFFER_TACTICS: OfferTactic[] = [
  {
    id: "escalation-clause",
    name: "Escalation clause",
    whatItIs:
      "A clause that automatically raises your offer by a set increment above a competing offer, up to a maximum you specify, when the seller has another bona fide offer.",
    howItHelps:
      "It lets you stay competitive in a bidding war without overpaying by default — you only go higher if a genuine competing offer forces it, up to your ceiling.",
    howItBackfires:
      "Drafting an escalation clause is widely treated as the practice of law, so this is one to hand to a real estate attorney. It also shows the seller your top number, can be triggered by an offer you can't verify, and may exceed what the home will appraise for.",
  },
  {
    id: "appraisal-gap-coverage",
    name: "Appraisal-gap coverage",
    whatItIs:
      "A commitment to pay some or all of the difference, in cash, if the home appraises below your contract price, instead of renegotiating or walking.",
    howItHelps:
      "It reassures the seller your financing won't fall apart over a low appraisal, which can make your offer stand out against ones that keep a full appraisal contingency.",
    howItBackfires:
      "If it appraises low, that gap is cash out of your own pocket on top of your down payment — money you don't get back — and you may have waived the protection that would have let you renegotiate or walk.",
  },
  {
    id: "as-is-offer",
    name: "As-is offer",
    whatItIs:
      "An offer stating you'll buy the home in its current condition, with the seller not obligated to make repairs or give credits.",
    howItHelps:
      "It signals a low-friction, fast close to the seller and can make your offer more attractive than ones loaded with repair demands.",
    howItBackfires:
      "As-is waives your repair leverage: even if an inspection turns up real problems, the seller owes you nothing. Whether you keep an inspection right to walk (versus to negotiate) is a decision to make carefully with your attorney.",
  },
  {
    id: "rent-back",
    name: "Rent-back (seller leaseback)",
    whatItIs:
      "An agreement letting the seller stay in the home for a period after closing, usually paying you rent or a daily occupancy fee.",
    howItHelps:
      "It gives the seller flexibility on their move-out timing, which can make your offer more appealing than one that forces them out at closing.",
    howItBackfires:
      "Rent-backs longer than roughly 60 days can trigger loan and occupancy-fraud issues, since your lender expects you to occupy a primary residence. You also take on landlord-style risk — damage, holdover, and insurance gaps — so the terms belong with your attorney and lender.",
  },
];
