import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { flattenedSteps, getStep, stepNeighbors } from "@/lib/journey";
import { getTerms } from "@/lib/glossary";
import { StepChecklist } from "@/components/step-checklist";
import { StateAwareCallout, type StateTopic } from "@/components/state-aware-callout";

/**
 * Steps whose guidance depends on the buyer's state. Maps to the topic the
 * state-aware callout should surface. Keyed by `${stageSlug}/${stepSlug}` or by
 * stage slug alone (applies to every step in that stage).
 */
const STATE_TOPICS: Record<string, StateTopic> = {
  "title-and-escrow": "closing",
  "closing-settlement": "closing",
  "search/understand-disclosures": "disclosure",
};

function stateTopicFor(stageSlug: string, stepSlug: string): StateTopic | undefined {
  return STATE_TOPICS[`${stageSlug}/${stepSlug}`] ?? STATE_TOPICS[stageSlug];
}

export function generateStaticParams() {
  return flattenedSteps().map(({ stage, step }) => ({
    stage: stage.slug,
    step: step.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string; step: string }>;
}): Promise<Metadata> {
  const { stage, step } = await params;
  const found = getStep(stage, step);
  if (!found) return { title: "Step not found" };
  return { title: found.step.title, description: found.step.summary };
}

export default async function StepPage({
  params,
}: {
  params: Promise<{ stage: string; step: string }>;
}) {
  const { stage: stageSlug, step: stepSlug } = await params;
  const found = getStep(stageSlug, stepSlug);
  if (!found) notFound();
  const { stage, step } = found;
  const { prev, next } = stepNeighbors(stageSlug, stepSlug);
  const relatedTerms = step.terms ? getTerms(step.terms) : [];
  const stateTopic = stateTopicFor(stage.slug, step.slug);

  return (
    <div className="container-page py-12 lg:py-16">
      <nav className="text-sm text-ink-muted">
        <Link href="/journey" className="hover:text-brand-700">Journey</Link>
        {" / "}
        <Link href={`/journey/${stage.slug}`} className="hover:text-brand-700">
          {stage.title}
        </Link>
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Stage {stage.order}: {stage.title}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{step.title}</h1>
          <p className="mt-3 text-lg text-ink-soft">{step.summary}</p>
          {step.timeline ? (
            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-ink-soft">
              ⏱ {step.timeline}
            </p>
          ) : null}

          <div className="prose-custom mt-6 space-y-4 text-ink-soft leading-relaxed">
            {step.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {step.whyItMatters ? (
            <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50 p-4">
              <p className="text-sm font-semibold text-brand-800">Why this matters</p>
              <p className="mt-1 text-sm text-brand-900">{step.whyItMatters}</p>
            </div>
          ) : null}

          {step.withoutAnAgent ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-ink">
                🔑 Doing this without an agent
              </p>
              <p className="mt-1 text-sm text-ink-soft">{step.withoutAnAgent}</p>
            </div>
          ) : null}

          {stateTopic ? (
            <div className="mt-4">
              <StateAwareCallout topic={stateTopic} />
            </div>
          ) : null}

          {step.resources && step.resources.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Helpful resources
              </h3>
              <ul className="mt-2 space-y-2">
                {step.resources.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {r.label} ↗
                    </a>
                    {r.description ? (
                      <span className="text-sm text-ink-muted"> — {r.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
            {prev ? (
              <Link
                href={`/journey/${prev.stage.slug}/${prev.step.slug}`}
                className="btn-secondary"
              >
                ← {prev.step.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/journey/${next.stage.slug}/${next.step.slug}`}
                className="btn-primary text-right"
              >
                {next.step.title} →
              </Link>
            ) : (
              <Link href="/journey" className="btn-primary">
                Back to journey ✓
              </Link>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          <StepChecklist stageSlug={stage.slug} stepSlug={step.slug} tasks={step.tasks} />

          {relatedTerms.length > 0 ? (
            <div className="card">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Terms on this step
              </h3>
              <dl className="mt-3 space-y-3">
                {relatedTerms.map((t) => (
                  <div key={t.slug}>
                    <dt className="font-semibold text-ink">{t.term}</dt>
                    <dd className="text-sm text-ink-soft">{t.definition}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/glossary"
                className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                Full glossary →
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
