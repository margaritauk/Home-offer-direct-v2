import { describe, expect, it } from "vitest";
import { normalizeCompsState, type Comp } from "./comps";

const legacyComps: Comp[] = [
  { id: "1", label: "A", salePrice: 400_000, sqft: 2_000, adjustment: 0 },
  { id: "2", label: "B", salePrice: 450_000, sqft: 2_000, adjustment: 0 },
];

describe("normalizeCompsState", () => {
  it("returns { homes: [] } for null/undefined", () => {
    expect(normalizeCompsState(null)).toEqual({ homes: [] });
    expect(normalizeCompsState(undefined)).toEqual({ homes: [] });
  });

  it("returns { homes: [] } for garbage", () => {
    expect(normalizeCompsState("nope")).toEqual({ homes: [] });
    expect(normalizeCompsState(42)).toEqual({ homes: [] });
    expect(normalizeCompsState([])).toEqual({ homes: [] });
    expect(normalizeCompsState({ random: true })).toEqual({ homes: [] });
  });

  it("drops a truly empty legacy blob", () => {
    expect(
      normalizeCompsState({ subjectLabel: "", subjectSqft: 0, comps: [] }),
    ).toEqual({ homes: [] });
  });

  it("migrates a legacy single-subject blob into one manual home", () => {
    const result = normalizeCompsState({
      subjectLabel: "123 Maple St",
      subjectSqft: 1_850,
      comps: legacyComps,
    });

    expect(result.homes).toHaveLength(1);
    const home = result.homes[0];
    expect(home.label).toBe("123 Maple St");
    expect(home.sqft).toBe(1_850);
    expect(home.mode).toBe("manual");
    expect(home.comps).toEqual(legacyComps);
    expect(typeof home.id).toBe("string");
    expect(home.id.length).toBeGreaterThan(0);
  });

  it("passes through an already-new shape", () => {
    const input = {
      homes: [
        {
          id: "home-1",
          label: "456 Oak Ave",
          sqft: 2_200,
          mode: "auto" as const,
          comps: legacyComps,
        },
      ],
    };
    const result = normalizeCompsState(input);
    expect(result.homes).toHaveLength(1);
    expect(result.homes[0]).toMatchObject({
      id: "home-1",
      label: "456 Oak Ave",
      sqft: 2_200,
      mode: "auto",
      comps: legacyComps,
    });
  });

  it("returns an empty homes array for an explicit empty new shape", () => {
    expect(normalizeCompsState({ homes: [] })).toEqual({ homes: [] });
  });

  it("validates/coerces invalid fields in the new shape", () => {
    const result = normalizeCompsState({
      homes: [{ label: 5, sqft: "big", mode: "nope", comps: "x" }],
    });
    expect(result.homes).toHaveLength(1);
    expect(result.homes[0]).toMatchObject({
      label: "",
      sqft: 0,
      mode: "manual",
      comps: [],
    });
    expect(typeof result.homes[0].id).toBe("string");
  });
});
