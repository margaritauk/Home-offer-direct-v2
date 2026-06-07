import { describe, expect, it } from "vitest";
import {
  INVITE_TTL_DAYS,
  isInvitableRole,
  isInviteExpired,
  isValidEmail,
  normalizeEmail,
} from "./invite-utils";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Agent@Example.COM ")).toBe("agent@example.com");
  });
  it("leaves an already-normalized email unchanged", () => {
    expect(normalizeEmail("a@b.com")).toBe("a@b.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a normal email (after normalizing)", () => {
    expect(isValidEmail(" Foo@Bar.com ")).toBe(true);
  });
  it.each(["", "no-at", "a@b", "a@@b.com", "a b@c.com", "@b.com", "a@.com"])(
    "rejects %j",
    (bad) => {
      expect(isValidEmail(bad)).toBe(false);
    },
  );
});

describe("isInvitableRole", () => {
  it.each(["co_buyer", "agent", "attorney", "viewer"])("accepts %s", (r) => {
    expect(isInvitableRole(r)).toBe(true);
  });
  it("rejects owner_buyer (owners aren't invited)", () => {
    expect(isInvitableRole("owner_buyer")).toBe(false);
  });
  it("rejects an unknown role", () => {
    expect(isInvitableRole("admin")).toBe(false);
  });
});

describe("isInviteExpired", () => {
  const now = new Date("2026-06-07T00:00:00Z");
  it("is not expired in the future", () => {
    expect(isInviteExpired("2026-06-20T00:00:00Z", now)).toBe(false);
  });
  it("is expired in the past", () => {
    expect(isInviteExpired("2026-06-01T00:00:00Z", now)).toBe(true);
  });
  it("is expired exactly at the boundary (<=)", () => {
    expect(isInviteExpired("2026-06-07T00:00:00Z", now)).toBe(true);
  });
  it("treats an unparseable date as expired (default-deny)", () => {
    expect(isInviteExpired("not-a-date", now)).toBe(true);
  });
});

describe("INVITE_TTL_DAYS", () => {
  it("matches the RPC's 14-day window", () => {
    expect(INVITE_TTL_DAYS).toBe(14);
  });
});
