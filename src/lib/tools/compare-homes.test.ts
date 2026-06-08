import { describe, expect, it } from "vitest";
import { buildComparison, type ComparableHome } from "./compare-homes";

const homes: ComparableHome[] = [
  {
    id: "1",
    label: "123 Maple",
    price: 400_000,
    sqft: 2_000,
    beds: 3,
    baths: 2,
    daysOnMarket: 14,
    tourScore: 4.2,
  },
  {
    id: "2",
    label: "456 Oak",
    price: 450_000,
    sqft: 2_500,
    beds: 4,
    baths: 3,
    daysOnMarket: 7,
    tourScore: 3.8,
  },
];

function row(rows: ReturnType<typeof buildComparison>["rows"], metric: string) {
  return rows.find((r) => r.metric === metric)!;
}

describe("buildComparison", () => {
  it("derives $/sqft per home", () => {
    const { homes: derived } = buildComparison(homes);
    expect(derived[0].pricePerSqft).toBe(200); // 400k/2000
    expect(derived[1].pricePerSqft).toBe(180); // 450k/2500
  });

  it("flags the lowest price as best", () => {
    const { rows } = buildComparison(homes);
    expect(row(rows, "price").bestIndexes).toEqual([0]);
  });

  it("flags the lowest $/sqft as best", () => {
    const { rows } = buildComparison(homes);
    expect(row(rows, "pricePerSqft").bestIndexes).toEqual([1]);
  });

  it("flags fewest days on market as best", () => {
    const { rows } = buildComparison(homes);
    expect(row(rows, "daysOnMarket").bestIndexes).toEqual([1]);
  });

  it("flags the highest tour score as best", () => {
    const { rows } = buildComparison(homes);
    expect(row(rows, "tourScore").bestIndexes).toEqual([0]);
  });

  it("flags more beds/baths/sqft as best (higher is better)", () => {
    const { rows } = buildComparison(homes);
    expect(row(rows, "beds").bestIndexes).toEqual([1]);
    expect(row(rows, "baths").bestIndexes).toEqual([1]);
    expect(row(rows, "sqft").bestIndexes).toEqual([1]);
  });

  it("does not flag a best when values are all equal", () => {
    const equal: ComparableHome[] = [
      { id: "a", label: "A", price: 400_000, sqft: 2_000 },
      { id: "b", label: "B", price: 400_000, sqft: 2_000 },
    ];
    const { rows } = buildComparison(equal);
    expect(row(rows, "price").bestIndexes).toEqual([]);
  });

  it("does not flag a best when only one home has a value", () => {
    const partial: ComparableHome[] = [
      { id: "a", label: "A", tourScore: 4 },
      { id: "b", label: "B" },
    ];
    const { rows } = buildComparison(partial);
    expect(row(rows, "tourScore").bestIndexes).toEqual([]);
  });

  it("represents missing facts as null in the row values", () => {
    const partial: ComparableHome[] = [
      { id: "a", label: "A", price: 400_000 },
      { id: "b", label: "B" },
    ];
    const { rows } = buildComparison(partial);
    expect(row(rows, "price").values).toEqual([400_000, null]);
    expect(row(rows, "sqft").values).toEqual([null, null]);
  });

  it("leaves $/sqft null when sqft is missing or zero", () => {
    const partial: ComparableHome[] = [
      { id: "a", label: "A", price: 400_000, sqft: 0 },
    ];
    const { homes: derived } = buildComparison(partial);
    expect(derived[0].pricePerSqft).toBeNull();
  });

  it("can flag a tie across multiple homes", () => {
    const three: ComparableHome[] = [
      { id: "a", label: "A", price: 400_000 },
      { id: "b", label: "B", price: 400_000 },
      { id: "c", label: "C", price: 500_000 },
    ];
    const { rows } = buildComparison(three);
    expect(row(rows, "price").bestIndexes).toEqual([0, 1]);
  });
});
