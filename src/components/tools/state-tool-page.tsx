import Link from "next/link";
import type { ReactNode } from "react";
import { SetStateOnVisit } from "@/components/set-state-on-visit";
import { SourceStamp } from "@/components/source-stamp";
import { StatePicker } from "@/components/state-picker";
import {
  buildStateToolPageData,
  buildStateToolPageJsonLd,
  type StateToolSlug,
} from "@/lib/states/tool-pages";
import type { StateProfile } from "@/lib/states/types";

/**
 * Shared layout for a generated "…in <state>" tool page (S7-SEO1).
 *
 * Server component. Renders, in order: the embedded WORKING tool ABOVE THE FOLD
 * (passed as children) under the "…in <state>" heading, a keyboard-reachable
 * "Start your <state> journey" activation CTA, objective state facts (each with
 * a {@link SourceStamp}), and structured data (JSON-LD) for AI-Overview
 * resilience — never pure prose.
 *
 * When `profile` is `null` (empty/unknown-state param), it renders a sensible
 * default: the tool still works, plus a state picker prompt. Invalid slugs are
 * 404'd by the route before reaching here.
 *
 * FHA: only objective, allowlisted state facts are surfaced (the page data is
 * projected by `buildStateToolPageData`, which reads allowlisted fields only).
 */
export function StateToolPage({
  slug,
  profile,
  children,
}: {
  slug: StateToolSlug;
  profile: StateProfile | null;
  children: ReactNode;
}) {
  // Empty / unknown state → sensible default + state picker (no crash, no 404).
  if (!profile) {
    return (
      <div className="container-page py-12 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {slug === "savings-calculator"
              ? "Commission savings calculator"
              : "How home closing works in your state"}
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Pick your state to tailor this tool, or use it with the defaults
            below.
          </p>
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-800">
              📍 Choose your state
            </p>
            <StatePicker label="Your state" className="mt-2 max-w-sm" />
          </div>
        </div>
        <div className="mt-8">{children}</div>
        <div className="mt-10">
          <Link href="/journey" className="btn-primary">
            Start your home-buying journey →
          </Link>
        </div>
      </div>
    );
  }

  const data = buildStateToolPageData(slug, profile);
  const jsonLd = buildStateToolPageJsonLd(data);

  return (
    <div className="container-page py-12 lg:py-16">
      <SetStateOnVisit code={profile.code} />
      {/* Structured data for AI-Overview resilience (interactive tool + facts). */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-ink-muted">
        <Link href="/tools" className="hover:text-brand-700">
          Tools
        </Link>
        {" / "}
        <Link
          href={`/states/${profile.code.toLowerCase()}`}
          className="hover:text-brand-700"
        >
          {profile.name}
        </Link>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{data.heading}</h1>
        <p className="mt-3 text-lg text-ink-soft">{data.intro}</p>
      </div>

      {/* The WORKING tool, above the fold. */}
      <div className="mt-8">{children}</div>

      {/* Activation CTA — keyboard-reachable, descriptive (not "click here"). */}
      <div className="mt-10">
        <Link
          href={data.cta.href}
          className="btn-primary inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {data.cta.label} →
        </Link>
      </div>

      {/* Objective state facts, each sourced + as-of dated (SourceStamp). */}
      {data.facts.length > 0 ? (
        <section
          aria-label={`Objective ${profile.name} facts`}
          className="mt-12 max-w-2xl"
        >
          <h2 className="text-xl font-semibold">
            What&apos;s different in {profile.name}
          </h2>
          <dl className="mt-4 space-y-4">
            {data.facts.map((f) => (
              <div key={f.label} className="border-t border-slate-200 pt-3">
                <dt className="text-sm font-semibold text-ink">{f.label}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{f.value}</dd>
              </div>
            ))}
          </dl>
          <SourceStamp
            className="mt-4"
            asOf="2026-01-01"
            source={`HomeOffer Direct state legal engine — confirm against ${profile.name}'s current rules`}
          />
          <Link
            href={`/states/${profile.code.toLowerCase()}`}
            className="mt-3 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
          >
            Full {profile.name} guide &amp; official sources →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
