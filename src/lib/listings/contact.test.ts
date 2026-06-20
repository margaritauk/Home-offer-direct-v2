import { describe, expect, it } from "vitest";
import {
  hasContactData,
  mailtoHref,
  showingRequestPrefill,
  telHref,
} from "./contact";

describe("telHref", () => {
  it("builds a sanitized tel: href, stripping formatting", () => {
    expect(telHref("(512) 555-0142")).toBe("tel:5125550142");
  });

  it("keeps a leading +", () => {
    expect(telHref("+1 512 555 0142")).toBe("tel:+15125550142");
  });

  it("returns undefined for too-few digits or missing input", () => {
    expect(telHref("123")).toBeUndefined();
    expect(telHref(undefined)).toBeUndefined();
  });
});

describe("mailtoHref", () => {
  it("builds a mailto: with an encoded subject", () => {
    expect(mailtoHref("a@b.com", "Showing — 1 Main St")).toBe(
      "mailto:a@b.com?subject=Showing%20%E2%80%94%201%20Main%20St",
    );
  });

  it("returns undefined for an invalid or missing email", () => {
    expect(mailtoHref("not-an-email")).toBeUndefined();
    expect(mailtoHref(undefined)).toBeUndefined();
  });
});

describe("showingRequestPrefill", () => {
  it("fills agentName, address, and MLS# (facts only)", () => {
    expect(
      showingRequestPrefill({
        agent: { name: "Jordan Lee" },
        address: "123 Main St",
        mlsNumber: "1234567",
      }),
    ).toEqual({
      agentName: "Jordan Lee",
      address: "123 Main St",
      mlsNumber: "1234567",
    });
  });

  it("omits agentName / MLS# when absent", () => {
    expect(showingRequestPrefill({ address: "1 Main St" })).toEqual({
      address: "1 Main St",
    });
  });
});

describe("hasContactData", () => {
  it("is true when either agent or office has a usable field", () => {
    expect(hasContactData({ name: "X" }, undefined)).toBe(true);
    expect(hasContactData(undefined, { phone: "5125550142" })).toBe(true);
  });

  it("is false when both are empty/undefined", () => {
    expect(hasContactData(undefined, undefined)).toBe(false);
    expect(hasContactData({}, {})).toBe(false);
  });
});
