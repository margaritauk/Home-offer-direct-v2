import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Term } from "./term";
import { glossaryBySlug } from "@/lib/glossary";

describe("Term", () => {
  it("renders a known slug as a button that toggles a popover with the definition and glossary link", () => {
    render(<Term slug="escrow">escrow</Term>);

    const trigger = screen.getByRole("button", { name: "escrow" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Closed: no definition / link shown.
    expect(screen.queryByText(glossaryBySlug.escrow.definition)).toBeNull();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(glossaryBySlug.escrow.definition),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /full glossary/i });
    expect(link).toHaveAttribute("href", "/glossary#escrow");

    // Toggle closed again.
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(glossaryBySlug.escrow.definition)).toBeNull();
  });

  it("wires aria-describedby to the popover id only while open", () => {
    render(<Term slug="escrow">escrow</Term>);
    const trigger = screen.getByRole("button", { name: "escrow" });

    expect(trigger).not.toHaveAttribute("aria-describedby");

    fireEvent.click(trigger);
    const describedBy = trigger.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveAttribute(
      "role",
      "tooltip",
    );
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(<Term slug="escrow">escrow</Term>);
    const trigger = screen.getByRole("button", { name: "escrow" });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("renders plain text with no button for an unknown slug", () => {
    render(<Term slug="not-a-real-term">PITI</Term>);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("PITI")).toBeInTheDocument();
  });
});
