import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { emptyOffer } from "@/hooks/use-offer";
import { DeadlinesStep } from "./deadlines-step";

beforeEach(() => localStorage.clear());

function offerWithClosing() {
  return { ...emptyOffer(), closingDate: "2026-09-01" };
}

describe("DeadlinesStep", () => {
  it("renders the under-contract date and response-window inputs", () => {
    render(<DeadlinesStep offer={offerWithClosing()} />);
    expect(screen.getByLabelText("Date under contract")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Offer response window in hours"),
    ).toBeInTheDocument();
  });

  it("reflects a typed under-contract date and reveals the response deadline", () => {
    render(<DeadlinesStep offer={offerWithClosing()} />);
    const date = screen.getByLabelText(
      "Date under contract",
    ) as HTMLInputElement;
    // No under-contract date yet → no offer response deadline line.
    expect(screen.queryAllByText(/offer response deadline/i)).toHaveLength(0);

    fireEvent.change(date, { target: { value: "2026-07-01" } });
    expect(date.value).toBe("2026-07-01");
    // The offer response deadline now appears (banner + milestone entry).
    expect(
      screen.queryAllByText(/offer response deadline/i).length,
    ).toBeGreaterThan(0);
  });

  it("updates the response-window hours value", () => {
    render(<DeadlinesStep offer={offerWithClosing()} />);
    const hours = screen.getByLabelText(
      "Offer response window in hours",
    ) as HTMLInputElement;
    fireEvent.change(hours, { target: { value: "48" } });
    expect(hours.value).toBe("48");
  });
});
