import { render, screen, fireEvent } from "@testing-library/react";
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

import { CounterOfferTracker } from "./counter-offer-tracker";

function addRound() {
  fireEvent.click(screen.getByRole("button", { name: "Add a round" }));
}

describe("CounterOfferTracker", () => {
  it("records the private walk-away max price", () => {
    render(<CounterOfferTracker />);
    const max = screen.getByLabelText(/maximum price/i) as HTMLInputElement;
    fireEvent.change(max, { target: { value: "500000" } });
    expect(max.value).toBe("500000");
  });

  it("shows the empty state until a round is logged", () => {
    render(<CounterOfferTracker />);
    expect(screen.getByText(/log each round of the back-and-forth/i)).toBeInTheDocument();
  });

  it("records who/price/status for a round and surfaces live terms", () => {
    render(<CounterOfferTracker />);
    addRound();

    fireEvent.change(screen.getByLabelText("Who"), { target: { value: "seller" } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "610000" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "countered" } });

    expect(screen.getByLabelText("Current live terms").textContent).toMatch(
      /\$610,000/,
    );
  });

  it("warns when the live price exceeds the walk-away max", () => {
    render(<CounterOfferTracker />);
    fireEvent.change(screen.getByLabelText(/maximum price/i), {
      target: { value: "500000" },
    });
    addRound();
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "600000" } });
    expect(screen.getByText(/is above your max/i)).toBeInTheDocument();
  });

  it("screens protected-class terms out of the term-changes note on blur", () => {
    render(<CounterOfferTracker />);
    addRound();
    const notes = screen.getByPlaceholderText(
      /facts only \(screened\)/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: "Seller is a young couple" } });
    fireEvent.blur(notes);
    expect(notes.value).toContain("[removed]");
  });
});
