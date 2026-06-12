import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_id: string, initial: T) => {
    const [value, setValue] = useState<T>(initial);
    return {
      value,
      hydrated: true,
      save: (next: T | ((prev: T) => T)) =>
        setValue((prev) =>
          typeof next === "function" ? (next as (p: T) => T)(prev) : next,
        ),
      reset: () => setValue(initial),
    };
  },
}));

import { ContactsHub } from "./contacts-hub";

function addRole(roleLabel: string) {
  fireEvent.change(screen.getByLabelText("Role for the new contact"), {
    target: { value: roleLabelToValue(roleLabel) },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Add / }));
}

function roleLabelToValue(label: string): string {
  const map: Record<string, string> = {
    "Loan officer / lender": "loan-officer",
    "Escrow / title officer": "escrow-title",
    "Home inspector": "inspector",
    "Listing agent": "listing-agent",
  };
  return map[label] ?? "loan-officer";
}

describe("ContactsHub", () => {
  it("shows an empty state until a contact is added", () => {
    render(<ContactsHub />);
    expect(
      screen.getByText(/add the people on your deal/i),
    ).toBeInTheDocument();
  });

  it("adds a contact grouped under its role", () => {
    render(<ContactsHub />);
    addRole("Home inspector");
    const group = screen.getByRole("region", { name: "Home inspector" });
    expect(within(group).getByPlaceholderText("Full name")).toBeInTheDocument();
  });

  it("renders the wire-fraud reminder on the escrow/title group specifically", () => {
    render(<ContactsHub />);
    // Add a loan officer (no reminder) and an escrow/title officer (reminder).
    addRole("Loan officer / lender");
    addRole("Escrow / title officer");

    const escrow = screen.getByRole("region", { name: "Escrow / title officer" });
    expect(
      within(escrow).getByText(/verify wiring instructions by phone/i),
    ).toBeInTheDocument();

    const loan = screen.getByRole("region", { name: "Loan officer / lender" });
    expect(
      within(loan).queryByText(/verify wiring instructions by phone/i),
    ).toBeNull();
  });

  it("labels the listing agent as the seller's side (no advice / honest sides)", () => {
    render(<ContactsHub />);
    addRole("Listing agent");
    const group = screen.getByRole("region", { name: "Listing agent" });
    expect(within(group).getByText(/represents the seller/i)).toBeInTheDocument();
  });

  it("validates email inline without blocking the value", () => {
    render(<ContactsHub />);
    addRole("Loan officer / lender");
    const email = screen.getByPlaceholderText("name@example.com");
    fireEvent.change(email, { target: { value: "not-an-email" } });
    expect(screen.getByText(/doesn't look like an email/i)).toBeInTheDocument();
  });

  it("screens protected-class terms out of the contact note on blur", () => {
    render(<ContactsHub />);
    addRole("Loan officer / lender");
    const note = screen.getByPlaceholderText(/transaction facts only/i) as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "Near a synagogue" } });
    fireEvent.blur(note);
    expect(note.value).not.toMatch(/synagogue/i);
    expect(note.value).toContain("[removed]");
  });

  it("carries a no-advice / no-referral disclaimer", () => {
    render(<ContactsHub />);
    expect(screen.getByText(/not advice and not a referral/i)).toBeInTheDocument();
  });
});
