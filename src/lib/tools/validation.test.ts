import { describe, expect, it } from "vitest";
import { validateNumber, type NumberBounds } from "./validation";

describe("validateNumber", () => {
  describe("empty / non-finite handling (documented contract)", () => {
    it("treats null as ok (empty is not an error)", () => {
      expect(validateNumber(null, { min: 0, max: 10 })).toEqual({ state: "ok" });
    });

    it("treats undefined as ok", () => {
      expect(validateNumber(undefined, { min: 0 })).toEqual({ state: "ok" });
    });

    it("flags NaN as an error with 'Enter a number'", () => {
      expect(validateNumber(NaN, {})).toEqual({
        state: "error",
        message: "Enter a number",
      });
    });

    it("flags Infinity / -Infinity as an error", () => {
      expect(validateNumber(Infinity, {}).state).toBe("error");
      expect(validateNumber(-Infinity, {}).state).toBe("error");
    });
  });

  describe("hard bounds → error", () => {
    const bounds: NumberBounds = { min: 0, max: 100 };

    it("ok when in range", () => {
      expect(validateNumber(50, bounds)).toEqual({ state: "ok" });
    });

    it("ok at the inclusive boundaries", () => {
      expect(validateNumber(0, bounds).state).toBe("ok");
      expect(validateNumber(100, bounds).state).toBe("ok");
    });

    it("error below min", () => {
      const r = validateNumber(-1, bounds);
      expect(r.state).toBe("error");
      expect(r.message).toBe("Must be between 0 and 100");
    });

    it("error above max", () => {
      const r = validateNumber(101, bounds);
      expect(r.state).toBe("error");
      expect(r.message).toBe("Must be between 0 and 100");
    });

    it("min-only bounds → 'at least' message", () => {
      const r = validateNumber(-5, { min: 0 });
      expect(r.state).toBe("error");
      expect(r.message).toBe("Must be at least 0");
    });

    it("max-only bounds → 'at most' message", () => {
      const r = validateNumber(20, { max: 12 });
      expect(r.state).toBe("error");
      expect(r.message).toBe("Must be at most 12");
    });
  });

  describe("soft bounds → warn", () => {
    const bounds: NumberBounds = { min: 0, max: 100, softMin: 10, softMax: 90 };

    it("warns below softMin (but within hard range)", () => {
      const r = validateNumber(5, bounds);
      expect(r.state).toBe("warn");
      expect(r.message).toBe("This looks unusually low — double-check.");
    });

    it("warns above softMax (but within hard range)", () => {
      const r = validateNumber(95, bounds);
      expect(r.state).toBe("warn");
      expect(r.message).toBe("This looks unusually high — double-check.");
    });

    it("ok inside the soft range", () => {
      expect(validateNumber(50, bounds).state).toBe("ok");
    });

    it("ok at the soft boundaries (inclusive)", () => {
      expect(validateNumber(10, bounds).state).toBe("ok");
      expect(validateNumber(90, bounds).state).toBe("ok");
    });

    it("hard bound wins over soft bound", () => {
      // Below min is an error even though it's also below softMin.
      expect(validateNumber(-1, bounds).state).toBe("error");
      expect(validateNumber(101, bounds).state).toBe("error");
    });

    it("soft-only bounds (no hard bounds) still warn", () => {
      const r = validateNumber(2, { softMin: 5 });
      expect(r.state).toBe("warn");
      expect(validateNumber(200, { softMax: 100 }).state).toBe("warn");
    });
  });

  describe("unit formatting in messages", () => {
    it("prefixes $ and uses thousands separators", () => {
      const r = validateNumber(2_000_000, { max: 1_000_000 }, { unit: "$" });
      expect(r.message).toBe("Must be at most $1,000,000");
    });

    it("suffixes other units like %", () => {
      const r = validateNumber(150, { max: 100 }, { unit: "%" });
      expect(r.message).toBe("Must be at most 100%");
    });
  });

  describe("empty bounds", () => {
    it("any finite number is ok with no bounds", () => {
      expect(validateNumber(0, {}).state).toBe("ok");
      expect(validateNumber(-9999, {}).state).toBe("ok");
      expect(validateNumber(9999, {}).state).toBe("ok");
    });
  });
});
