import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEAL_LABEL,
  ensureOwnDeal,
  listMembers,
  listMyDeals,
  rowToDeal,
  rowToMember,
} from "./queries";

describe("rowToDeal", () => {
  it("maps snake_case columns to the Deal shape", () => {
    expect(
      rowToDeal({
        id: "d1",
        created_by: "u1",
        label: "Maple St",
        created_at: "2026-06-01T00:00:00Z",
      }),
    ).toEqual({
      id: "d1",
      createdBy: "u1",
      label: "Maple St",
      createdAt: "2026-06-01T00:00:00Z",
    });
  });

  it("falls back to the default label when null", () => {
    expect(
      rowToDeal({ id: "d1", created_by: "u1", label: null, created_at: "t" }).label,
    ).toBe(DEFAULT_DEAL_LABEL);
  });
});

describe("rowToMember", () => {
  it("maps snake_case columns to the DealMember shape", () => {
    expect(
      rowToMember({
        deal_id: "d1",
        user_id: "u1",
        role: "owner_buyer",
        status: "active",
        invited_email: null,
        created_at: "2026-06-01T00:00:00Z",
      }),
    ).toEqual({
      dealId: "d1",
      userId: "u1",
      role: "owner_buyer",
      status: "active",
      invitedEmail: null,
      createdAt: "2026-06-01T00:00:00Z",
    });
  });
});

describe("client queries with no Supabase client", () => {
  it("listMyDeals returns [] (guest / unconfigured)", async () => {
    expect(await listMyDeals(null)).toEqual([]);
  });
  it("listMembers returns [] (guest / unconfigured)", async () => {
    expect(await listMembers("d1", null)).toEqual([]);
  });
  it("ensureOwnDeal returns null (guest / unconfigured)", async () => {
    expect(await ensureOwnDeal(null)).toBeNull();
  });
});
