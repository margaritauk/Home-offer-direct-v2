import { describe, expect, it } from "vitest";
import {
  buildRequestSummary,
  repairTotals,
  type RepairItem,
} from "./repair-request";

function item(partial: Partial<RepairItem>): RepairItem {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    item: partial.item ?? "Roof",
    resolution: partial.resolution ?? "repair",
    requestedAmount: partial.requestedAmount ?? 0,
    notes: partial.notes,
  };
}

describe("repairTotals", () => {
  it("returns zeros for an empty list", () => {
    expect(repairTotals([])).toEqual({
      repairCount: 0,
      creditCount: 0,
      totalCredit: 0,
      total: 0,
    });
  });

  it("counts repair vs credit items", () => {
    const t = repairTotals([
      item({ resolution: "repair" }),
      item({ resolution: "credit", requestedAmount: 1_000 }),
      item({ resolution: "credit", requestedAmount: 500 }),
    ]);
    expect(t.repairCount).toBe(1);
    expect(t.creditCount).toBe(2);
    expect(t.total).toBe(3);
  });

  it("totals only credit amounts (repairs contribute zero)", () => {
    const t = repairTotals([
      item({ resolution: "repair", requestedAmount: 9_999 }),
      item({ resolution: "credit", requestedAmount: 1_500 }),
      item({ resolution: "credit", requestedAmount: 2_500 }),
    ]);
    expect(t.totalCredit).toBe(4_000);
  });

  it("ignores invalid requested amounts", () => {
    const t = repairTotals([
      item({ resolution: "credit", requestedAmount: Number.NaN }),
      item({ resolution: "credit", requestedAmount: -50 }),
      item({ resolution: "credit", requestedAmount: 800 }),
    ]);
    expect(t.totalCredit).toBe(800);
  });
});

describe("buildRequestSummary", () => {
  it("returns an empty string with no usable items", () => {
    expect(buildRequestSummary([])).toBe("");
    expect(buildRequestSummary([item({ item: "  " })])).toBe("");
  });

  it("lists repair items as a repair request", () => {
    const out = buildRequestSummary([item({ item: "Roof", resolution: "repair" })]);
    expect(out).toContain("Roof: requesting repair prior to closing.");
  });

  it("lists credit items with the requested amount and totals them", () => {
    const out = buildRequestSummary([
      item({ item: "Water heater", resolution: "credit", requestedAmount: 1_200 }),
      item({ item: "Gutters", resolution: "credit", requestedAmount: 800 }),
    ]);
    expect(out).toContain("Water heater: requesting a closing-cost credit");
    expect(out).toContain("$1,200");
    expect(out).toContain("Total requested credit: $2,000.");
  });

  it("includes screened notes when present", () => {
    const out = buildRequestSummary([
      item({ item: "Furnace", notes: "Inspector flagged the heat exchanger." }),
    ]);
    expect(out).toContain("Note: Inspector flagged the heat exchanger.");
  });

  it("stays neutral — no demands, deadlines, or legal language", () => {
    const out = buildRequestSummary([
      item({ item: "Roof", resolution: "repair" }),
      item({ item: "Deck", resolution: "credit", requestedAmount: 3_000 }),
    ]).toLowerCase();
    expect(out).not.toMatch(/\b(demand|must|require|deadline|or else|terminate|breach|lawsuit|legal action)\b/);
  });
});
