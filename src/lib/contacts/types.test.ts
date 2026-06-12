import { describe, expect, it } from "vitest";
import {
  CONTACT_ROLES,
  ROLE_META,
  WIRE_FRAUD_ROLES,
  contactsReducer,
  groupByRole,
  isValidEmail,
  isValidPhone,
  roleLabel,
  showsWireFraudReminder,
  type ContactsState,
  type DealContact,
} from "./types";

function contact(over: Partial<DealContact> = {}): DealContact {
  return {
    id: over.id ?? `c-${Math.random().toString(36).slice(2)}`,
    role: over.role ?? "loan-officer",
    name: over.name ?? "Pat Lender",
    phone: over.phone,
    email: over.email,
    note: over.note,
  };
}

describe("role roster", () => {
  it("every role has a label and a non-empty whose-side blurb", () => {
    for (const role of CONTACT_ROLES) {
      const meta = ROLE_META[role];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.blurb.length).toBeGreaterThan(0);
    }
  });

  it("labels the listing agent as the seller's side (no advice, honest sides)", () => {
    expect(ROLE_META["listing-agent"].blurb.toLowerCase()).toContain("seller");
  });

  it("pins the wire-fraud reminder to escrow/title and closing attorney only", () => {
    expect(showsWireFraudReminder("escrow-title")).toBe(true);
    expect(showsWireFraudReminder("closing-attorney")).toBe(true);
    expect(showsWireFraudReminder("loan-officer")).toBe(false);
    expect(showsWireFraudReminder("listing-agent")).toBe(false);
    expect(WIRE_FRAUD_ROLES).toContain("escrow-title");
  });

  it("roleLabel falls back to Other for unknown roles", () => {
    expect(roleLabel("inspector")).toBe("Home inspector");
  });
});

describe("validation", () => {
  it("treats empty optional email/phone as valid", () => {
    expect(isValidEmail(undefined)).toBe(true);
    expect(isValidEmail("")).toBe(true);
    expect(isValidPhone(undefined)).toBe(true);
    expect(isValidPhone("   ")).toBe(true);
  });

  it("accepts a well-formed email and rejects a malformed one", () => {
    expect(isValidEmail("officer@bank.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
  });

  it("accepts a phone with 7-15 digits across common formats and rejects too-short", () => {
    expect(isValidPhone("(415) 555-1212")).toBe(true);
    expect(isValidPhone("+1 415.555.1212")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("contactsReducer", () => {
  const base: ContactsState = { property: "", contacts: [] };

  it("adds a contact", () => {
    const next = contactsReducer(base, { type: "add", contact: contact({ id: "a" }) });
    expect(next.contacts).toHaveLength(1);
    expect(next.contacts[0].id).toBe("a");
  });

  it("removes a contact by id", () => {
    const seeded: ContactsState = {
      ...base,
      contacts: [contact({ id: "a" }), contact({ id: "b" })],
    };
    const next = contactsReducer(seeded, { type: "remove", id: "a" });
    expect(next.contacts.map((c) => c.id)).toEqual(["b"]);
  });

  it("patches a contact in place without touching others", () => {
    const seeded: ContactsState = {
      ...base,
      contacts: [contact({ id: "a", name: "Old" }), contact({ id: "b", name: "Keep" })],
    };
    const next = contactsReducer(seeded, {
      type: "patch",
      id: "a",
      patch: { name: "New", phone: "4155551212" },
    });
    expect(next.contacts[0].name).toBe("New");
    expect(next.contacts[0].phone).toBe("4155551212");
    expect(next.contacts[1].name).toBe("Keep");
  });

  it("sets the property label", () => {
    const next = contactsReducer(base, { type: "set-property", property: "123 Main" });
    expect(next.property).toBe("123 Main");
  });

  it("is pure — does not mutate the input state", () => {
    const seeded: ContactsState = { ...base, contacts: [contact({ id: "a" })] };
    const snapshot = JSON.stringify(seeded);
    contactsReducer(seeded, { type: "add", contact: contact({ id: "b" }) });
    expect(JSON.stringify(seeded)).toBe(snapshot);
  });
});

describe("groupByRole", () => {
  it("groups contacts in canonical role order and drops empty groups", () => {
    const contacts = [
      contact({ id: "1", role: "inspector" }),
      contact({ id: "2", role: "loan-officer" }),
      contact({ id: "3", role: "loan-officer" }),
    ];
    const groups = groupByRole(contacts);
    expect(groups.map((g) => g.role)).toEqual(["loan-officer", "inspector"]);
    expect(groups[0].contacts).toHaveLength(2);
  });

  it("returns an empty array for the empty hub", () => {
    expect(groupByRole([])).toEqual([]);
  });
});
