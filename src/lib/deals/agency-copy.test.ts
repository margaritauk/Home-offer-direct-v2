import { describe, expect, it } from "vitest";
import {
  AGENCY_RELATIONSHIP_HELP,
  AGENCY_RELATIONSHIP_LABELS,
  FINANCIAL_CONSENT_PRIVACY_NOTE,
  FINANCIAL_CONSENT_PROMPT,
  LEGAL_DRAFT_BANNER,
  LEGAL_REVIEW_APPROVED,
} from "./agency-copy";
import type { AgencyRelationship } from "./types";

describe("legal-gated agency copy", () => {
  it("ships UNAPPROVED until counsel signs off (drives the draft banner)", () => {
    expect(LEGAL_REVIEW_APPROVED).toBe(false);
  });

  it("the draft banner names it as draft / pending legal review", () => {
    expect(LEGAL_DRAFT_BANNER.toLowerCase()).toContain("draft");
    expect(LEGAL_DRAFT_BANNER.toLowerCase()).toContain("legal review");
  });

  it("provides a label + help string for every relationship option", () => {
    const opts: AgencyRelationship[] = [
      "represents_buyer",
      "listing_side",
      "unrepresented",
      "unknown",
    ];
    for (const o of opts) {
      expect(AGENCY_RELATIONSHIP_LABELS[o]).toBeTruthy();
      expect(AGENCY_RELATIONSHIP_HELP[o]).toBeTruthy();
    }
  });

  it("has non-empty consent prompt + privacy note", () => {
    expect(FINANCIAL_CONSENT_PROMPT.length).toBeGreaterThan(0);
    expect(FINANCIAL_CONSENT_PRIVACY_NOTE.length).toBeGreaterThan(0);
  });
});
