import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStage, getStages } from "@/lib/journey";

export function generateStaticParams() {
  return getStages().map((s) => ({ stage: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}): Promise<Metadata> {
  const { stage: slug } = await params;
  const stage = getStage(slug);
  if (!stage) return { title: "Stage not found" };
  return { title: stage.title, description: stage.description };
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: slug } = await params;
  const stage = getStage(slug);
  if (!stage) notFound();

  return (
    <div className="container-page py-12 lg:py-16">
      <Link href="/journey" className="text-sm font-medium text-brand-600 hover:underline">
        ← All stages
      </Link>

      <div className="mt-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl" aria-hidden>
            {stage.icon}
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Stage {stage.order}
              {stage.timeline ? ` · ${stage.timeline}` : ""}
            </p>
            <h1 className="text-3xl font-bold">{stage.title}</h1>
          </div>
        </div>
        <p className="mt-4 text-lg text-ink-soft">{stage.description}</p>
      </div>

      <ol className="mt-10 space-y-4">
        {stage.steps.map((step, i) => (
          <li key={step.slug}>
            <Link
              href={`/journey/${stage.slug}/${step.slug}`}
              className="card flex items-start gap-4 transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{step.summary}</p>
                {step.timeline ? (
                  <p className="mt-2 text-xs text-ink-muted">⏱ {step.timeline}</p>
                ) : null}
              </div>
              <span className="self-center text-brand-600">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
