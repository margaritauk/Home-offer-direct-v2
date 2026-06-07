import { describe, expect, it } from "vitest";
import {
  TEMPLATE_PLACEHOLDERS,
  getTemplate,
  interpolate,
  messageTemplates,
  renderTemplate,
} from "./templates";

/**
 * Words that would indicate a protected-class or "love letter" field. None of
 * these may appear in any placeholder name (FHA guardrail #22).
 */
const FORBIDDEN_PLACEHOLDER_WORDS = [
  "race",
  "ethnic",
  "religion",
  "faith",
  "church",
  "family",
  "children",
  "kids",
  "baby",
  "pregnan",
  "marital",
  "married",
  "spouse",
  "national",
  "origin",
  "disab",
  "age",
  "gender",
  "sex",
  "orientation",
  "school",
  "love",
  "story",
  "dream",
  "personal",
];

describe("message templates (FHA guardrail #22)", () => {
  it("ships the four expected templates", () => {
    const ids = messageTemplates.map((t) => t.id).sort();
    expect(ids).toEqual(
      ["ask-about-property", "follow-up", "open-house-intro", "request-showing"].sort(),
    );
  });

  it("has no protected-class / love-letter placeholders", () => {
    for (const placeholder of TEMPLATE_PLACEHOLDERS) {
      // Split camelCase into discrete words so "agentName" -> ["agent","name"]
      // and we match concepts, not incidental substrings (e.g. "age" in "agent").
      const words = placeholder
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .split(/\s+/);
      for (const word of words) {
        for (const forbidden of FORBIDDEN_PLACEHOLDER_WORDS) {
          // Exact concept match, or a clear prefix (e.g. "disab" -> "disability").
          const hit =
            word === forbidden ||
            (forbidden.length >= 5 && word.startsWith(forbidden));
          expect(hit, `${placeholder} contains "${forbidden}"`).toBe(false);
        }
      }
    }
  });

  it("every token used in a template body is an allowed placeholder", () => {
    const allowed = new Set<string>(TEMPLATE_PLACEHOLDERS);
    for (const t of messageTemplates) {
      const tokens = [...t.body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const token of tokens) {
        expect(allowed.has(token)).toBe(true);
      }
    }
  });

  it("has no buyer 'love letter' template", () => {
    const blob = JSON.stringify(messageTemplates).toLowerCase();
    expect(blob).not.toContain("love letter");
    expect(blob).not.toContain("dream home for our family");
  });

  it("nudges toward pre-approval / proof of funds", () => {
    const requestShowing = getTemplate("request-showing")!;
    expect(requestShowing.body.toLowerCase()).toMatch(
      /pre-approved|proof of funds/,
    );
  });
});

describe("interpolate", () => {
  it("replaces known placeholders with provided values", () => {
    const out = interpolate("Hi {agentName}, re {address}.", {
      agentName: "Jordan",
      address: "123 Maple St",
    });
    expect(out).toBe("Hi Jordan, re 123 Maple St.");
  });

  it("falls back to a bracketed prompt for missing/empty values", () => {
    expect(interpolate("Hi {agentName}.", {})).toBe("Hi [agentName].");
    expect(interpolate("Hi {agentName}.", { agentName: "  " })).toBe(
      "Hi [agentName].",
    );
  });

  it("leaves unknown tokens untouched", () => {
    expect(interpolate("Keep {notAToken} as-is.", {})).toBe(
      "Keep {notAToken} as-is.",
    );
  });

  it("renderTemplate fills the whole body", () => {
    const t = getTemplate("open-house-intro")!;
    const out = renderTemplate(t, { agentName: "Lee", buyerName: "Alex", address: "9 Oak Ave" });
    expect(out).toContain("Lee");
    expect(out).toContain("Alex");
    expect(out).toContain("9 Oak Ave");
    expect(out).not.toContain("{");
  });
});
