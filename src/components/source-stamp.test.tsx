import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceStamp } from "./source-stamp";

describe("SourceStamp", () => {
  it("renders the source and as-of date as real, screen-reader-legible text", () => {
    render(<SourceStamp asOf="2025-10-01" source="CFPB" />);
    // Real text in the DOM (not a title/tooltip attribute).
    expect(screen.getByText(/As of 2025-10-01/)).toBeInTheDocument();
    expect(screen.getByText(/CFPB/)).toBeInTheDocument();
    // Accessible prefix for screen readers.
    expect(screen.getByText(/Source and as-of date:/)).toBeInTheDocument();
  });

  it("uses ink-soft, not a tooltip-only title attribute", () => {
    const { container } = render(
      <SourceStamp asOf="2025-01-01" source="IRS Publication 936" />,
    );
    const p = container.querySelector("p");
    expect(p).not.toBeNull();
    expect(p?.className).toContain("text-ink-soft");
    expect(p?.getAttribute("title")).toBeNull();
  });

  it("merges a custom className", () => {
    const { container } = render(
      <SourceStamp asOf="2025-01-01" source="S" className="mt-2" />,
    );
    expect(container.querySelector("p")?.className).toContain("mt-2");
  });
});
