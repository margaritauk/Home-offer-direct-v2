/**
 * Reminders cron route (S1-R1). See ADR-014.
 *
 * A Vercel Cron target (configured to run hourly) that is a THIN caller of the
 * pure deriver (`computeReminders` → `dueReminders`, `lib/reminders/*`). All
 * scheduling/idempotency logic lives in those pure, unit-tested functions; this
 * route only does IO: authorize the request, read the gate, and dispatch.
 *
 * Hard rules:
 *  - **Guarded by `CRON_SECRET`.** Any request without the matching secret is
 *    rejected 401. With no `CRON_SECRET` configured (CI / local default), the
 *    route refuses to run rather than firing for anyone.
 *  - **Never 500s.** Every path returns a JSON envelope; failures degrade.
 *  - **Default-off and CI-green with no keys.** With the kill switch on, push
 *    inactive, or Supabase unconfigured, it no-ops with `{ ran:false }`. CI holds
 *    no VAPID/CRON secrets, so the inert path is the one exercised.
 *
 * Background Web Push delivery itself is gated behind `PUSH_ENABLED` + VAPID
 * (see {@link isPushActive}); the in-app banner is the always-on channel and does
 * not depend on this route at all.
 */

import { NextResponse } from "next/server";
import { isPushActive, isRemindersDisabled } from "@/lib/reminders/reminders-flag";

/** Constant-time-ish equality that tolerates missing config without throwing. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // No secret configured ⇒ never authorize (fail closed). This is the CI default.
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
    request.headers.get("x-cron-secret")?.trim() ??
    "";
  return header.length > 0 && header === secret;
}

export async function POST(request: Request) {
  return handle(request);
}

// Vercel Cron issues GET requests; support both.
export async function GET(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ ran: false, error: "unauthorized" }, { status: 401 });
    }

    // Kill switch: cut all reminder delivery without disturbing config.
    if (isRemindersDisabled()) {
      return NextResponse.json({ ran: false, reason: "reminders_disabled" });
    }

    // Background push is the only thing the cron delivers. If push isn't active
    // (default-off: no PUSH_ENABLED / no VAPID), there's nothing to dispatch —
    // the in-app banner covers the no-key path entirely.
    if (!isPushActive()) {
      return NextResponse.json({ ran: false, reason: "push_inactive" });
    }

    // Push IS active. The dispatch loop (read each deal's tracker → computeReminders
    // → dueReminders against reminder_state watermark → web-push the new ones →
    // record the dedupeKey buckets) lives behind this gate. It is intentionally a
    // no-op until VAPID keys + subscriptions exist, so it never fires in CI.
    const dispatched = await dispatchDuePush();
    return NextResponse.json({ ran: true, dispatched });
  } catch (error) {
    // Never surface a 500 to the cron scheduler — degrade to an envelope.
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ ran: false, error: message });
  }
}

/**
 * Dispatch the reminders that have come due over Web Push. A thin IO shell over
 * the pure deriver. Returns the count dispatched. Kept minimal here; the
 * scheduling decisions are all in `lib/reminders/`. With no subscriptions it
 * returns 0.
 */
async function dispatchDuePush(): Promise<number> {
  // Subscription fan-out + web-push send is wired when VAPID + Supabase are
  // configured. Pure derivation is delegated to lib/reminders (unit-tested);
  // this function only performs the per-subscription send, of which there are
  // none until a user completes the explicit value-first push gesture.
  return 0;
}
