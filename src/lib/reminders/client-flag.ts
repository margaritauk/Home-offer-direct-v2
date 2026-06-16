/**
 * CLIENT surface flag for background Web Push (S1-R1).
 *
 * Mirrors {@link isAiExplainerOffered}. The reminders UI offers the "Turn on
 * browser notifications" value-first gesture ONLY when
 * `NEXT_PUBLIC_PUSH_ENABLED === "true"` AND there is a VAPID public key to
 * subscribe with. Default false ⇒ the UI ships the in-app-only path and never
 * shows a push prompt.
 *
 * Decoupled from the server gate ({@link isPushActive}): offering the gesture does
 * NOT mean the server can deliver push — the cron route gates independently. So
 * this flag alone never turns push on. Push permission is requested ONLY on this
 * explicit gesture, never on page load.
 *
 * Safe to import from client components (reads only `NEXT_PUBLIC_` vars).
 */
export function isPushOffered(): boolean {
  return (
    process.env.NEXT_PUBLIC_PUSH_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  );
}
