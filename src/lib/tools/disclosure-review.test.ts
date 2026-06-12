import { describe, expect, it } from "vitest";
import type { StateProfile } from "@/lib/states/types";
import {
  buildDisclosureChecklist,
  categoriesForState,
} from "./disclosure-review";

function profile(over: Partial<StateProfile> = {}): StateProfile {
  return {
    code: "XX",
    name: "Example State",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote: "",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Transfer Disclosure Statement",
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

describe("buildDisclosureChecklist", () => {
  it("includes the universal property-condition categories for any regime", () => {
    const c = categoriesForState(profile()).map((x) => x.id);
    for (const id of [
      "water",
      "roof",
      "foundation",
      "systems",
      "prior-repairs",
      "environmental",
      "pests",
      "boundary",
      "hoa",
    ]) {
      expect(c).toContain(id);
    }
  });

  it("sets a statutory-form intro that names the mandated form", () => {
    const list = buildDisclosureChecklist(
      profile({ disclosureRegime: "statutory-form", disclosureFormName: "TDS" }),
    );
    expect(list.formName).toBe("TDS");
    expect(list.intro).toMatch(/mandated seller-disclosure form/i);
    expect(list.intro).toContain("TDS");
    expect(list.caveatEmptorWarning).toBe(false);
  });

  it("flags caveat-emptor warning for a limited/minimal-disclosure regime", () => {
    const list = buildDisclosureChecklist(profile({ disclosureRegime: "limited" }));
    expect(list.caveatEmptorWarning).toBe(true);
    expect(list.intro).toMatch(/inspect harder/i);
  });

  it("never crashes and still returns categories for a limited-regime (empty-but-explained) state", () => {
    const list = buildDisclosureChecklist(profile({ disclosureRegime: "limited" }));
    // It is NOT an empty list — universal condition categories still apply; the
    // difference is the warning + no deaths/stigma category.
    expect(list.categories.length).toBeGreaterThan(0);
  });

  it("gates the deaths/stigma category by regime (present for statutory/written, absent for limited)", () => {
    const statutory = categoriesForState(
      profile({ disclosureRegime: "statutory-form" }),
    ).map((c) => c.id);
    expect(statutory).toContain("deaths-stigma");

    const written = categoriesForState(
      profile({ disclosureRegime: "written-disclosure" }),
    ).map((c) => c.id);
    expect(written).toContain("deaths-stigma");

    const limited = categoriesForState(
      profile({ disclosureRegime: "limited" }),
    ).map((c) => c.id);
    expect(limited).not.toContain("deaths-stigma");
  });

  it("always adds the federal pre-1978 lead-paint overlay by default, in every regime", () => {
    for (const regime of ["statutory-form", "written-disclosure", "limited"] as const) {
      const c = categoriesForState(profile({ disclosureRegime: regime })).map((x) => x.id);
      expect(c).toContain("lead-paint");
    }
  });

  it("omits the lead-paint overlay when the home is not pre-1978", () => {
    const c = categoriesForState(profile(), { builtPre1978: false }).map((x) => x.id);
    expect(c).not.toContain("lead-paint");
  });

  it("ends every category with a non-empty 'have your pro confirm' handoff (UPL boundary)", () => {
    for (const cat of categoriesForState(profile())) {
      expect(cat.whatToLookFor.length).toBeGreaterThan(0);
      expect(cat.askYourPro.length).toBeGreaterThan(0);
      // Never an interpretive directive.
      expect(cat.whatToLookFor).not.toMatch(/\b(rescind|you must|terminate the contract)\b/i);
    }
  });

  it("frames deaths/stigma as a neutral state-law fact, not stigmatizing language", () => {
    const deaths = categoriesForState(profile()).find((c) => c.id === "deaths-stigma");
    expect(deaths).toBeDefined();
    expect(deaths!.whatToLookFor).toMatch(/neutral state-law/i);
  });
});
