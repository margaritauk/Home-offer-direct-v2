import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlossaryList } from "./glossary-list";
import type { GlossaryTerm } from "@/lib/journey/types";

const terms: GlossaryTerm[] = [
  {
    slug: "alpha",
    term: "Alpha",
    definition: "First term.",
    related: ["beta", "ghost"], // beta exists; ghost does not
  },
  { slug: "beta", term: "Beta", definition: "Second term.", related: [] },
];

describe("GlossaryList related-terms cross-links", () => {
  it("renders related links to existing terms and drops unknown ones", () => {
    render(<GlossaryList terms={terms} />);
    const alphaCard = document.getElementById("alpha") as HTMLElement;
    const links = within(alphaCard).getAllByRole("link");
    // Only "beta" resolves; "ghost" is filtered out.
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "#beta");
    expect(links[0]).toHaveTextContent("Beta");
  });

  it("renders no Related row for a term with no (valid) related terms", () => {
    render(<GlossaryList terms={terms} />);
    const betaCard = document.getElementById("beta") as HTMLElement;
    expect(within(betaCard).queryByText(/Related:/)).toBeNull();
  });

  it("each term card has an id anchor for deep-linking", () => {
    render(<GlossaryList terms={terms} />);
    expect(document.getElementById("alpha")).toBeTruthy();
    expect(document.getElementById("beta")).toBeTruthy();
  });
});
