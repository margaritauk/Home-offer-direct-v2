"use client";

import { useState } from "react";
import { useShowings } from "@/hooks/use-showings";
import { screenText } from "@/lib/ai/screening";
import {
  addOutreach,
  mailtoUrl,
  outreachChannelLabels,
  telUrl,
} from "@/lib/showings/outreach";
import { messageTemplates, renderTemplate } from "@/lib/showings/templates";
import type {
  AgentContact,
  OutreachChannel,
  OutreachEntry,
  ShowingRecord,
} from "@/lib/showings/types";

/**
 * Agent contact + outreach log for a single showing record (issue #29).
 *
 * The buyer types in contact details they got from a PUBLIC source (listing,
 * sign, open house) and logs their own outreach attempts. "Send" buttons open
 * the buyer's OWN email (`mailto:`) or phone (`tel:`) app with an FHA-safe
 * draft prefilled — we never send or transmit anything on their behalf.
 *
 * GUARDRAIL (Fair Housing, #22): no protected-class inputs anywhere. Free-text
 * fields (outcome, notes) are run through `screenText` before they are stored.
 */

const CHANNELS: OutreachChannel[] = ["email", "phone", "in-person", "other"];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `o-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

function AgentContactForm({
  record,
  onChange,
}: {
  record: ShowingRecord;
  onChange: (agent: AgentContact) => void;
}) {
  const agent = record.agent ?? {};
  const set = (key: keyof AgentContact, value: string) =>
    onChange({ ...agent, [key]: value });

  const fields: {
    key: keyof AgentContact;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { key: "name", label: "Agent name", placeholder: "e.g. Jordan Lee" },
    { key: "brokerage", label: "Brokerage", placeholder: "e.g. Acme Realty" },
    { key: "email", label: "Email", placeholder: "agent@example.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "tel" },
    { key: "source", label: "Where you found it", placeholder: "e.g. listing page, yard sign" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            {f.label}
          </span>
          <input
            type={f.type ?? "text"}
            value={agent[f.key] ?? ""}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}

function AddOutreachForm({ onAdd }: { onAdd: (entry: OutreachEntry) => void }) {
  const [channel, setChannel] = useState<OutreachChannel>("email");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    // Screen free text for protected-class signals before it is stored/used,
    // matching how the rest of the app screens free text (#22).
    const entry: OutreachEntry = {
      id: uid(),
      date: new Date().toISOString(),
      channel,
      outcome: outcome.trim() ? screenText(outcome).text : undefined,
      notes: notes.trim() ? screenText(notes).text : undefined,
    };
    onAdd(entry);
    setOutcome("");
    setNotes("");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Channel
          </span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as OutreachChannel)}
            className={inputClass}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {outreachChannelLabels[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Outcome
          </span>
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. left voicemail, showing booked"
            className={inputClass}
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">
          Notes (facts only)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="What was discussed — property and transaction facts only."
          className={inputClass}
        />
      </label>
      <button type="button" onClick={submit} className="btn-secondary mt-3 text-sm">
        Add outreach
      </button>
    </div>
  );
}

function OutreachLog({ entries }: { entries: OutreachEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-ink-muted">No outreach logged yet.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-ink">
              {outreachChannelLabels[e.channel]}
              {e.outcome ? ` — ${e.outcome}` : ""}
            </span>
            <time className="text-xs text-ink-muted" dateTime={e.date}>
              {new Date(e.date).toLocaleString()}
            </time>
          </div>
          {e.notes ? (
            <p className="mt-1 whitespace-pre-wrap text-ink-soft">{e.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function AgentOutreach({ record }: { record: ShowingRecord }) {
  const { update } = useShowings();
  const [open, setOpen] = useState(false);

  const agent = record.agent ?? {};
  const outreach = record.outreach ?? [];

  // FHA-safe draft for the buyer's own email client. Built from the
  // request-showing template, with only property/transaction facts.
  const template =
    messageTemplates.find((t) => t.id === "request-showing") ??
    messageTemplates[0];
  const emailBody = renderTemplate(template, {
    agentName: agent.name,
    address: record.address,
  });
  const subject = `Showing request — ${record.address}`;

  const saveAgent = (next: AgentContact) =>
    update(record.listingId, { agent: next });

  const addEntry = (entry: OutreachEntry) =>
    update(record.listingId, { outreach: addOutreach(outreach, entry) });

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-medium text-ink-soft hover:text-ink"
      >
        <span>
          Agent contact &amp; outreach
          {outreach.length ? ` (${outreach.length})` : ""}
        </span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-4">
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-ink-muted">
            Contact info is what you entered from the public listing / sign /
            open house — we don&apos;t provide it. Stick to property and
            transaction facts; don&apos;t share or ask about personal or family
            details.
          </p>

          <AgentContactForm record={record} onChange={saveAgent} />

          <div className="flex flex-wrap gap-2">
            <a
              href={mailtoUrl({ email: agent.email, subject, body: emailBody })}
              className="btn-secondary text-sm"
            >
              Email agent
            </a>
            <a
              href={telUrl(agent.phone)}
              className="btn-secondary text-sm"
            >
              Call agent
            </a>
          </div>
          <p className="text-xs text-ink-muted">
            These open your own email or phone app with a factual draft — we
            never send anything for you.
          </p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ink">Outreach log</h4>
            <OutreachLog entries={outreach} />
            <AddOutreachForm onAdd={addEntry} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
