/**
 * Tool-led "…in <state>" page engine (S7-SEO1). PURE core.
 *
 * Generated, NOT hand-authored, transactional tool pages under
 * `src/app/tools/.../[state]/page.tsx`. The page route is a thin shell; ALL
 * page-data, metadata, state resolution, structured data, and the FHA allowlist
 * live here as PURE, unit-testable functions (no React, no IO).
 *
 * Each page embeds a WORKING tool above the fold + an "…in <state>" framing +
 * a "Start your <state> journey" activation CTA. Tuned for AI-Overview
 * resilience = interactive tool embed + structured data (JSON-LD), not prose.
 *
 * Compliance (FHA): SEO/page facts are OBJECTIVE ATTRIBUTES ONLY. The
 * {@link STATE_TOOL_PAGE_ALLOWLIST} is the hard allowlist of state-profile fields
 * a generated page may surface — it deliberately EXCLUDES any demographic /
 * "good schools as value" / desirability proxy. Anything not on it cannot reach
 * a page. A test asserts no such proxy is present.
 */

import type { Metadata } from "next";
import { getAllStateProfiles, getStateProfile } from "./data";
import { closingPathLabels, disclosureRegimeLabels } from "./labels";
import type { StateProfile } from "./types";

/**
 * The tool templates that get a per-state page. Each is a high-intent,
 * transactional tool reused from the shipped catalog (the tool component is
 * embedded above the fold; this engine only generates the surrounding page).
 */
export type StateToolSlug = "savings-calculator" | "closing-path";

/** Every tool that gets generated state pages. Stable, ordered. */
export const STATE_TOOL_SLUGS = [
  "savings-calculator",
  "closing-path",
] as const satisfies readonly StateToolSlug[];

/**
 * The HARD ALLOWLIST of {@link StateProfile} fields a generated tool page may
 * surface. This is an allowlist (not a denylist) on purpose: any field added to
 * the state model in the future is EXCLUDED by default until someone deliberately
 * adds it here and confirms it is an objective, neutral transaction/legal fact.
 *
 * These are all OBJECTIVE attributes — closing path, disclosure regime, transfer
 * tax, e-sign validity — i.e. how a purchase legally/operationally works in the
 * jurisdiction. Deliberately EXCLUDED: anything that is, or proxies for, a
 * demographic signal or a "desirability"/"good schools as value" judgment about
 * the state's people or neighborhoods (FHA). The state model carries no such
 * field today; this keeps the intent explicit and test-enforced.
 */
export const STATE_TOOL_PAGE_ALLOWLIST = [
  "code",
  "name",
  "closingPath",
  "attorneyRequiredAtClosing",
  "closingNote",
  "disclosureRegime",
  "disclosureFormName",
  "transferTaxNote",
  "eSignForRealEstate",
] as const satisfies readonly (keyof StateProfile)[];

export type StateToolPageAllowedKey = (typeof STATE_TOOL_PAGE_ALLOWLIST)[number];

/** Per-tool static copy (title/intro framing). PURE constant, no env. */
interface ToolTemplate {
  slug: StateToolSlug;
  /** "…in <state>" page H1, parameterized by state name. */
  heading: (stateName: string) => string;
  /** SEO `<title>`. */
  title: (stateName: string) => string;
  /** SEO meta description. */
  description: (stateName: string) => string;
  /** Short above-the-tool framing line. */
  intro: (stateName: string) => string;
  /** The thing the embedded tool helps the buyer do (for JSON-LD). */
  about: string;
}

const TOOL_TEMPLATES: Record<StateToolSlug, ToolTemplate> = {
  "savings-calculator": {
    slug: "savings-calculator",
    heading: (s) => `Commission savings calculator for ${s}`,
    title: (s) => `Commission savings calculator in ${s}`,
    description: (s) =>
      `Estimate how much of the buyer-side commission you could capture by buying a home without an agent in ${s}, and what your cash to close looks like. Free, interactive calculator.`,
    intro: (s) =>
      `Buying without a buyer's agent in ${s} can put roughly 2.5% of the price back in play — but only if you negotiate it. Run your numbers below.`,
    about: "Estimate buyer-side commission savings on a home purchase",
  },
  "closing-path": {
    slug: "closing-path",
    heading: (s) => `How home closing works in ${s}`,
    title: (s) => `Home closing path in ${s} — attorney or escrow`,
    description: (s) =>
      `See how a home purchase closes in ${s} — attorney vs. escrow/title company, seller-disclosure rules, and transfer tax — then start your buying journey. Objective, sourced state facts.`,
    intro: (s) =>
      `Closing a home purchase works differently state to state. Here's how it works in ${s}, and what to line up before you close.`,
    about: "Understand the state-specific closing path for a home purchase",
  },
};

