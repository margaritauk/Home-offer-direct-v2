import { describe, expect, it } from "vitest";
import { screenOutput } from "@/lib/ai/screening";
import type { StateProfile } from "@/lib/states/types";
import {
  SHOWING_SCRIPTS,
  TOUR_CHECKLIST_CRITERIA,
  dualAgencyCaution,
  getShowingScript,
  toScorecardSeed,
} from "./showing-scripts";

function profile(over: Partial<StateProfile> = {}): StateProfile {
  return {
    code: "XX",
    name: "Example State",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote: "",
    disclosureRegime: "written-disclosure",
    disclosureNote: "",
    transferTaxNote: "",
    dualAgency: "permitted",
    eSignForRealEstate: "valid",
    ronAllowed: true,
    highlights: [],
    resources: [],
    ...over,
  };
}

describe("SHOWING_SCRIPTS", () => {
  it("has unique ids and non-empty label/description/body", () => {
    const ids = SHOWING_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SHOWING_SCRIPTS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    }
  });

  it("keeps the buyer's unrepresented status explicit (procuring-cause guard)", () => {
    for (const s of SHOWING_SCRIPTS) {
      expect(s.body.toLowerCase()).toMatch(/unrepresented|representing myself|not seeking representation/);
    }
  });

  it("includes a video/virtual-showing fallback for remote buyers", () => {
    expect(getShowingScript("virtual-tour")).toBeDefined();
  });

  it("every script passes the FHA output gate (no protected-class / love-letter)", () => {
    for (const s of SHOWING_SCRIPTS) {
      expect(screenOutput(s.body).safe).toBe(true);
    }
  });
});

describe("dualAgencyCaution", () => {
  it("explains a ban and names the state when dual agency is banned", () => {
    const c = dualAgencyCaution(profile({ name: "Florida", dualAgency: "banned" }));
    expect(c.status).toBe("banned");
    expect(c.label).toMatch(/banned/i);
    expect(c.explanation).toContain("Florida");
    expect(c.explanation).toMatch(/cannot represent both/i);
  });

  it("explains permitted-with-consent as a conflict of interest", () => {
    const c = dualAgencyCaution(profile({ name: "Arizona", dualAgency: "permitted" }));
    expect(c.status).toBe("permitted");
    expect(c.explanation).toMatch(/conflict of interest|written consent/i);
  });

  it("explains the restricted/designated form", () => {
    const c = dualAgencyCaution(profile({ dualAgency: "restricted" }));
    expect(c.status).toBe("restricted");
    expect(c.explanation).toMatch(/designated|transaction brokerage|limited/i);
  });

  it("passes through the state-engine note and never advises whether to sign (UPL)", () => {
    const c = dualAgencyCaution(
      profile({ dualAgency: "banned", dualAgencyNote: "State X prohibits dual agency." }),
    );
    expect(c.stateNote).toBe("State X prohibits dual agency.");
    expect(c.conflictNote).toMatch(/your call|your attorney/i);
    expect(c.conflictNote).not.toMatch(/you should (not )?sign|don't sign|do sign/i);
  });
});

describe("tour checklist", () => {
  it("seeds the Tour Scorecard with property-condition criteria (building only, FHA)", () => {
    const seed = toScorecardSeed();
    const ids = seed.map((c) => c.id);
    expect(ids).toContain("water-signs");
    expect(ids).toContain("foundation-signs");
    // Every criterion is about the building, never about people/neighbors.
    for (const c of seed) {
      expect(`${c.label} ${c.hint ?? ""}`).not.toMatch(
        /neighbor|who lives|family|schools|safe|demographic/i,
      );
      expect(c.weight).toBeGreaterThan(0);
    }
  });

  it("returns a copy (callers can mutate without affecting the source)", () => {
    const seed = toScorecardSeed();
    seed[0].label = "changed";
    expect(TOUR_CHECKLIST_CRITERIA[0].label).not.toBe("changed");
  });
});
