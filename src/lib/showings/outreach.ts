/**
 * Pure helpers for the agent-contact + outreach log (issue #29).
 *
 * GUARDRAIL (Fair Housing, #22): everything here moves only neutral
 * property/transaction facts. The mailto/tel builders open the BUYER'S OWN
 * email/phone app with a prefilled draft — HomeOffer Direct never sends,
 * relays, or transmits any message on the buyer's behalf.
 *
 * All functions are pure and defensive (tolerate missing/empty values).
 */

import type { OutreachChannel, OutreachEntry } from "./types";

/** Human-readable labels for the outreach channels. */
export const outreachChannelLabels: Record<OutreachChannel, string> = {
  email: "Email",
  phone: "Phone",
  "in-person": "In person",
  other: "Other",
};

/**
 * Append an outreach entry to the buyer's log. Pure — returns a NEW array and
 * never mutates the input. Newest entries are kept at the front so the UI can
 * render the most recent attempt first. A missing/undefined list is treated as
 * empty.
 */
export function addOutreach(
  list: OutreachEntry[] | undefined,
  entry: OutreachEntry,
): OutreachEntry[] {
  return [entry, ...(list ?? [])];
}

/**
 * Build a safe `mailto:` URL that opens the buyer's own email client with the
 * recipient, subject, and body prefilled. Subject and body are URL-encoded.
 * Tolerates a missing email (returns `mailto:` with just the query) and missing
 * subject/body (those params are simply omitted).
 *
 * We never send the message — the buyer reviews and sends it themselves.
 */
export function mailtoUrl({
  email,
  subject,
  body,
}: {
  email?: string;
  subject?: string;
  body?: string;
}): string {
  const params: string[] = [];
  if (subject && subject.trim()) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body && body.trim()) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  const query = params.length ? `?${params.join("&")}` : "";
  const recipient = email ? encodeURIComponent(email.trim()) : "";
  return `mailto:${recipient}${query}`;
}

/**
 * Build a safe `tel:` URL that opens the buyer's own phone dialer. Strips
 * characters a dialer can't use, keeping digits, a leading `+`, `*`, and `#`.
 * Returns an empty `tel:` when no usable number is provided.
 */
export function telUrl(phone?: string): string {
  if (!phone) return "tel:";
  // Keep digits and dialable symbols; a leading + is preserved if present.
  const hasPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/[^\d*#]/g, "");
  return `tel:${hasPlus ? "+" : ""}${digits}`;
}
