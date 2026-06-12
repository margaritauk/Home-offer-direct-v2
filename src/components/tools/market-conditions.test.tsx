import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Back useStageTool with real state so inputs are interactive without touching
// localStorage (mirrors the go-solo / clear-to-close component tests).
vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_toolId: string, initial: T) => {
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

// Avoid pulling the real state-selection hook chain.
vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({ stateCode: undefined, hydrated: true }),
}));

import { MarketConditions } from "./market-conditions";

function setNumber(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("MarketConditions", () => {
  it("opens with an 'enter the numbers' empty state (unknown read)", () => {
    render(<MarketConditions />);
    expect(
      screen.getByText(/not enough data yet to read the market/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/enter the numbers for your area/i)).toBeInTheDocument();
  });

  it("renders a seller's-market read when hot numbers are entered", () => {
    render(<MarketConditions />);
    setNumber(/months of supply/i, "1.5");
    setNumber(/days on market/i, "8");
    setNumber(/list-to-sale ratio/i, "103");
    // Headline is specific (gauge axis labels also say "seller's market").
    expect(
      screen.getAllByText(/(leans toward|strongly) a seller's market/i).length,
    ).toBeGreaterThan(0);
    // The underlying numbers echo the inputs, not just a label.
    expect(screen.getByText("1.5 mo")).toBeInTheDocument();
    expect(screen.getByText("8 days")).toBeInTheDocument();
    expect(screen.getByText("103%")).toBeInTheDocument();
  });

  it("renders a buyer's-market read when soft numbers are entered", () => {
    render(<MarketConditions />);
    setNumber(/months of supply/i, "9");
    setNumber(/list-to-sale ratio/i, "94");
    expect(
      screen.getAllByText(/(leans toward|strongly) a buyer's market/i).length,
    ).toBeGreaterThan(0);
  });

  it("shows a source + date node (accuracy compliance)", () => {
    render(<MarketConditions />);
    const src = screen.getByTestId("market-source");
    expect(src.textContent).toMatch(/manual/i);
    expect(src.textContent).toMatch(/As of \d{4}-\d{2}-\d{2}/);
  });

  it("screens protected-class phrasing out of the market-notes field (FHA)", () => {
    render(<MarketConditions />);
    const notes = screen.getByPlaceholderText(/inventory rising/i);
    fireEvent.change(notes, {
      target: { value: "great for Christian families" },
    });
    // screenText redacts protected-class terms; the raw phrase must not persist.
    expect((notes as HTMLTextAreaElement).value).not.toMatch(/Christian/i);
  });

  it("read copy carries no imperative price directive (UPL)", () => {
    render(<MarketConditions />);
    setNumber(/months of supply/i, "1.5");
    setNumber(/list-to-sale ratio/i, "103");
    expect(screen.queryByText(/offer above ask/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you should offer/i)).not.toBeInTheDocument();
  });
});
