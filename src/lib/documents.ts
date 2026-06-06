/**
 * Documents a self-serve buyer needs to gather and keep, grouped by phase.
 * Status is tracked client-side (see useTracker); this module is just the
 * canonical list.
 */

export interface DocumentItem {
  id: string;
  label: string;
  note?: string;
}

export interface DocumentGroup {
  id: string;
  title: string;
  items: DocumentItem[];
}

export const documentGroups: DocumentGroup[] = [
  {
    id: "financing",
    title: "Financing & pre-approval",
    items: [
      { id: "pay-stubs", label: "Recent pay stubs (last 30 days)" },
      { id: "w2s", label: "W-2s / 1099s (last 2 years)" },
      { id: "tax-returns", label: "Tax returns (last 2 years)", note: "Especially if self-employed." },
      { id: "bank-statements", label: "Bank & asset statements (last 2–3 months)" },
      { id: "preapproval", label: "Mortgage pre-approval letter" },
      { id: "loan-estimate", label: "Loan Estimate(s) from lenders", note: "Compare to shop rates." },
    ],
  },
  {
    id: "offer-contract",
    title: "Offer & contract",
    items: [
      { id: "purchase-agreement", label: "Signed purchase agreement" },
      { id: "seller-disclosures", label: "Seller disclosure statement(s)" },
      { id: "lead-paint", label: "Lead-paint disclosure (homes built before 1978)" },
      { id: "earnest-receipt", label: "Earnest money deposit receipt" },
      { id: "counteroffers", label: "Any counteroffers / addenda" },
    ],
  },
  {
    id: "diligence",
    title: "Inspection & due diligence",
    items: [
      { id: "inspection-report", label: "Home inspection report" },
      { id: "repair-requests", label: "Repair/credit requests & responses" },
      { id: "appraisal-report", label: "Appraisal report" },
      { id: "title-commitment", label: "Title commitment / preliminary title report" },
      { id: "hoa-docs", label: "HOA docs & bylaws", note: "If the property is in an HOA." },
    ],
  },
  {
    id: "closing",
    title: "Closing",
    items: [
      { id: "closing-disclosure", label: "Closing Disclosure (CD)", note: "Review at least 3 business days before closing." },
      { id: "homeowners-insurance", label: "Homeowners insurance policy / binder" },
      { id: "clear-to-close", label: "Clear-to-close confirmation from lender" },
      { id: "certified-funds", label: "Certified funds / wire confirmation for closing" },
      { id: "id", label: "Government-issued photo ID for signing" },
    ],
  },
  {
    id: "post-closing",
    title: "Keep after closing",
    items: [
      { id: "deed", label: "Recorded deed" },
      { id: "title-policy", label: "Owner's title insurance policy" },
      { id: "closing-package", label: "Full signed closing package", note: "Keep for taxes and future sale." },
    ],
  },
];

export function totalDocuments(): number {
  return documentGroups.reduce((n, g) => n + g.items.length, 0);
}
