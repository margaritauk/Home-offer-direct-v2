import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyField, NumberField } from "./fields";

describe("CurrencyField", () => {
  it("shows an empty box (not '0') when the value is 0, so the zero is deletable", () => {
    render(
      <CurrencyField label="Purchase price" explainer="" value={0} onChange={() => {}} hydrated />,
    );
    expect((screen.getByLabelText("Purchase price") as HTMLInputElement).value).toBe("");
  });

  it("formats the value with thousands separators", () => {
    render(
      <CurrencyField label="Purchase price" explainer="" value={700000} onChange={() => {}} hydrated />,
    );
    expect((screen.getByLabelText("Purchase price") as HTMLInputElement).value).toBe("700,000");
  });

  it("parses typed input (commas/letters stripped) to a number", () => {
    const onChange = vi.fn();
    render(
      <CurrencyField label="Purchase price" explainer="" value={0} onChange={onChange} hydrated />,
    );
    fireEvent.change(screen.getByLabelText("Purchase price"), { target: { value: "700,000" } });
    expect(onChange).toHaveBeenCalledWith(700000);
  });

  it("emits 0 when cleared", () => {
    const onChange = vi.fn();
    render(
      <CurrencyField label="Purchase price" explainer="" value={500000} onChange={onChange} hydrated />,
    );
    fireEvent.change(screen.getByLabelText("Purchase price"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

describe("NumberField", () => {
  it("lets the user clear the field (delete the 0) while editing", () => {
    const onChange = vi.fn();
    render(
      <NumberField label="Down payment" explainer="" value={0} onChange={onChange} hydrated />,
    );
    const input = screen.getByLabelText("Down payment") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
