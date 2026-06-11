import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageComposer } from "./message-composer";

describe("MessageComposer", () => {
  it("renders the template select and all blank-fill fields", () => {
    render(<MessageComposer />);
    expect(screen.getByLabelText("Template")).toBeInTheDocument();
    for (const label of [
      "Listing agent name",
      "Property address",
      "MLS #",
      "Date options",
      "Time options",
      "Your name",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("merges a typed field into the live preview", () => {
    render(<MessageComposer />);
    fireEvent.change(screen.getByLabelText("Property address"), {
      target: { value: "123 Maple St" },
    });
    const preview = screen.getByLabelText("Message preview") as HTMLTextAreaElement;
    expect(preview.value).toContain("123 Maple St");
  });

  it("switching templates changes the preview", () => {
    render(<MessageComposer />);
    const preview = screen.getByLabelText("Message preview") as HTMLTextAreaElement;
    const before = preview.value;
    fireEvent.change(screen.getByLabelText("Template"), {
      target: { value: "follow-up" },
    });
    expect(preview.value).not.toBe(before);
  });
});
