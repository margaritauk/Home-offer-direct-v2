/**
 * Per-state legal engine domain model.
 *
 * A {@link StateProfile} captures the jurisdiction-specific facts a self-serve
 * buyer needs: who conducts closing (attorney vs escrow/title company), whether
 * an attorney is legally required, the seller-disclosure regime, who customarily
 * pays transfer tax, and links to authoritative state sources.
 *
 * IMPORTANT: this is guidance + official-form references, NOT legal advice and
 * NOT generated legal documents. Always link to the authoritative source.
 */

/** How a residential purchase customarily closes in the jurisdiction. */
export type ClosingPath =
  /** An attorney must conduct or materially oversee closing. */
  | "attorney"
  /** A title or escrow company customarily handles closing; no attorney needed. */
  | "escrow"
  /** Both models are common / permitted; practice varies by region or deal. */
  | "either";

/** How much the seller is legally required to disclose about the property. */
export type DisclosureRegime =
  /** A specific statutory disclosure form is mandated (e.g. CA's TDS). */
  | "statutory-form"
  /** Written disclosure of known defects is required, no single mandated form. */
  | "written-disclosure"
  /** Limited / caveat-emptor leaning: seller discloses comparatively little. */
  | "limited";

export interface StateResource {
  label: string;
  href: string;
}

export interface StateProfile {
  /** Two-letter postal code, uppercase (e.g. "CA"). Unique. */
  code: string;
  /** Full jurisdiction name (e.g. "California", "District of Columbia"). */
  name: string;

  closingPath: ClosingPath;
  /** True when an attorney is legally required to be involved at closing. */
  attorneyRequiredAtClosing: boolean;
  /** One- to two-sentence plain-English explanation of the closing process. */
  closingNote: string;

  disclosureRegime: DisclosureRegime;
  /** Name of the mandated/standard disclosure form, when one exists. */
  disclosureFormName?: string;
  /** One- to two-sentence explanation of disclosure expectations. */
  disclosureNote: string;

  /** Who customarily pays state/local real-estate transfer tax, plus any note. */
  transferTaxNote: string;

  /** 2-4 short, actionable bullets specific to buying agent-free in this state. */
  highlights: string[];

  /** Links to authoritative sources (state real-estate commission, AG, forms). */
  resources: StateResource[];
}
