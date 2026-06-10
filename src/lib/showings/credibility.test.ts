import { describe, expect, it } from "vitest";
import { CREDIBILITY_DOCS, DISCLOSURE_TIP } from "./credibility";

describe("credibility prep", () => {
  it("has unique doc ids and covers the core credibility documents", () => {
    const ids = CREDIBILITY_DOCS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("pre-approval");
    expect(ids).toContain("proof-of-funds");
    expect(ids).toContain("photo-id");
  });

  it("every doc has a label and a guidance note", () => {
    for (const doc of CREDIBILITY_DOCS) {
      expect(doc.label.length).toBeGreaterThan(0);
      expect(doc.note.length).toBeGreaterThan(0);
    }
  });

  it("the disclosure tip steers away from sharing the max budget", () => {
    expect(DISCLOSURE_TIP.toLowerCase()).toContain("budget");
    expect(DISCLOSURE_TIP.toLowerCase()).toContain("pre-approved");
  });
});
