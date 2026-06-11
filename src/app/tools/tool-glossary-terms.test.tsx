import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { glossaryBySlug } from "@/lib/glossary";

// Tool components persist state via useStageTool; back it with plain React state
// so the pages render without touching localStorage (same pattern as the
// individual tool component tests).
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

import BudgetPage from "./budget/page";
import CompsPage from "./comps/page";
import ClosingDisclosurePage from "./closing-disclosure/page";

// Each case: render a representative tool page and assert its intro wired at
// least one <Term> trigger (a real <button>) whose slug resolves in the glossary.
const cases: Array<{
  name: string;
  Page: () => React.ReactNode;
  trigger: string;
  slug: string;
}> = [
  { name: "budget", Page: BudgetPage, trigger: "PITI", slug: "piti" },
  { name: "comps", Page: CompsPage, trigger: "comps", slug: "comps" },
  {
    name: "closing-disclosure",
    Page: ClosingDisclosurePage,
    trigger: "Closing Disclosure (CD)",
    slug: "closing-disclosure",
  },
];

describe("tool pages wire <Term> glossary triggers", () => {
  it.each(cases)(
    "$name renders a Term trigger that resolves via glossaryBySlug",
    ({ Page, trigger, slug }) => {
      render(<Page />);

      // The <Term> primitive renders a real <button> around the term text.
      const button = screen.getByRole("button", { name: trigger });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("underline");

      // And the slug it was given actually exists in the glossary.
      expect(glossaryBySlug[slug]).toBeDefined();
      expect(glossaryBySlug[slug].definition.trim().length).toBeGreaterThan(0);
    },
  );
});
