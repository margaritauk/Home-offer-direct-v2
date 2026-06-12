"use client";

import { useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { PropertyField } from "@/components/homes/property-field";
import { TrustCallout } from "@/components/trust-callout";
import {
  CONTACT_ROLES,
  INITIAL_CONTACTS,
  ROLE_META,
  contactsReducer,
  groupByRole,
  isValidEmail,
  isValidPhone,
  roleLabel,
  showsWireFraudReminder,
  type ContactRole,
  type ContactsState,
  type DealContact,
} from "@/lib/contacts/types";
import { ToolDisclaimer } from "./tool-disclaimer";

function newContact(role: ContactRole): DealContact {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    name: "",
    phone: "",
    email: "",
    note: "",
  };
}

export function ContactsHub() {
  const { value, hydrated, save, reset } = useStageTool<ContactsState>(
    "contacts",
    INITIAL_CONTACTS,
  );
  const [addRole, setAddRole] = useState<ContactRole>("loan-officer");

  const dispatch = (action: Parameters<typeof contactsReducer>[1]) =>
    save((prev) => contactsReducer(prev, action));

  const addContact = () =>
    dispatch({ type: "add", contact: newContact(addRole) });
  const removeContact = (id: string) => dispatch({ type: "remove", id });
  const patchContact = (id: string, patch: Partial<Omit<DealContact, "id">>) =>
    dispatch({ type: "patch", id, patch });

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const groups = groupByRole(value.contacts);

  return (
    <div className="space-y-6" data-testid="contacts-hub">
      <PropertyField
        value={value.property ?? ""}
        onChange={(property) => dispatch({ type: "set-property", property })}
      />

      <div className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block flex-1 sm:max-w-xs">
            <span className="text-sm font-medium text-ink-soft">Add a contact</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              aria-label="Role for the new contact"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as ContactRole)}
            >
              {CONTACT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_META[role].label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={addContact}>
              Add {roleLabel(addRole).toLowerCase()}
            </button>
            {value.contacts.length > 0 ? (
              <button type="button" className="btn-secondary" onClick={reset}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {value.contacts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-ink-soft">
            Add the people on your deal so you&apos;ve got one place to reach them
            — loan officer, escrow/title officer, inspector, and anyone else.
          </p>
        ) : null}
      </div>

      {groups.map((group) => (
        <section key={group.role} className="space-y-3" aria-label={group.meta.label}>
          <div>
            <h3 className="text-base font-semibold">{group.meta.label}</h3>
            <p className="text-xs text-ink-muted">{group.meta.blurb}</p>
          </div>

          {showsWireFraudReminder(group.role) ? (
            <TrustCallout
              tone="warning"
              title="Verify wiring instructions by phone"
            >
              No one will <strong>ever</strong> change wiring instructions by
              email or text. Before you send any funds, call a{" "}
              <strong>known, independently verified number</strong> for this
              office to confirm the account — wire fraud is the #1 closing scam.
            </TrustCallout>
          ) : null}

          <div className="space-y-3">
            {group.contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onPatch={(patch) => patchContact(c.id, patch)}
                onRemove={() => removeContact(c.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <ToolDisclaimer>
        This is an organizer, <strong>not advice and not a referral</strong>. It
        only stores the contacts you enter. The listing agent works for the
        seller — share with them accordingly.
      </ToolDisclaimer>
    </div>
  );
}

function ContactCard({
  contact,
  onPatch,
  onRemove,
}: {
  contact: DealContact;
  onPatch: (patch: Partial<Omit<DealContact, "id">>) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState(contact.note ?? "");
  const emailValid = isValidEmail(contact.email);
  const phoneValid = isValidPhone(contact.phone);

  const commitNote = () => {
    const screened = screenText(note).text;
    if (screened !== note) setNote(screened);
    onPatch({ note: screened });
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-ink-soft">Name</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Full name"
            value={contact.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-secondary mt-6 shrink-0"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Phone</span>
          <input
            type="tel"
            inputMode="tel"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="(555) 123-4567"
            value={contact.phone ?? ""}
            aria-invalid={!phoneValid || undefined}
            onChange={(e) => onPatch({ phone: e.target.value })}
          />
          {!phoneValid ? (
            <span className="mt-1 block text-xs text-red-600" role="alert">
              That doesn&apos;t look like a phone number.
            </span>
          ) : contact.phone && contact.phone.trim() ? (
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              className="mt-1 inline-block min-h-[44px] py-2 text-xs font-medium text-brand-700 hover:underline"
            >
              Call {contact.phone}
            </a>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Email</span>
          <input
            type="email"
            inputMode="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="name@example.com"
            value={contact.email ?? ""}
            aria-invalid={!emailValid || undefined}
            onChange={(e) => onPatch({ email: e.target.value })}
          />
          {!emailValid ? (
            <span className="mt-1 block text-xs text-red-600" role="alert">
              That doesn&apos;t look like an email address.
            </span>
          ) : contact.email && contact.email.trim() ? (
            <a
              href={`mailto:${contact.email.trim()}`}
              className="mt-1 inline-block min-h-[44px] py-2 text-xs font-medium text-brand-700 hover:underline"
            >
              Email {contact.email}
            </a>
          ) : null}
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Note (optional)</span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Transaction facts only (screened)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
        />
      </label>
    </div>
  );
}
