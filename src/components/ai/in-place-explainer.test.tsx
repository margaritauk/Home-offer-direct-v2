import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const PROPS = {
  endpoint: "/api/offer/price-band/explain",
  body: { foo: 1 },
  buttonLabel: "Explain my suggested range (AI)",
  ariaLabel: "Explain my suggested price range (AI)",
  loudLabel:
    "AI-generated, educational only — a range, not advice, and not a number to offer",
  restatesNote: "This summary only restates the comps + market range above.",
  handoffHref: "https://example.org",
  handoffLabel: "Talk to a licensed attorney",
} as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("InPlaceExplainer (AI2 default-OFF 'Coming soon')", () => {
  it("renders the 'Coming soon' pill and NO button when the flag is unset", async () => {
    // NEXT_PUBLIC_AI_EXPLAINER unset → default off.
    const { InPlaceExplainer } = await import("./in-place-explainer");
    render(<InPlaceExplainer {...PROPS} />);

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /explain my suggested range/i }),
    ).not.toBeInTheDocument();
    // No LOUD label until the feature is on and run.
    expect(
      screen.queryByText(/not a number to offer/i),
    ).not.toBeInTheDocument();
  });

  it("offers the action under the conservative LOUD label when the flag is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_EXPLAINER", "true");
    vi.resetModules();
    const { InPlaceExplainer } = await import("./in-place-explainer");
    render(<InPlaceExplainer {...PROPS} />);

    // The action button is offered (server still gates independently).
    expect(
      screen.getByRole("button", { name: /explain my suggested range/i }),
    ).toBeInTheDocument();
    // The "Coming soon" pill is gone once the surface is offered.
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("shows the conservative 'restates / you decide' label after a successful call", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_EXPLAINER", "true");
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          available: true,
          explanation: {
            text: "Comps suggest a range of $380,000–$420,000; you decide.",
          },
        }),
        { status: 200 },
      ),
    );
    const { InPlaceExplainer } = await import("./in-place-explainer");
    render(<InPlaceExplainer {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: /explain my suggested range/i }),
    );

    // The LOUD label + the model's range narration appear.
    expect(
      await screen.findByText(/a range, not advice, and not a number to offer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/comps suggest a range/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only restates the comps \+ market range above/i),
    ).toBeInTheDocument();
  });

  it("degrades gracefully when the server reports unavailable (default-off route)", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_EXPLAINER", "true");
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ available: false }), { status: 200 }),
    );
    const { InPlaceExplainer } = await import("./in-place-explainer");
    render(<InPlaceExplainer {...PROPS} />);

    fireEvent.click(
      screen.getByRole("button", { name: /explain my suggested range/i }),
    );

    expect(
      await screen.findByText(/isn't available right now/i),
    ).toBeInTheDocument();
  });
});