/**
 * Resolve a `[state]` route param to a {@link StateProfile}.
 *
 * - A valid two-letter code (any case) → that profile.
 * - Empty / missing → `null` (the page renders a sensible default + state picker
 *   rather than 404 — empty is not invalid).
 * - A non-empty but UNKNOWN slug (e.g. "zz", "california") → `"invalid"` so the
 *   page calls `notFound()`.
 */
export function resolveStateParam(
  raw: string | undefined,
): StateProfile | null | "invalid" {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return null;
  const profile = getStateProfile(trimmed);
  return profile ?? "invalid";
}

/** The full param set `generateStaticParams` emits: every state × no extra. */
export function stateToolParams(): { state: string }[] {
  return getAllStateProfiles().map((s) => ({ state: s.code.toLowerCase() }));
}

/** Validate a tool slug used by a route. */
export function isStateToolSlug(slug: string): slug is StateToolSlug {
  return (STATE_TOOL_SLUGS as readonly string[]).includes(slug);
}

/**
 * The projected, FHA-safe page data for a generated state tool page. Built ONLY
 * from {@link STATE_TOOL_PAGE_ALLOWLIST} fields — no demographic/desirability
 * proxy can reach it because this function only ever reads allowlisted keys.
 */
export interface StateToolPageData {
  slug: StateToolSlug;
  stateCode: string;
  stateName: string;
  heading: string;
  intro: string;
  /** Objective, sourced state facts surfaced on the page (allowlisted only). */
  facts: { label: string; value: string }[];
  /** The activation CTA into the journey. */
  cta: { label: string; href: string };
}

/**
 * Project a state profile + tool template into the page's render data. PURE.
 * Reads ONLY allowlisted fields. For closing-path, surfaces the objective
 * closing/disclosure/transfer-tax facts; the savings calculator needs no state
 * facts beyond the name framing.
 */
export function buildStateToolPageData(
  slug: StateToolSlug,
  profile: StateProfile,
): StateToolPageData {
  const t = TOOL_TEMPLATES[slug];
  const facts: { label: string; value: string }[] = [];

  if (slug === "closing-path") {
    facts.push({
      label: "Closing path",
      value: closingPathLabels[profile.closingPath].label,
    });
    facts.push({
      label: "Attorney required at closing",
      value: profile.attorneyRequiredAtClosing ? "Yes" : "No",
    });
    facts.push({
      label: "Seller-disclosure regime",
      value: disclosureRegimeLabels[profile.disclosureRegime].label,
    });
    if (profile.disclosureFormName) {
      facts.push({
        label: "Disclosure form",
        value: profile.disclosureFormName,
      });
    }
    facts.push({ label: "Transfer tax", value: profile.transferTaxNote });
    facts.push({
      label: "E-signature for the purchase contract",
      value:
        profile.eSignForRealEstate === "valid"
          ? "Valid"
          : "Valid, with caveats",
    });
  }

  return {
    slug,
    stateCode: profile.code,
    stateName: profile.name,
    heading: t.heading(profile.name),
    intro: t.intro(profile.name),
    facts,
    cta: {
      label: `Start your ${profile.name} journey`,
      href: "/journey",
    },
  };
}

/** Build per-state SEO metadata. PURE — no IO. */
export function buildStateToolPageMetadata(
  slug: StateToolSlug,
  profile: StateProfile,
): Metadata {
  const t = TOOL_TEMPLATES[slug];
  return {
    title: t.title(profile.name),
    description: t.description(profile.name),
    alternates: {
      canonical: `/tools/${slug}/${profile.code.toLowerCase()}`,
    },
  };
}

/** Metadata when the param is empty/unknown (the picker default page). */
export function buildStateToolPageDefaultMetadata(
  slug: StateToolSlug,
): Metadata {
  const t = TOOL_TEMPLATES[slug];
  return {
    title: t.title("your state"),
    description: t.description("your state"),
  };
}

/**
 * Structured data (schema.org JSON-LD) for AI-Overview resilience: declare the
 * page as a WebApplication tool with an FAQ-style fact set, NOT prose. PURE —
 * returns a plain object the route serializes into a `<script type="ld+json">`.
 * Only objective, allowlisted facts are embedded.
 */
export function buildStateToolPageJsonLd(
  data: StateToolPageData,
): Record<string, unknown> {
  const t = TOOL_TEMPLATES[data.slug];
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebApplication",
      name: data.heading,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: t.about,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];

  if (data.facts.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: data.facts.map((f) => ({
        "@type": "Question",
        name: `${f.label} in ${data.stateName}`,
        acceptedAnswer: { "@type": "Answer", text: f.value },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
