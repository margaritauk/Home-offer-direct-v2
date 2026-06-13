import { describe, expect, it } from "vitest";
import {
  buildHoaChecklist,
  categoriesForHoa,
  OWNERSHIP_NOTES,
} from "./hoa-review";

describe("buildHoaChecklist", () => {
  it("returns the full resale-packet red-flag categories for a condo/HOA home", () => {
    const ids = categoriesForHoa({ isHoa: true }).map((c) => c.id);
    for (const id of [
      "budget-reserves",
      "special-assessments",
      "ccrs-rules",
      "litigation",
      "rental-caps",
      "insurance",
      "dues-history",
      "warrantability",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("is empty-but-explained for a non-HOA home (boundary on the is-condo/HOA flag)", () => {
    const list = buildHoaChecklist({ isHoa: false });
    expect(list.applies).toBe(false);
    expect(list.categories).toHaveLength(0);
    // The ownership explainer + review-window note still ride along so the buyer
    // understands WHY there's no checklist — not a crash, not a blank panel.
    expect(list.ownershipNotes.length).toBeGreaterThan(0);
    expect(list.reviewWindowNote.length).toBeGreaterThan(0);
  });

  it("defaults to non-HOA (empty) when no flag is supplied", () => {
    expect(buildHoaChecklist().categories).toHaveLength(0);
  });

  it("always surfaces the statutory review/cancellation-window reminder", () => {
    const list = buildHoaChecklist({ isHoa: true });
    expect(list.reviewWindowNote).toMatch(/cancel/i);
    expect(list.reviewWindowNote).toMatch(/varies? by state|your state/i);
  });

  it("flags condo vs HOA vs co-op as distinct ownership structures", () => {
    const ids = OWNERSHIP_NOTES.map((n) => n.id);
    expect(ids).toEqual(["hoa", "condo", "co-op"]);
    const coop = OWNERSHIP_NOTES.find((n) => n.id === "co-op")!;
    // Co-op is shares + board approval, NOT fee-simple — the key distinction.
    expect(coop.detail).toMatch(/shares|not fee-simple|proprietary lease/i);
  });

  it("phrases rental-cap / occupancy notes neutrally — not as investment advice (FHA)", () => {
    const rental = categoriesForHoa({ isHoa: true }).find(
      (c) => c.id === "rental-caps",
    )!;
    expect(rental.whyItMatters).toMatch(/not investment advice/i);
    expect(rental.whatToLookFor).not.toMatch(
      /\b(good investment|you should rent|buy to rent)\b/i,
    );
  });

  it("ends every category with a non-empty pro handoff and no interpretive directive (UPL)", () => {
    for (const cat of categoriesForHoa({ isHoa: true })) {
      expect(cat.whatToLookFor.length).toBeGreaterThan(0);
      expect(cat.whyItMatters.length).toBeGreaterThan(0);
      expect(cat.askYourPro.length).toBeGreaterThan(0);
      // Facts/questions only — never "rescind / you must / walk away".
      expect(cat.whatToLookFor).not.toMatch(
        /\b(rescind|you must|walk away|terminate the contract)\b/i,
      );
    }
  });

  it("frames warrantability as a lender question, not a directive", () => {
    const warrant = categoriesForHoa({ isHoa: true }).find(
      (c) => c.id === "warrantability",
    )!;
    expect(warrant.askYourPro).toMatch(/lender/i);
    expect(warrant.whatToLookFor).toMatch(/warrantab/i);
  });
});
