import { describe, expect, it } from "vitest";
import { glossaryTerms, glossaryBySlug } from "./glossary";

describe("glossaryBySlug", () => {
  it("has an entry for every term in glossaryTerms", () => {
    expect(Object.keys(glossaryBySlug)).toHaveLength(glossaryTerms.length);
    for (const term of glossaryTerms) {
      expect(glossaryBySlug[term.slug]).toBe(term);
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(glossaryBySlug["not-a-real-term"]).toBeUndefined();
  });
});
