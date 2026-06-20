/**
 * Pure helpers for the "contact the listing agent" block (Item 3 / S0b).
 *
 * `tel:`/`mailto:` href builders that sanitize the source phone/email so a
 * malformed value can't produce a broken or injection-y link, plus the
 * showing-request prefill builder that feeds `MessageComposer.initialValues`.
 * Kept pure + unit-tested; no React/DOM.
 */

import type { ListingContact } from "./types";

/** A `tel:` href from a phone string, keeping only dialable characters. */
export function telHref(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  // Keep digits and a leading +; strip everything else (spaces, parens, dashes).
  const cleaned = phone.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7) return undefined;
  return `tel:${cleaned}`;
}

/** A `mailto:` href from an email, validated; subject optional. */
export function mailtoHref(
  email: string | undefined,
  subject?: string,
): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  const base = `mailto:${trimmed}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

/**
 * Build the `MessageComposer` prefill for a showing request: the agent name +
 * property address + MLS#. Facts only — no protected-class fields (FHA). The MLS
 * number is optional (RentCast doesn't always expose one).
 */
export function showingRequestPrefill(opts: {
  agent?: ListingContact;
  address: string;
  mlsNumber?: string;
}): { agentName?: string; address: string; mlsNumber?: string } {
  const out: { agentName?: string; address: string; mlsNumber?: string } = {
    address: opts.address,
  };
  if (opts.agent?.name) out.agentName = opts.agent.name;
  if (opts.mlsNumber) out.mlsNumber = opts.mlsNumber;
  return out;
}

/** Whether there's enough contact data to render the block at all. */
export function hasContactData(
  agent: ListingContact | undefined,
  office: ListingContact | undefined,
): boolean {
  const any = (c: ListingContact | undefined) =>
    Boolean(c && (c.name || c.phone || c.email || c.website));
  return any(agent) || any(office);
}
