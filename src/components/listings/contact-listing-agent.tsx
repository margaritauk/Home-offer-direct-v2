"use client";

import { useState } from "react";
import { MessageComposer } from "@/components/showings/message-composer";
import {
  hasContactData,
  mailtoHref,
  showingRequestPrefill,
  telHref,
} from "@/lib/listings/contact";
import type { ListingContact } from "@/lib/listings/types";

/**
 * "Contact the listing agent to book a showing" block (Item 3 / S0b).
 *
 * Renders only when real listing-agent (or office) contact data exists — the
 * caller gates on RentCast being active + the data present, and this component
 * itself returns `null` if there's nothing usable (graceful absent-state, no
 * empty/broken block).
 *
 * Affordances: tap-to-call (`tel:`), email (`mailto:`), and a one-tap
 * "Draft my showing request" that opens the existing FHA-safe
 * {@link MessageComposer} pre-filled (agent name + address + MLS#) via
 * `initialValues` — a props pass-through, not a rebuild. ≥44px targets.
 *
 * UDAP/honesty: a "verify before sending" source label + the prominent reminder
 * that the listing agent works for the SELLER (the composer's own amber agency
 * block reinforces it). UPL: logistics only — booking a showing, no price/terms
 * advice.
 */
export function ContactListingAgent({
  agent,
  office,
  address,
  mlsNumber,
}: {
  agent?: ListingContact;
  office?: ListingContact;
  address: string;
  mlsNumber?: string;
}) {
  const [draftOpen, setDraftOpen] = useState(false);

  if (!hasContactData(agent, office)) return null;

  const contact = agent && (agent.name || agent.phone || agent.email) ? agent : office;
  const tel = telHref(contact?.phone);
  const mail = mailtoHref(contact?.email, `Showing request — ${address}`);
  const prefill = showingRequestPrefill({ agent, address, mlsNumber });

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold text-ink">
        Contact the listing agent to book a showing
      </h3>

      <div className="mt-2 space-y-0.5 text-sm">
        {contact?.name ? (
          <p className="font-medium text-ink">{contact.name}</p>
        ) : null}
        {office?.name && office.name !== contact?.name ? (
          <p className="text-ink-soft">{office.name}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tel ? (
          <a
            href={tel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-ink hover:border-brand-300"
          >
            📞 Call
          </a>
        ) : null}
        {mail ? (
          <a
            href={mail}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-ink hover:border-brand-300"
          >
            ✉️ Email
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => setDraftOpen((v) => !v)}
          className="btn-primary inline-flex min-h-[44px] items-center justify-center"
          aria-expanded={draftOpen}
        >
          Draft my showing request
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Listing-agent contact from listing data — <strong>verify before
        sending</strong> (details can be out of date). Remember: the listing
        agent works for the <strong>seller</strong>, not for you.
      </p>

      {draftOpen ? (
        <div className="mt-4">
          <MessageComposer
            initialValues={prefill}
            initialTemplateId="request-showing"
          />
        </div>
      ) : null}
    </div>
  );
}
