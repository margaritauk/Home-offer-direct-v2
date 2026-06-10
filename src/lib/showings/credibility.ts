/**
 * Pre-approval / proof-of-funds prep (issue #21).
 *
 * Before an unrepresented buyer contacts a listing agent, having a few
 * credibility documents ready makes them look serious and gets showings booked
 * faster. This is the standard "get credible" checklist plus the guidance to
 * say *that* you're pre-approved without volunteering your maximum budget.
 *
 * GUARDRAIL (#22, don't over-disclose): the listing agent works for the SELLER.
 * Share enough to be taken seriously, not your negotiating position.
 */

/** A credibility document to have ready before reaching out. */
export interface CredibilityDoc {
  id: string;
  label: string;
  /** Why it helps / what to share (and not share). */
  note: string;
}

export const CREDIBILITY_DOCS: readonly CredibilityDoc[] = [
  {
    id: "pre-approval",
    label: "Mortgage pre-approval letter",
    note: "Shows a lender has vetted you. Share that you're pre-approved — you do NOT need to reveal the maximum amount you're approved for.",
  },
  {
    id: "proof-of-funds",
    label: "Proof of funds (for your down payment / closing costs)",
    note: "A recent bank/brokerage statement showing you have the cash. You can black out the account number and exact balance beyond what's needed.",
  },
  {
    id: "photo-id",
    label: "Government photo ID",
    note: "Many agents ask for ID before an in-person showing for safety. Bring it to the tour.",
  },
] as const;

/** The single don't-over-disclose tip, surfaced prominently in the request flow. */
export const DISCLOSURE_TIP =
  "Tell the agent that you're pre-approved and have funds ready — but keep your maximum budget, timeline pressure, and how much you love the home to yourself. The listing agent represents the seller.";
