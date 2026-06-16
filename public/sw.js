/*
 * Service worker for background Web Push reminders (S1-R1). See ADR-014.
 *
 * Default-off: this worker is only registered after the user makes the explicit
 * value-first "enable browser notifications" gesture (never on page load). It
 * does nothing but receive a push payload (already derived + screened server-side
 * by the cron over the pure `lib/reminders` deriver) and show a process-framed
 * notification. No deadline shown here is "of record" — the contract governs.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = {};
  }
  const title = data.title || "HomeOffer Direct reminder";
  const body =
    data.body || "A contract deadline is coming up. We surface your dates; the contract is the source of truth.";
  const url = data.url || "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      tag: data.tag, // dedupeKey-derived tag so a re-fire replaces, never stacks
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
