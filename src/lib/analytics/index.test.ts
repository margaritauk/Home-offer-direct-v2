import { afterEach, describe, expect, it, vi } from "vitest";
import {
  noopSink,
  sanitizeProps,
  setAnalyticsSink,
  track,
} from "./index";
import { savingsBucket, type AnalyticsEvent } from "./events";

afterEach(() => {
  setAnalyticsSink(noopSink);
});

describe("sanitizeProps — privacy backstop", () => {
  it("keeps coarse primitive facts", () => {
    expect(sanitizeProps({ band: "seller", hasComps: true, n: 3 })).toEqual({
      band: "seller",
      hasComps: true,
      n: 3,
    });
  });

  it("drops PII-looking keys even when the value is a primitive", () => {
    const out = sanitizeProps({
      email: "a@b.com",
      name: "Jane",
      address: "1 Main St",
      zip: "78701",
      band: "buyer",
    });
    expect(out).toEqual({ band: "buyer" });
  });

  it("drops non-primitive values (objects, arrays, functions)", () => {
    const out = sanitizeProps({
      ok: 1,
      // @ts-expect-error — intentionally wrong types to prove the guard strips them
      obj: { a: 1 },
      // @ts-expect-error
      arr: [1, 2],
    });
    expect(out).toEqual({ ok: 1 });
  });

  it("drops long strings (free-text leak guard)", () => {
    const long = "x".repeat(100);
    expect(sanitizeProps({ note: long, band: "seller" })).toEqual({
      band: "seller",
    });
  });

  it("handles undefined props", () => {
    expect(sanitizeProps(undefined)).toEqual({});
  });
});

describe("track", () => {
  it("default sink is a no-op (no vendor) — never throws", () => {
    expect(() =>
      track("savings_calc_completed", { savingsBucket: "5k-10k" }),
    ).not.toThrow();
  });

  it("routes a known event with sanitized props to the sink", () => {
    const seen: AnalyticsEvent[] = [];
    setAnalyticsSink((e) => seen.push(e));
    track("suggested_range_viewed", {
      hasComps: true,
      hasMarket: false,
      emphasis: "upper",
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].name).toBe("suggested_range_viewed");
    expect(seen[0].props).toEqual({
      hasComps: true,
      hasMarket: false,
      emphasis: "upper",
    });
  });

  it("drops an unknown event name (closed vocabulary)", () => {
    const seen: AnalyticsEvent[] = [];
    setAnalyticsSink((e) => seen.push(e));
    // @ts-expect-error — not a valid event name
    track("totally_made_up", {});
    expect(seen).toHaveLength(0);
  });

  it("swallows a throwing sink (analytics must never break the app)", () => {
    setAnalyticsSink(() => {
      throw new Error("sink boom");
    });
    expect(() =>
      track("offer_builder_completed", { hasConcessionAsk: true }),
    ).not.toThrow();
  });

  it("wires the north-star event with a concession ask + savings bucket", () => {
    const seen: AnalyticsEvent[] = [];
    setAnalyticsSink((e) => seen.push(e));
    track("offer_builder_completed", {
      hasConcessionAsk: true,
      savingsBucket: savingsBucket(9800),
    });
    expect(seen[0].props).toEqual({
      hasConcessionAsk: true,
      savingsBucket: "5k-10k",
    });
  });
});

describe("savingsBucket", () => {
  it("buckets amounts into coarse, non-PII bands", () => {
    expect(savingsBucket(0)).toBe("0");
    expect(savingsBucket(-5)).toBe("0");
    expect(savingsBucket(4999)).toBe("0-5k");
    expect(savingsBucket(5000)).toBe("5k-10k");
    expect(savingsBucket(15000)).toBe("10k-20k");
    expect(savingsBucket(30000)).toBe("20k-40k");
    expect(savingsBucket(99999)).toBe("40k+");
  });

  it("guards NaN / undefined", () => {
    expect(savingsBucket(NaN)).toBe("0");
    expect(savingsBucket(undefined)).toBe("0");
  });
});
