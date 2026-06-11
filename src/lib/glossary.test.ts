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

describe("glossary completeness", () => {
  it("has no duplicate slugs", () => {
    const slugs = glossaryTerms.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every term a non-empty term name and definition", () => {
    for (const t of glossaryTerms) {
      expect(t.term.trim().length).toBeGreaterThan(0);
      expect(t.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("only references real slugs in `related`", () => {
    for (const t of glossaryTerms) {
      for (const slug of t.related ?? []) {
        expect(glossaryBySlug[slug], `${t.slug} → related ${slug}`).toBeDefined();
      }
    }
  });
});
