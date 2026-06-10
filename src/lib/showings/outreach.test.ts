import { describe, expect, it } from "vitest";
import type { OutreachEntry } from "./types";
import {
  addOutreach,
  mailtoUrl,
  outreachChannelLabels,
  telUrl,
} from "./outreach";

const entry = (id: string): OutreachEntry => ({
  id,
  date: `2026-06-${id.padStart(2, "0")}T10:00:00.000Z`,
  channel: "email",
  outcome: "left voicemail",
});

describe("addOutreach", () => {
  it("appends to an existing list, newest first, without mutating", () => {
    const list = [entry("1")];
    const next = addOutreach(list, entry("2"));
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("2");
    expect(next[1].id).toBe("1");
    // original untouched
    expect(list).toHaveLength(1);
  });

  it("tolerates an undefined list", () => {
    const next = addOutreach(undefined, entry("1"));
    expect(next).toEqual([entry("1")]);
  });
});

describe("mailtoUrl", () => {
  it("encodes subject and body", () => {
    const url = mailtoUrl({
      email: "agent@example.com",
      subject: "Showing for 123 Maple St",
      body: "Hi Jordan,\n\nCan we tour?",
    });
    expect(url).toBe(
      "mailto:agent%40example.com?subject=Showing%20for%20123%20Maple%20St&body=Hi%20Jordan%2C%0A%0ACan%20we%20tour%3F",
    );
  });

  it("omits empty subject/body params", () => {
    expect(mailtoUrl({ email: "a@b.com" })).toBe("mailto:a%40b.com");
    expect(mailtoUrl({ email: "a@b.com", subject: "  ", body: "" })).toBe(
      "mailto:a%40b.com",
    );
  });

  it("tolerates a missing email", () => {
    expect(mailtoUrl({ subject: "Hi" })).toBe("mailto:?subject=Hi");
    expect(mailtoUrl({})).toBe("mailto:");
  });
});

describe("telUrl", () => {
  it("strips formatting to a dialable number", () => {
    expect(telUrl("(555) 123-4567")).toBe("tel:5551234567");
  });

  it("preserves a leading + for international numbers", () => {
    expect(telUrl("+1 (555) 123-4567")).toBe("tel:+15551234567");
  });

  it("tolerates missing/empty input", () => {
    expect(telUrl()).toBe("tel:");
    expect(telUrl("")).toBe("tel:");
  });
});

describe("outreachChannelLabels", () => {
  it("labels every channel", () => {
    expect(outreachChannelLabels.email).toBe("Email");
    expect(outreachChannelLabels.phone).toBe("Phone");
    expect(outreachChannelLabels["in-person"]).toBe("In person");
    expect(outreachChannelLabels.other).toBe("Other");
  });
});
