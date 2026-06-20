import { describe, expect, it } from "vitest";
import {
  STATE_TOOL_PAGE_ALLOWLIST,
  STATE_TOOL_SLUGS,
  buildStateToolPageData,
  buildStateToolPageDefaultMetadata,
  buildStateToolPageJsonLd,
  buildStateToolPageMetadata,
  isStateToolSlug,
  resolveStateParam,
  stateToolParams,
} from "./tool-pages";
import { getStateProfile } from "./data";

const CA = getStateProfile("CA")!;

describe("resolveStateParam (state resolution + invalid-slug guard)", () => {
  it("resolves a valid lowercase code to its profile", () => {
    const r = resolveStateParam("ca");
    expect(r).not.toBe("invalid");
    expect(r).not.toBeNull();
    expect((r as typeof CA).code).toBe("CA");
  });

  it("resolves a valid uppercase / mixed-case code", () => {
    expect((resolveStateParam("Tx") as typeof CA).code).toBe("TX");
  });

  it("returns null for an empty / whitespace param (default page, not 404)", () => {
    expect(resolveStateParam("")).toBeNull();
    expect(resolveStateParam("   ")).toBeNull();
    expect(resolveStateParam(undefined)).toBeNull();
  });

  it("returns 'invalid' for a non-empty UNKNOWN slug (→ 404)", () => {
    expect(resolveStateParam("zz")).toBe("invalid");
    expect(resolveStateParam("california")).toBe("invalid");
    expect(resolveStateParam("123")).toBe("invalid");
  });
});

describe("stateToolParams (generateStaticParams)", () => {
  it("emits one lowercase param per state (50 states + DC = 51)", () => {
    const params = stateToolParams();
    expect(params).toHaveLength(51);
    expect(params.every((p) => p.state === p.state.toLowerCase())).toBe(true);
    // No duplicates.
    expect(new Set(params.map((p) => p.state)).size).toBe(51);
    // Every emitted param round-trips to a real profile.
    expect(params.every((p) => resolveStateParam(p.state) !== "invalid")).toBe(
      true,
    );
  });
});

describe("buildStateToolPageMetadata", () => {
  it("builds per-state title + description naming the state", () => {
    const meta = buildStateToolPageMetadata("savings-calculator", CA);
    expect(String(meta.title)).toContain("California");
    expect(String(meta.description)).toContain("California");
    expect(meta.alternates?.canonical).toBe("/tools/savings-calculator/ca");
  });

  it("closing-path metadata is distinct from savings", () => {
    const a = buildStateToolPageMetadata("savings-calculator", CA);
    const b = buildStateToolPageMetadata("closing-path", CA);
    expect(a.title).not.toBe(b.title);
  });

  it("default metadata (empty param) names 'your state'", () => {
    const meta = buildStateToolPageDefaultMetadata("savings-calculator");
    expect(String(meta.title)).toContain("your state");
  });
});

describe("buildStateToolPageData (page projection)", () => {
  it("savings-calculator carries the state name + journey CTA, no extra facts", () => {
    const d = buildStateToolPageData("savings-calculator", CA);
    expect(d.stateName).toBe("California");
    expect(d.heading).toContain("California");
    expect(d.cta.label).toBe("Start your California journey");
    expect(d.cta.href).toBe("/journey");
    expect(d.facts).toHaveLength(0);
  });

  it("closing-path surfaces objective closing/disclosure/transfer-tax facts", () => {
    const d = buildStateToolPageData("closing-path", CA);
    const labels = d.facts.map((f) => f.label);
    expect(labels).toContain("Closing path");
    expect(labels).toContain("Seller-disclosure regime");
    expect(labels).toContain("Transfer tax");
    expect(d.facts.length).toBeGreaterThan(0);
  });

  it("isStateToolSlug guards the slug union", () => {
    expect(isStateToolSlug("savings-calculator")).toBe(true);
    expect(isStateToolSlug("closing-path")).toBe(true);
    expect(isStateToolSlug("nope")).toBe(false);
    // The exported list is exactly the two tools.
    expect([...STATE_TOOL_SLUGS]).toEqual([
      "savings-calculator",
      "closing-path",
    ]);
  });
});

describe("buildStateToolPageJsonLd (AI-Overview structured data)", () => {
  it("declares a free WebApplication tool (interactive, not prose)", () => {
    const d = buildStateToolPageData("savings-calculator", CA);
    const ld = buildStateToolPageJsonLd(d) as {
      "@graph": Record<string, unknown>[];
    };
    const app = ld["@graph"].find((n) => n["@type"] === "WebApplication");
    expect(app).toBeDefined();
    expect((app as { offers: { price: string } }).offers.price).toBe("0");
  });

  it("emits an FAQ block from objective facts for closing-path", () => {
    const d = buildStateToolPageData("closing-path", CA);
    const ld = buildStateToolPageJsonLd(d) as {
      "@graph": Record<string, unknown>[];
    };
    const faq = ld["@graph"].find((n) => n["@type"] === "FAQPage");
    expect(faq).toBeDefined();
  });
});

describe("FHA — page-data allowlist excludes demographic / desirability proxies", () => {
  it("the allowlist contains only objective transaction/legal attributes", () => {
    const allowed = new Set<string>(STATE_TOOL_PAGE_ALLOWLIST);
    // Objective attributes ARE present.
    for (const key of [
      "closingPath",
      "disclosureRegime",
      "transferTaxNote",
      "eSignForRealEstate",
    ]) {
      expect(allowed.has(key)).toBe(true);
    }
    // Demographic / "good schools as value" / desirability proxies are NOT —
    // and must never be added without re-confirming neutrality.
    for (const proxy of [
      "schools",
      "schoolRating",
      "goodSchools",
      "demographics",
      "race",
      "ethnicity",
      "religion",
      "familyFriendly",
      "desirability",
      "neighborhoodQuality",
      "crimeRate",
      "incomeLevel",
    ]) {
      expect(allowed.has(proxy)).toBe(false);
    }
  });

  it("no generated page fact for any state surfaces a desirability/demographic proxy", () => {
    const PROXY = /school|demographic|race|ethnic|religio|famil(y|ies)[- ]?friendly|desirab|crime|income level|neighborhood quality|good area|prestige/i;
    for (const { state } of stateToolParams()) {
      const profile = getStateProfile(state)!;
      for (const slug of STATE_TOOL_SLUGS) {
        const d = buildStateToolPageData(slug, profile);
        for (const f of d.facts) {
          expect(`${f.label} ${f.value}`).not.toMatch(PROXY);
        }
        expect(`${d.heading} ${d.intro}`).not.toMatch(PROXY);
      }
    }
  });
});
