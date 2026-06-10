import { describe, expect, it } from "vitest";
import {
  REPAIR_ITEM_PREFIX,
  STANDARD_WALKTHROUGH_ITEMS,
  negotiatedRepairItems,
} from "./final-walkthrough";

describe("STANDARD_WALKTHROUGH_ITEMS", () => {
  it("has stable, unique ids and non-empty labels", () => {
    const ids = STANDARD_WALKTHROUGH_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of STANDARD_WALKTHROUGH_ITEMS) {
      expect(item.label.trim()).not.toBe("");
    }
  });
});

describe("negotiatedRepairItems", () => {
  it("returns repair-resolution items with prefixed ids and labels", () => {
    const out = negotiatedRepairItems({
      items: [
        { id: "a1", item: "Roof — missing shingles", resolution: "repair" },
        { id: "a2", item: "Furnace service", resolution: "repair" },
      ],
    });
    expect(out).toEqual([
      { id: `${REPAIR_ITEM_PREFIX}a1`, label: "Roof — missing shingles" },
      { id: `${REPAIR_ITEM_PREFIX}a2`, label: "Furnace service" },
    ]);
  });

  it("excludes credit-resolution items", () => {
    const out = negotiatedRepairItems({
      items: [
        { id: "r", item: "Fix gutter", resolution: "repair" },
        { id: "c", item: "Water heater", resolution: "credit", requestedAmount: 1200 },
      ],
    });
    expect(out).toEqual([{ id: `${REPAIR_ITEM_PREFIX}r`, label: "Fix gutter" }]);
  });

  it("trims labels and skips items with empty text or missing id", () => {
    const out = negotiatedRepairItems({
      items: [
        { id: "ok", item: "  Deck boards  ", resolution: "repair" },
        { id: "noText", item: "   ", resolution: "repair" },
        { item: "No id here", resolution: "repair" },
      ],
    });
    expect(out).toEqual([{ id: `${REPAIR_ITEM_PREFIX}ok`, label: "Deck boards" }]);
  });

  it("returns [] for empty, missing, or garbage shapes", () => {
    expect(negotiatedRepairItems({ items: [] })).toEqual([]);
    expect(negotiatedRepairItems({})).toEqual([]);
    expect(negotiatedRepairItems(null)).toEqual([]);
    expect(negotiatedRepairItems(undefined)).toEqual([]);
    expect(negotiatedRepairItems("nope")).toEqual([]);
    expect(negotiatedRepairItems({ items: "not-an-array" })).toEqual([]);
    expect(negotiatedRepairItems({ items: [null, 42, "x"] })).toEqual([]);
  });
});
