import type { GlossaryTerm } from "./journey/types";

/**
 * Plain-English glossary for self-serve home buyers. Definitions are drawn from
 * docs/research/market-research.md (§3) and the steps that reference them.
 */
export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: "down-payment",
    term: "Down payment",
    definition:
      "The portion of the purchase price you pay upfront in cash, separate from closing costs. The 2025–26 median down payment is around 10% of the price.",
    related: ["closing-costs"],
  },
  {
    slug: "closing-costs",
    term: "Closing costs",
    definition:
      "Fees and prepaid items you pay at closing, typically 2–5% of the loan amount, separate from your down payment. They include loan origination, appraisal, title, escrow, recording, and prepaid taxes and insurance.",
    related: ["closing-disclosure", "loan-estimate", "escrow"],
  },
  {
    slug: "commission",
    term: "Buyer-side commission",
    definition:
      "The agent fee historically paid to the buyer's agent, roughly 2.5% of the price. With no buyer's agent, this money only becomes your savings if you negotiate it into a price reduction or seller credit — otherwise the seller keeps it.",
    related: ["concession", "nar-settlement"],
  },
  {
    slug: "pre-approval",
    term: "Pre-approval",
    definition:
      "A lender's conditional commitment to lend you a stated amount after reviewing your income, assets, and credit. It sets your budget and signals to sellers that you are a serious buyer.",
    related: ["loan-estimate", "underwriting"],
  },
  {
    slug: "loan-estimate",
    term: "Loan Estimate (LE)",
    definition:
      "A standardized form a lender gives you about three days after you apply, showing estimated loan terms and costs. It lets you compare lenders side by side and is the document you check your final Closing Disclosure against.",
    related: ["closing-disclosure", "pre-approval"],
  },
  {
    slug: "comps",
    term: "Comparable sales (comps)",
    definition:
      "Recently sold homes nearby that are similar in size, condition, and age, used to judge whether a home's asking price is fair. Comps are the value expertise a buyer's agent normally provides.",
    related: ["mls", "appraisal"],
  },
  {
    slug: "mls",
    term: "MLS (Multiple Listing Service)",
    definition:
      "The regional database of for-sale homes that feeds listing portals like Zillow, Redfin, and Realtor.com. Since the 2024 NAR settlement, buyer-agent compensation can no longer be advertised on the MLS.",
    related: ["comps", "nar-settlement"],
  },
  {
    slug: "nar-settlement",
    term: "2024 NAR settlement",
    definition:
      "The National Association of Realtors antitrust settlement effective August 17, 2024. It stopped buyer-agent commission from being advertised on the MLS and made commission negotiable deal by deal, creating the opening for unrepresented buyers to capture the savings.",
    related: ["commission", "concession", "mls"],
  },
  {
    slug: "purchase-agreement",
    term: "Purchase agreement (PSA)",
    definition:
      "The binding contract between buyer and seller stating the price, contingencies, earnest money, and closing date. Once both parties sign, the deal is 'under contract' and pending.",
    related: ["contingency", "earnest-money", "real-estate-attorney"],
  },
  {
    slug: "contingency",
    term: "Contingency",
    definition:
      "A condition in the contract that lets you modify or exit the deal — and recover your earnest money — if it isn't met. Common contingencies cover inspection, appraisal, financing, and title.",
    related: ["purchase-agreement", "earnest-money", "inspection", "appraisal"],
  },
  {
    slug: "earnest-money",
    term: "Earnest money",
    definition:
      "A good-faith deposit, typically 1–3% of the price, held by a neutral escrow holder. It's applied to your purchase at closing but may be forfeited if you back out for a reason not covered by a contingency.",
    related: ["escrow", "contingency", "wire-fraud"],
  },
  {
    slug: "appraisal",
    term: "Appraisal",
    definition:
      "A lender-ordered, independent valuation of the home to confirm its value supports the loan. It protects the loan, not you; a low appraisal can require renegotiation or more cash.",
    related: ["underwriting", "comps", "contingency"],
  },
  {
    slug: "appraisal-gap",
    term: "Appraisal gap",
    definition:
      "The shortfall when a home appraises for less than the agreed price. Because the lender bases the loan on the lower appraised value, you must cover the gap with extra cash, renegotiate the price, or exit under an appraisal contingency.",
    related: ["appraisal", "contingency", "loan-to-value"],
  },
  {
    slug: "piti",
    term: "PITI",
    definition:
      "The four parts of a typical monthly mortgage payment: Principal, Interest, Taxes, and Insurance. Lenders use PITI (sometimes plus HOA dues) to gauge whether a payment fits your budget.",
    related: ["pmi", "debt-to-income", "down-payment"],
  },
  {
    slug: "pmi",
    term: "PMI (private mortgage insurance)",
    definition:
      "Insurance that protects the lender, not you, typically required on conventional loans when your down payment is under 20%. It's added to your monthly payment and can usually be removed once you reach about 20% equity.",
    related: ["piti", "down-payment", "loan-to-value"],
  },
  {
    slug: "debt-to-income",
    term: "Debt-to-income ratio (DTI)",
    definition:
      "The share of your gross monthly income that goes to debt payments. The front-end ratio counts housing only; the back-end ratio counts all debts. Lenders use DTI limits to decide how much you can borrow.",
    related: ["piti", "pre-approval", "underwriting"],
  },
  {
    slug: "loan-to-value",
    term: "Loan-to-value ratio (LTV)",
    definition:
      "The loan amount divided by the home's value, shown as a percentage. A lower LTV means more equity and less risk to the lender; above 80% LTV on a conventional loan usually triggers PMI.",
    related: ["down-payment", "pmi", "appraisal"],
  },
  {
    slug: "title-search",
    term: "Title search",
    definition:
      "An examination of public records for liens, unpaid taxes, or ownership defects on the property, resulting in a title commitment you should review before closing.",
    related: ["title-insurance", "escrow"],
  },
  {
    slug: "title-insurance",
    term: "Title insurance",
    definition:
      "Protection against problems with the home's title. A lender's policy is required by your lender; an owner's policy is optional but strongly recommended and is a one-time premium that protects your own stake.",
    related: ["title-search"],
  },
  {
    slug: "concession",
    term: "Seller concession",
    definition:
      "A credit from the seller, such as toward your closing costs or, after the NAR settlement, the unpaid buyer-side commission. It's a key way to turn agent-free savings into real dollars at closing.",
    related: ["commission", "closing-costs", "nar-settlement"],
  },
  {
    slug: "seller-disclosure",
    term: "Seller disclosure",
    definition:
      "The seller's statement of known defects in the property. What must be disclosed varies sharply by state — from California's detailed Transfer Disclosure Statement to 'caveat emptor' states that require very little.",
    related: ["inspection"],
  },
  {
    slug: "real-estate-attorney",
    term: "Real estate attorney",
    definition:
      "A lawyer who can draft or review your contract and, in attorney states, conduct or oversee closing. A flat-fee attorney (commonly $500–$1,500+) is the single best way to mitigate the legal risk of buying without an agent.",
    related: ["purchase-agreement", "closing-settlement"],
  },
  {
    slug: "escrow",
    term: "Escrow",
    definition:
      "A neutral third party that holds funds and documents until all closing conditions are met. In escrow/title-company states, an escrow or title company can close the deal without an attorney.",
    related: ["earnest-money", "title-search", "closing-settlement"],
  },
  {
    slug: "wire-fraud",
    term: "Wire fraud",
    definition:
      "A scam where criminals send fake wire instructions to steal your earnest money or closing funds. Always verify wire instructions by phone using a number you independently confirmed before sending money.",
    related: ["earnest-money", "closing-settlement"],
  },
  {
    slug: "inspection",
    term: "Home inspection",
    definition:
      "A licensed inspector's examination of the home's structure, roof, electrical, plumbing, and HVAC. The report is your basis for requesting repairs or credits — or for walking away under an inspection contingency.",
    related: ["contingency", "concession"],
  },
  {
    slug: "underwriting",
    term: "Underwriting",
    definition:
      "The lender's full verification of your income, assets, and credit. The underwriter may issue conditions to satisfy; once everything checks out, you reach 'clear to close.'",
    related: ["pre-approval", "clear-to-close", "appraisal"],
  },
  {
    slug: "clear-to-close",
    term: "Clear to close",
    definition:
      "The point at which underwriting is fully approved and you're ready to schedule closing.",
    related: ["underwriting", "closing-settlement"],
  },
  {
    slug: "closing-disclosure",
    term: "Closing Disclosure (CD)",
    definition:
      "The final accounting of all your loan terms and closing costs. By law your lender must deliver it at least three business days before closing so you can compare it to your Loan Estimate and dispute errors.",
    related: ["loan-estimate", "closing-costs", "closing-settlement"],
  },
  {
    slug: "final-walkthrough",
    term: "Final walkthrough",
    definition:
      "Your last condition check 24–48 hours before closing, confirming the home is unchanged and any agreed repairs were completed. It's your final leverage point before you sign.",
    related: ["inspection", "closing-settlement"],
  },
  {
    slug: "closing-settlement",
    term: "Closing / settlement",
    definition:
      "The final step where you sign the loan and transfer documents, pay your funds, the deed records, and you receive the keys. It's run by a closing attorney in attorney states or a title/escrow company in escrow states.",
    related: ["escrow", "real-estate-attorney", "wire-fraud", "closing-disclosure"],
  },
];

/**
 * Slug → term lookup, built once from {@link glossaryTerms} so callers (notably
 * the inline `<Term>` primitive) get O(1) single-sourced lookups without
 * re-scanning the array. Never duplicate definition copy — read from here.
 */
export const glossaryBySlug: Record<string, GlossaryTerm> = Object.fromEntries(
  glossaryTerms.map((t) => [t.slug, t]),
);

/** All glossary terms, sorted alphabetically by display name. */
export function getAllTerms(): GlossaryTerm[] {
  return [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term));
}

/** Resolve a list of term slugs to their full definitions, preserving order. */
export function getTerms(slugs: string[]): GlossaryTerm[] {
  return slugs
    .map((slug) => glossaryTerms.find((t) => t.slug === slug))
    .filter((t): t is GlossaryTerm => t !== undefined);
}
