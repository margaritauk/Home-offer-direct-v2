import { describe, expect, it } from "vitest";
import { STATE_FORM_LINKS, stateFormLink } from "./state-forms";

describe("stateFormLink", () => {
  it("resolves a state with a public form to a { label, url }", () => {
    const result = stateFormLink("OK");
    expect(result).not.toBeNull();
    expect(result?.label).toMatch(/\S/);
    expect(result?.url).toMatch(/^https:\/\//);
  });

  it("is case-insensitive and whitespace-tolerant", () => {
    const upper = stateFormLink("OK");
    expect(stateFormLink("ok")).toEqual(upper);
    expect(stateFormLink("  Ok  ")).toEqual(upper);
  });

  it("returns null for an unknown state", () => {
    expect(stateFormLink("ZZ")).toBeNull();
  });

  it("returns null for blank input (fallback path)", () => {
    expect(stateFormLink("")).toBeNull();
    expect(stateFormLink("   ")).toBeNull();
  });

  it("only contains absolute https URLs", () => {
    for (const entry of STATE_FORM_LINKS) {
      expect(entry.url).toMatch(/^https:\/\/\S+$/);
      expect(entry.code).toBe(entry.code.toUpperCase());
    }
  });
});
