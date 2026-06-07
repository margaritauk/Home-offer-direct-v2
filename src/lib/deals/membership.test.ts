import { describe, expect, it } from "vitest";
import { canChangeRole, canRevoke, isLastActiveOwner } from "./membership";
import type { DealMember, DealRole } from "./types";

function member(
  userId: string,
  role: DealRole,
  status: DealMember["status"] = "active",
): DealMember {
  return {
    dealId: "d1",
    userId,
    role,
    status,
    invitedEmail: null,
    createdAt: "2026-06-01T00:00:00Z",
  };
}

const owner = member("u-owner", "owner_buyer");
const agent = member("u-agent", "agent");
const secondOwner = member("u-owner2", "owner_buyer");
const revokedOwner = member("u-owner3", "owner_buyer", "revoked");

describe("isLastActiveOwner", () => {
  it("is true for the only active owner", () => {
    expect(isLastActiveOwner([owner, agent], owner)).toBe(true);
  });
  it("is false when a second active owner exists", () => {
    expect(isLastActiveOwner([owner, secondOwner], owner)).toBe(false);
  });
  it("ignores revoked owners when counting", () => {
    expect(isLastActiveOwner([owner, revokedOwner], owner)).toBe(true);
  });
  it("is false for a non-owner", () => {
    expect(isLastActiveOwner([owner, agent], agent)).toBe(false);
  });
});

describe("canRevoke", () => {
  it("forbids revoking the only active owner", () => {
    expect(canRevoke([owner, agent], owner)).toBe(false);
  });
  it("allows revoking an owner when another active owner exists", () => {
    expect(canRevoke([owner, secondOwner], owner)).toBe(true);
  });
  it("allows revoking a non-owner", () => {
    expect(canRevoke([owner, agent], agent)).toBe(true);
  });
  it("allows revoking an already-revoked member (no-op)", () => {
    expect(canRevoke([owner, revokedOwner], revokedOwner)).toBe(true);
  });
});

describe("canChangeRole", () => {
  it("forbids downgrading the only active owner", () => {
    expect(canChangeRole([owner, agent], owner, "viewer")).toBe(false);
  });
  it("allows downgrading an owner when another active owner exists", () => {
    expect(canChangeRole([owner, secondOwner], owner, "viewer")).toBe(true);
  });
  it("allows keeping the same role (no-op) even for the last owner", () => {
    expect(canChangeRole([owner, agent], owner, "owner_buyer")).toBe(true);
  });
  it("always allows promoting a member to owner", () => {
    expect(canChangeRole([owner, agent], agent, "owner_buyer")).toBe(true);
  });
  it("allows changing a non-owner's role freely", () => {
    expect(canChangeRole([owner, agent], agent, "viewer")).toBe(true);
  });
});
