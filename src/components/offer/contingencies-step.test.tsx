import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyOffer } from "@/hooks/use-offer";
import { CONTINGENCIES } from "@/lib/offer/contingencies";
import { ContingenciesStep } from "./contingencies-step";

const sample = CONTINGENCIES[0];

describe("ContingenciesStep", () => {
  it("reports toggling a contingency on/off", () => {
    const contingencies = emptyOffer().contingencies;
    const onChange = vi.fn();
    render(
      <ContingenciesStep
        contingencies={contingencies}
        onChange={onChange}
        hydrated
      />,
    );
    fireEvent.click(screen.getByLabelText(`Include ${sample.label}`));
    expect(onChange).toHaveBeenCalledWith(sample.id, {
      included: !contingencies[sample.id].included,
    });
  });

  it("shows the window field only when the contingency is included", () => {
    const contingencies = {
      ...emptyOffer().contingencies,
      [sample.id]: { included: false, days: 10 },
    };
    const { rerender } = render(
      <ContingenciesStep
        contingencies={contingencies}
        onChange={() => {}}
        hydrated
      />,
    );
    expect(
      screen.queryByLabelText(`${sample.label} window in days`),
    ).toBeNull();

    rerender(
      <ContingenciesStep
        contingencies={{
          ...contingencies,
          [sample.id]: { included: true, days: 10 },
        }}
        onChange={() => {}}
        hydrated
      />,
    );
    expect(
      screen.getByLabelText(`${sample.label} window in days`),
    ).toBeInTheDocument();
  });

  it("reports a changed contingency window in days", () => {
    const contingencies = {
      ...emptyOffer().contingencies,
      [sample.id]: { included: true, days: 10 },
    };
    const onChange = vi.fn();
    render(
      <ContingenciesStep
        contingencies={contingencies}
        onChange={onChange}
        hydrated
      />,
    );
    fireEvent.change(
      screen.getByLabelText(`${sample.label} window in days`),
      { target: { value: "14" } },
    );
    expect(onChange).toHaveBeenCalledWith(sample.id, { days: 14 });
  });
});
