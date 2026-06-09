import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  claimInvites,
  inviteToDeal,
  listDealInvites,
  listMyPendingInvites,
  rowToInvite,
} from "./invites";

describe("rowToInvite", () => {
  it("maps snake_case columns to the DealInvite shape", () => {
    expect(
      rowToInvite({
        id: "i1",
        deal_id: "d1",
        email: "a@b.com",
        role: "agent",
        status: "pending",
        expires_at: "2026-06-20T00:00:00Z",
        created_by: "u1",
        created_at: "2026-06-07T00:00:00Z",
      }),
    ).toEqual({
      id: "i1",
      dealId: "d1",
      email: "a@b.com",
      role: "agent",
      status: "pending",
      expiresAt: "2026-06-20T00:00:00Z",
      createdBy: "u1",
      createdAt: "2026-06-07T00:00:00Z",
    });
  });
});

describe("invite/claim with no Supabase client (guest / unconfigured)", () => {
  it("inviteToDeal returns a config error", async () => {
    expect(await inviteToDeal("d1", "a@b.com", "agent", null)).toEqual({
      error: "Cloud sync is not configured.",
    });
  });
  it("listDealInvites returns []", async () => {
    expect(await listDealInvites("d1", null)).toEqual([]);
  });
  it("listMyPendingInvites returns []", async () => {
    expect(await listMyPendingInvites(null)).toEqual([]);
  });
  it("claimInvites returns 0", async () => {
    expect(await claimInvites(null)).toBe(0);
  });
});

describe("inviteToDeal client-side validation (with a client present)", () => {
  const fakeClient = { rpc: vi.fn() } as unknown as SupabaseClient;

  it("rejects an invalid email before calling the RPC", async () => {
    const res = await inviteToDeal("d1", "not-an-email", "agent", fakeClient);
    expect(res.error).toMatch(/valid email/i);
    expect((fakeClient.rpc as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("passes a normalized email to the RPC and returns the new id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "new-id", error: null });
    const client = { rpc } as unknown as SupabaseClient;
    const res = await inviteToDeal("d1", "  Buyer@Example.COM ", "co_buyer", client);
    expect(res).toEqual({ id: "new-id" });
    expect(rpc).toHaveBeenCalledWith("invite_to_deal", {
      p_deal: "d1",
      p_email: "buyer@example.com",
      p_role: "co_buyer",
    });
  });
});

describe("claimInvites returns the RPC count", () => {
  it("returns the number of claimed invites", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null });
    const client = { rpc } as unknown as SupabaseClient;
    expect(await claimInvites(client)).toBe(2);
    expect(rpc).toHaveBeenCalledWith("claim_deal_invites");
  });
  it("returns 0 on RPC error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "x" } });
    const client = { rpc } as unknown as SupabaseClient;
    expect(await claimInvites(client)).toBe(0);
  });
});
