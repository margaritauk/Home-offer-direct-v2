/**
 * Transaction contacts / "who's-who" hub (A4).
 *
 * Pure organization — no advice, no embedded referrals (RESPA). A per-deal list
 * of the standard cast on a financed purchase (loan officer, escrow/title
 * officer, closing attorney, inspector, listing agent, insurance agent, other),
 * each with name + optional phone/email + a screened note.
 *
 * This module is the PURE core: the role roster, role labels, a light CRUD/
 * validation reducer, and email/phone validators. No React, no storage — so it
 * is fully unit-testable. The component rides `useStageTool`.
 *
 * Compliance:
 *  - FHA: only role/contact facts. The free-text `note` is screened in the UI
 *    via `screenText` before it is persisted; nothing here solicits or stores
 *    protected-class signals.
 *  - RESPA: this is a contact list, not a referral engine — no vendor is
 *    suggested or tied to revenue here.
 *  - UPL: organizational only. Roles are labeled by *whose side* a party is on
 *    so the buyer never assumes the listing agent represents them.
 */

/** The standard roles an agent normally quarterbacks on a purchase. */
export type ContactRole =
  | "loan-officer"
  | "escrow-title"
  | "closing-attorney"
  | "inspector"
  | "listing-agent"
  | "insurance"
  | "other";

export const CONTACT_ROLES = [
  "loan-officer",
  "escrow-title",
  "closing-attorney",
  "inspector",
  "listing-agent",
  "insurance",
  "other",
] as const satisfies readonly ContactRole[];

export interface RoleMeta {
  id: ContactRole;
  label: string;
  /** Whose side this party is on / what they do — keeps roles honestly labeled. */
  blurb: string;
}

export const ROLE_META: Record<ContactRole, RoleMeta> = {
  "loan-officer": {
    id: "loan-officer",
    label: "Loan officer / lender",
    blurb: "Works for your lender on your financing.",
  },
  "escrow-title": {
    id: "escrow-title",
    label: "Escrow / title officer",
    blurb: "Neutral party that holds funds and handles title and closing.",
  },
  "closing-attorney": {
    id: "closing-attorney",
    label: "Closing attorney",
    blurb: "Conducts or oversees closing in attorney-close states.",
  },
  inspector: {
    id: "inspector",
    label: "Home inspector",
    blurb: "You hire and pay them; they report on the property's condition.",
  },
  "listing-agent": {
    id: "listing-agent",
    label: "Listing agent",
    blurb: "Represents the seller — not you. Mind what you share.",
  },
  insurance: {
    id: "insurance",
    label: "Insurance agent",
    blurb: "Your homeowners / hazard insurance contact.",
  },
  other: {
    id: "other",
    label: "Other",
    blurb: "Surveyor, HOA management, home-warranty, or anyone else on the deal.",
  },
};

/** Roles that carry the wire-fraud reminder (they touch your money/closing). */
export const WIRE_FRAUD_ROLES: readonly ContactRole[] = [
  "escrow-title",
  "closing-attorney",
];

export function roleLabel(role: ContactRole): string {
  return ROLE_META[role]?.label ?? "Other";
}

/** True when this role should show the wire-fraud reminder. */
export function showsWireFraudReminder(role: ContactRole): boolean {
  return WIRE_FRAUD_ROLES.includes(role);
}

export interface DealContact {
  id: string;
  role: ContactRole;
  name: string;
  phone?: string;
  email?: string;
  /** Screened free text (facts only). */
  note?: string;
}

/**
 * Lenient email check — we never *block* a save (the buyer owns their data), we
 * only surface inline validation. Empty is considered valid (the field is
 * optional). Anything with a single `@` and a dotted domain passes.
 */
export function isValidEmail(email: string | undefined): boolean {
  if (!email || email.trim() === "") return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Lenient phone check: optional, and once given must contain at least 7 digits
 * (ignoring spaces, dashes, parens, dots, and a leading +). Empty is valid.
 */
export function isValidPhone(phone: string | undefined): boolean {
  if (!phone || phone.trim() === "") return true;
  const digits = phone.replace(/[\s().+-]/g, "");
  return /^\d{7,15}$/.test(digits);
}

export interface ContactsState {
  /** Optional label for the home this contact list is for. */
  property?: string;
  contacts: DealContact[];
}

export const INITIAL_CONTACTS: ContactsState = { property: "", contacts: [] };

export type ContactsAction =
  | { type: "add"; contact: DealContact }
  | { type: "remove"; id: string }
  | { type: "patch"; id: string; patch: Partial<Omit<DealContact, "id">> }
  | { type: "set-property"; property: string };

/**
 * Pure reducer for the contacts list. Kept side-effect-free so the component can
 * persist the result via `useStageTool` and so the CRUD is unit-testable.
 */
export function contactsReducer(
  state: ContactsState,
  action: ContactsAction,
): ContactsState {
  switch (action.type) {
    case "add":
      return { ...state, contacts: [...state.contacts, action.contact] };
    case "remove":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
      };
    case "patch":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "set-property":
      return { ...state, property: action.property };
    default:
      return state;
  }
}

/** Group contacts by role, in the canonical role order, dropping empty groups. */
export function groupByRole(
  contacts: DealContact[],
): { role: ContactRole; meta: RoleMeta; contacts: DealContact[] }[] {
  return CONTACT_ROLES.map((role) => ({
    role,
    meta: ROLE_META[role],
    contacts: contacts.filter((c) => c.role === role),
  })).filter((g) => g.contacts.length > 0);
}
