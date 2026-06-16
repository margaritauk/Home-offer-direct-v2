/**
 * Tracked reminders kill switch + background-push gate (S1-R1). See ADR-014.
 *
 * Mirrors {@link isRentCastDisabled} / {@link isAiExplainerDisabled}:
 *
 *  - `REMINDERS_DISABLED` — single off-switch for ALL reminder delivery. When
 *    truthy, the cron route no-ops and the in-app deriver is treated as off, even
 *    if everything else is configured. Flip to cut reminders fast (bad data, a
 *    runaway cron, a legal hold) and restore by flipping it back.
 *  - `PUSH_ENABLED` + VAPID keys — background Web Push is OFF by default. The
 *    in-app banner path needs NONE of these and always works; push is the gated,
 *    plumbing-first channel. Push is active ONLY when the kill switch is off AND
 *    `PUSH_ENABLED` is truthy AND both VAPID keys are present.
 *
 * Truthy = "1" | "true" | "yes" | "on" (case-insensitive). Anything else
 * (including unset/empty) is off/false.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */

function isTruthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Kill switch for ALL reminder delivery (in-app deriver + push). */
export function isRemindersDisabled(): boolean {
  return isTruthy(process.env.REMINDERS_DISABLED);
}

/**
 * Whether background Web Push is active. Default-off: requires the kill switch
 * off, `PUSH_ENABLED` truthy, AND both VAPID keys present. With no keys (CI),
 * this is false and only the in-app path is live.
 */
export function isPushActive(): boolean {
  return (
    !isRemindersDisabled() &&
    isTruthy(process.env.PUSH_ENABLED) &&
    Boolean(process.env.VAPID_PUBLIC_KEY) &&
    Boolean(process.env.VAPID_PRIVATE_KEY)
  );
}
