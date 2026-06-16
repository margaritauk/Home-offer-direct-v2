import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/reminders", {
    method: "POST",
    headers,
  });
}

describe("GET/POST /api/cron/reminders", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is unauthorized when no CRON_SECRET is configured (the CI default)", async () => {
    // No CRON_SECRET ⇒ fail closed, never fire for anyone.
    const res = await POST(req({ authorization: "Bearer anything" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ ran: false, error: "unauthorized" });
  });

  it("rejects a wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "right");
    const res = await POST(req({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("accepts the correct secret via Authorization Bearer and no-ops with push inactive", async () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    // PUSH not enabled / no VAPID ⇒ push inactive ⇒ nothing to dispatch.
    const res = await POST(req({ authorization: "Bearer s3cr3t" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ran: false, reason: "push_inactive" });
  });

  it("accepts the secret via the x-cron-secret header too", async () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    const res = await GET(req({ "x-cron-secret": "s3cr3t" }));
    expect(res.status).toBe(200);
    expect((await res.json()).ran).toBe(false);
  });

  it("honors the REMINDERS_DISABLED kill switch over an active config", async () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    vi.stubEnv("REMINDERS_DISABLED", "true");
    vi.stubEnv("PUSH_ENABLED", "true");
    vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    const res = await POST(req({ authorization: "Bearer s3cr3t" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ran: false, reason: "reminders_disabled" });
  });

  it("runs (dispatching 0) when push is fully configured and the kill switch is off", async () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    vi.stubEnv("PUSH_ENABLED", "true");
    vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    const res = await POST(req({ authorization: "Bearer s3cr3t" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ran: true, dispatched: 0 });
  });

  it("never 500s", async () => {
    const res = await POST(req());
    expect(res.status).toBeLessThan(500);
  });
});
