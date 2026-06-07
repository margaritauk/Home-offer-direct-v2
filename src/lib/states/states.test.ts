import { describe, expect, it } from "vitest";
import { stateProfiles } from "./data";
import { getAllStateProfiles, getStateProfile, getStateOptions } from "./index";
import {
  closingPathLabels,
  disclosureRegimeLabels,
  dualAgencyLabels,
  eSignLabels,
} from "./labels";
import type {
  ClosingPath,
  DisclosureRegime,
  DualAgencyStatus,
  ESignStatus,
} from "./types";

const CLOSING_PATHS: ClosingPath[] = ["attorney", "escrow", "either"];
const DISCLOSURE_REGIMES: DisclosureRegime[] = [
  "statutory-form",
  "written-disclosure",
  "limited",
];
const DUAL_AGENCY_STATUSES: DualAgencyStatus[] = [
  "permitted",
  "banned",
  "restricted",
];
const ESIGN_STATUSES: ESignStatus[] = ["valid", "restricted"];

/**
 * Jurisdictions WITHOUT a permanent RON law, per the research brief (issue #46).
 * California is the lone holdout (limited pilot only; permanent RON slated for
 * Jan 1, 2030). All other 49 states + DC have permanent RON laws.
 */
const RON_NOT_ALLOWED = ["CA"];

/** States that ban dual agency, per the research brief (issue #27). */
const DUAL_AGENCY_BANNED = [
  "AK",
  "CO",
  "FL",
  "KS",
  "MD",
  "OK",
  "TX",
  "VT",
  "WY",
];

// The 50 states + DC.
const EXPECTED_COUNT = 51;

describe("state dataset integrity", () => {
  it("covers all 50 states plus DC", () => {
    expect(stateProfiles).toHaveLength(EXPECTED_COUNT);
  });

  it("has unique, uppercase two-letter codes", () => {
    const codes = stateProfiles.map((s) => s.code);
    expect(new Set(codes).size).toBe(EXPECTED_COUNT);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("includes DC", () => {
    expect(stateProfiles.some((s) => s.code === "DC")).toBe(true);
  });

  it("every profile has valid enum values and required prose", () => {
    for (const p of stateProfiles) {
      expect(CLOSING_PATHS).toContain(p.closingPath);
      expect(DISCLOSURE_REGIMES).toContain(p.disclosureRegime);
      expect(p.name.length).toBeGreaterThan(1);
      expect(p.closingNote.length).toBeGreaterThan(0);
      expect(p.disclosureNote.length).toBeGreaterThan(0);
      expect(p.transferTaxNote.length).toBeGreaterThan(0);
      expect(Array.isArray(p.highlights)).toBe(true);
    }
  });

  it("attorney-required states use the attorney or either closing path", () => {
    for (const p of stateProfiles) {
      if (p.attorneyRequiredAtClosing) {
        expect(p.closingPath === "attorney" || p.closingPath === "either").toBe(true);
      }
    }
  });

  it("resource links are absolute https URLs", () => {
    for (const p of stateProfiles) {
      for (const r of p.resources) {
        expect(r.href).toMatch(/^https:\/\//);
        expect(r.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("every enum value has a UI label", () => {
    for (const path of CLOSING_PATHS) expect(closingPathLabels[path]).toBeTruthy();
    for (const r of DISCLOSURE_REGIMES) expect(disclosureRegimeLabels[r]).toBeTruthy();
    for (const d of DUAL_AGENCY_STATUSES) expect(dualAgencyLabels[d]).toBeTruthy();
    for (const e of ESIGN_STATUSES) expect(eSignLabels[e]).toBeTruthy();
  });

  it("every profile has a valid dualAgency value (issue #27)", () => {
    for (const p of stateProfiles) {
      expect(DUAL_AGENCY_STATUSES).toContain(p.dualAgency);
    }
  });

  it("marks the researched dual-agency-banned states as banned", () => {
    for (const code of DUAL_AGENCY_BANNED) {
      const profile = getStateProfile(code);
      expect(profile, `${code} should exist`).toBeTruthy();
      expect(profile!.dualAgency, `${code} should be banned`).toBe("banned");
    }
  });

  it("only the researched set is marked banned", () => {
    const banned = stateProfiles
      .filter((p) => p.dualAgency === "banned")
      .map((p) => p.code)
      .sort();
    expect(banned).toEqual([...DUAL_AGENCY_BANNED].sort());
  });

  it("dual-agency notes are present and concise", () => {
    for (const p of stateProfiles) {
      expect(p.dualAgencyNote, `${p.code} note`).toBeTruthy();
      expect(p.dualAgencyNote!.length).toBeLessThan(220);
    }
  });

  it("every profile has valid e-sign + RON fields (issue #46)", () => {
    for (const p of stateProfiles) {
      expect(ESIGN_STATUSES, `${p.code} eSign`).toContain(p.eSignForRealEstate);
      expect(typeof p.ronAllowed, `${p.code} ron`).toBe("boolean");
    }
  });

  it("marks the researched non-RON states (and only those) correctly", () => {
    for (const code of RON_NOT_ALLOWED) {
      const profile = getStateProfile(code);
      expect(profile, `${code} should exist`).toBeTruthy();
      expect(profile!.ronAllowed, `${code} should lack permanent RON`).toBe(
        false,
      );
    }
    const noRon = stateProfiles
      .filter((p) => !p.ronAllowed)
      .map((p) => p.code)
      .sort();
    expect(noRon).toEqual([...RON_NOT_ALLOWED].sort());
  });

  it("spot-checks e-sign / RON for a couple of states", () => {
    // E-signatures are valid for the purchase contract in every jurisdiction.
    expect(getStateProfile("TX")!.eSignForRealEstate).toBe("valid");
    expect(getStateProfile("NY")!.eSignForRealEstate).toBe("valid");
    // NY uses ESRA — its e-sign note should mention it.
    expect(getStateProfile("NY")!.eSignNote).toMatch(/ESRA/);
    // RON: NY has a permanent law; CA (pilot only) does not.
    expect(getStateProfile("NY")!.ronAllowed).toBe(true);
    expect(getStateProfile("CA")!.ronAllowed).toBe(false);
  });
});

describe("state selectors", () => {
  it("getStateProfile is case-insensitive on code", () => {
    expect(getStateProfile("ca")?.code).toBe("CA");
    expect(getStateProfile("CA")?.code).toBe("CA");
  });

  it("getStateProfile returns undefined for unknown codes", () => {
    expect(getStateProfile("ZZ")).toBeUndefined();
  });

  it("getAllStateProfiles is sorted alphabetically by name", () => {
    const names = getAllStateProfiles().map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("getStateOptions returns a code+name for every state", () => {
    expect(getStateOptions()).toHaveLength(EXPECTED_COUNT);
  });
});
