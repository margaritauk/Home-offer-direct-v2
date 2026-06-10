import { describe, expect, it } from "vitest";
import {
  DOC_VAULT_ITEMS,
  MOVE_IN_ITEMS,
  groupByCategory,
} from "./move-in";

describe("move-in data", () => {
  it("has unique ids across tasks and doc-vault items", () => {
    const ids = [...MOVE_IN_ITEMS, ...DOC_VAULT_ITEMS].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the core post-purchase tasks", () => {
    const ids = MOVE_IN_ITEMS.map((i) => i.id);
    expect(ids).toContain("utilities-transfer");
    expect(ids).toContain("homestead");
    expect(ids).toContain("mortgage-autopay");
    expect(ids).toContain("change-locks");
  });

  it("includes the key closing documents in the doc vault", () => {
    const ids = DOC_VAULT_ITEMS.map((i) => i.id);
    expect(ids).toContain("doc-deed");
    expect(ids).toContain("doc-cd");
    expect(ids).toContain("doc-title");
    expect(ids).toContain("doc-insurance");
  });
});

describe("groupByCategory", () => {
  it("groups items in category order and drops empty groups", () => {
    const groups = groupByCategory(MOVE_IN_ITEMS);
    expect(groups[0].category).toBe("Utilities & services");
    // every returned group is non-empty
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    // all items are accounted for
    const total = groups.reduce((s, g) => s + g.items.length, 0);
    expect(total).toBe(MOVE_IN_ITEMS.length);
  });

  it("returns no groups for an empty input", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
