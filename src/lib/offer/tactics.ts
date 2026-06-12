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

/**
 * Multiple-offer / bidding-war playbook (A3).
 *
 * Education-only cards for the levers buyers hear about when a home draws
 * multiple offers. Same shape as {@link OfferTactic} (every card carries a
 * concrete "how it backfires" trade-off the QA plan asserts on). Per the UPL
 * guardrail these are TRADE-OFFS, never directives — we never tell the buyer to
 * waive a contingency, size their earnest money, or out-bid anyone. The
 * earnest-money (1–3%), appraisal-gap (3–10%), and other norms are market
 * context, dated, from the Researcher brief (2026-06-12): Slocum / Abrams 2025,
 * offer-process research §1.1.
 *
 * FHA: terms only — there is deliberately NO "buyer love letter" / personal-
 * appeal card here, since that invites protected-class signaling.
 */
export const MULTIPLE_OFFER_TACTICS: OfferTactic[] = [
  {
    id: "earnest-money-sizing",
    name: "Earnest-money size as a signal",
    whatItIs:
      "Earnest money is a good-faith deposit held in escrow. In competitive situations it commonly runs about 1–3% of price (sometimes higher), and a larger or partly non-refundable deposit reads as commitment.",
    howItHelps:
      "A bigger deposit signals you're serious and well-funded, which can make a seller choosing among similar offers more confident yours will close.",
    howItBackfires:
      "Earnest money is at real risk if you default or step outside your contingencies — a larger or non-refundable deposit raises what you could forfeit. How much to put down, and whether any of it is non-refundable, is a decision for you and your attorney.",
  },
  {
    id: "terms-beyond-price",
    name: "Terms beyond price",
    whatItIs:
      "Non-price levers a seller weighs alongside the number: a flexible or quick close, a seller-chosen possession date, a rent-back, or buying as-is.",
    howItHelps:
      "When two offers are close on price, the cleaner or more convenient terms can win — sometimes a seller takes a slightly lower, easier offer over a higher, complicated one.",
    howItBackfires:
      "Every term you give up is protection you give up: a faster close compresses your due-diligence time, and as-is waives repair leverage. These are trade-offs to weigh deal-by-deal, not moves to make by default — review contract terms with your attorney.",
  },
  {
    id: "contingency-and-close-levers",
    name: "Contingency & closing-date levers",
    whatItIs:
      "Shortening or removing contingencies (inspection, appraisal, financing) and matching the seller's preferred timeline are common ways buyers try to stand out.",
    howItHelps:
      "Fewer or shorter contingencies and a timeline that suits the seller make your offer look lower-risk and more likely to close on their terms.",
    howItBackfires:
      "Each contingency is an exit. Waiving one means giving up the right to walk (and often your earnest money) if that issue turns up — a low appraisal, a failed inspection, or financing falling through. Whether to keep or shorten any contingency is a decision for you and your attorney, never a default.",
  },
  {
    id: "highest-and-best",
    name: '"Highest & best" requests',
    whatItIs:
      "When several offers arrive, a seller may ask all buyers for their \"highest and best\" by a deadline — a single best-foot-forward round rather than a back-and-forth.",
    howItHelps:
      "It's your chance to put your strongest terms forward knowing there's competition, without an open-ended bidding war.",
    howItBackfires:
      "You're bidding blind: there's no obligation to disclose the other offers, and you can't verify them, so it's easy to talk yourself past your own maximum. Set your private walk-away number first and stick to it.",
  },
  {
    id: "pre-approval-strength",
    name: "Pre-approval over pre-qualification",
    whatItIs:
      "A pre-approval reflects a lender's verified review of your finances; a pre-qualification is a lighter, estimate-only check. Some buyers also add proof of funds.",
    howItHelps:
      "A full pre-approval (and proof of funds for the cash portion) reassures a seller your financing is solid, which can edge out an offer backed only by a pre-qual.",
    howItBackfires:
      "Pre-approval isn't a loan commitment — it can still fall through on the appraisal, the property, or a change in your finances, so don't treat it as a guarantee or stretch beyond what you can actually carry.",
  },
];
