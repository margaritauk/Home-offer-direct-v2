import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentOutreach } from "./agent-outreach";
import type { ShowingRecord } from "@/lib/showings/types";

// Back the store with a no-op update; we only render the section.
vi.mock("@/hooks/use-showings", () => ({
  useShowings: () => ({ update: vi.fn() }),
}));

const record: ShowingRecord = {
  listingId: "l1",
  address: "123 Maple St",
  city: "Austin",
  state: "TX",
  status: "interested",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

// Protected-class words that must NOT appear as input labels/placeholders.
const PROTECTED = [
  /race/i,
  /religion/i,
  /family/i,
  /children/i,
  /marital/i,
  /spouse/i,
  /disab/i,
  /gender/i,
  /national origin/i,
];

describe("AgentOutreach (FHA guardrail #22 / #29)", () => {
  it("shows the user-entered contact note when expanded", () => {
    render(<AgentOutreach record={record} />);
    fireEvent.click(screen.getByRole("button", { name: /agent contact/i }));
    expect(
      screen.getByText(/what you entered from the public listing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/we never send anything for you/i)).toBeInTheDocument();
  });

  it("offers no protected-class input fields", () => {
    render(<AgentOutreach record={record} />);
    fireEvent.click(screen.getByRole("button", { name: /agent contact/i }));
    const inputs = [
      ...screen.queryAllByRole("textbox"),
      ...screen.queryAllByRole("combobox"),
    ];
    for (const el of inputs) {
      const label =
        el.getAttribute("aria-label") ??
        el.getAttribute("placeholder") ??
        el.closest("label")?.textContent ??
        "";
      for (const pattern of PROTECTED) {
        expect(pattern.test(label), `field "${label}" matches ${pattern}`).toBe(
          false,
        );
      }
    }
  });
});
