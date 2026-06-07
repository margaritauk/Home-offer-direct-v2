import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEAL_LABEL,
  ensureOwnDeal,
  getDealAgency,
  listMembers,
  listMyDeals,
  revokeMember,
  rowToAgency,
  rowToDeal,
  rowToMember,
  saveDealAgency,
  updateMemberRole,
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

describe("rowToAgency", () => {
  it("maps snake_case columns to the DealAgency shape", () => {
    expect(
      rowToAgency({
        deal_id: "d1",
        agency_relationship: "represents_buyer",
        financial_consent: true,
        consent_captured_at: "2026-06-07T00:00:00Z",
        agency_captured_at: "2026-06-07T00:00:00Z",
        updated_at: "2026-06-07T00:00:00Z",
      }),
    ).toEqual({
      dealId: "d1",
      agencyRelationship: "represents_buyer",
      financialConsent: true,
      consentCapturedAt: "2026-06-07T00:00:00Z",
      agencyCapturedAt: "2026-06-07T00:00:00Z",
      updatedAt: "2026-06-07T00:00:00Z",
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
  it("getDealAgency returns null (guest / unconfigured)", async () => {
    expect(await getDealAgency("d1", null)).toBeNull();
  });
  it("updateMemberRole returns a config error", async () => {
    expect(await updateMemberRole("d1", "u1", "viewer", null)).toEqual({
      error: "Cloud sync is not configured.",
    });
  });
  it("revokeMember returns a config error", async () => {
    expect(await revokeMember("d1", "u1", null)).toEqual({
      error: "Cloud sync is not configured.",
    });
  });
  it("saveDealAgency returns a config error", async () => {
    expect(
      await saveDealAgency(
        "d1",
        { agencyRelationship: "unknown", financialConsent: false },
        null,
      ),
    ).toEqual({ error: "Cloud sync is not configured." });
  });
});
