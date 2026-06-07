import { describe, expect, it } from "vitest";
import { canSeeFinancials } from "./financials";
import type { DealRole } from "./types";

describe("canSeeFinancials", () => {
  it("owner always sees their own financials, even without consent", () => {
    expect(canSeeFinancials("owner_buyer", false, true)).toBe(true);
  });

  it("default-deny: no consent → no one but the owner sees", () => {
    for (const role of ["co_buyer", "agent", "attorney", "viewer"] as DealRole[]) {
      expect(canSeeFinancials(role, false, false)).toBe(false);
    }
  });

  it("with consent, editor-ish roles see financials", () => {
    for (const role of ["co_buyer", "agent", "attorney"] as DealRole[]) {
      expect(canSeeFinancials(role, true, false)).toBe(true);
    }
  });

  it("viewer NEVER sees financials, even with consent", () => {
    expect(canSeeFinancials("viewer", true, false)).toBe(false);
  });

  it("a non-owner owner_buyer-role member still needs consent", () => {
    // Edge: someone holds owner_buyer role but isOwner flag is false (shouldn't
    // happen in practice). Falls through to the consent path; not editor-ish so
    // denied without consent, allowed only if it were eligible — it isn't.
    expect(canSeeFinancials("owner_buyer", false, false)).toBe(false);
    expect(canSeeFinancials("owner_buyer", true, false)).toBe(false);
  });
});
