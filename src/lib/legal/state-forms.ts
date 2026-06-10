/**
 * State-form links (issue #16).
 *
 * Pure data + resolver mapping a state to a *publicly available, authoritative*
 * purchase-agreement or real-estate-form source where one genuinely exists in
 * the open (typically a state real estate commission's consumer/forms page).
 *
 * IMPORTANT (honesty + UPL guardrail):
 *  - Most residential purchase contracts in the U.S. are REALTOR®/MLS forms that
 *    are membership-gated and NOT public — for those states we return `null` and
 *    rely on the fallback ("no public statewide form — use a flat-fee attorney
 *    or the listing brokerage's contract").
 *  - We never invent official-looking URLs. Every entry below points at a real,
 *    publicly reachable government/commission page and is sourced in a comment.
 *  - These are blank educational/consumer forms, never a filled, ready-to-sign
 *    contract. The buyer still routes to an attorney for review.
 */

export interface StateFormLink {
  /** Human-readable description of the source. */
  label: string;
  /** Absolute https URL to a public, authoritative form/consumer page. */
  url: string;
}

interface StateFormEntry extends StateFormLink {
  /** Two-letter state code (uppercase). */
  code: string;
}

/**
 * Curated list of states with a genuinely public, authoritative form source.
 * Kept deliberately small — only states where a government body publishes a
 * relevant consumer/contract resource in the open. Each carries its source.
 */
export const STATE_FORM_LINKS: StateFormEntry[] = [
  {
    // Oklahoma Real Estate Commission publishes its mandatory contract forms
    // (including the Residential Sale Contract) publicly on its state .gov site.
    code: "OK",
    label: "Oklahoma Real Estate Commission — official contract forms",
    url: "https://oklahoma.gov/orec/forms-and-applications/contract-forms.html",
  },
  {
    // Florida's DBPR / Florida Realtors–Florida Bar (FR/BAR) contract is the
    // standard; the Florida Real Estate Commission (DBPR) publishes consumer
    // resources publicly. Point at the state regulator's consumer page.
    code: "FL",
    label: "Florida DBPR — Division of Real Estate consumer resources",
    url: "https://www2.myfloridalicense.com/real-estate-commission/",
  },
];

/**
 * Resolve a state code to its public form link, or `null` when no public
 * statewide form exists (the common case — caller shows the attorney fallback).
 *
 * Case-insensitive and whitespace-tolerant; blank/unknown input returns `null`.
 */
export function stateFormLink(stateCode: string): StateFormLink | null {
  const normalized = stateCode.trim().toUpperCase();
  if (!normalized) return null;
  const entry = STATE_FORM_LINKS.find((e) => e.code === normalized);
  if (!entry) return null;
  return { label: entry.label, url: entry.url };
}
