import Link from "next/link";
import { stageToolsFor } from "@/lib/journey/navigation";

/**
 * "Tools for this step" block (#86): renders the cross-cutting tools mapped to a
 * journey stage, in-context on the step page so the buyer doesn't detour to the
 * top nav. Data-driven from `STAGE_TOOLS` (lib/journey/navigation) and omitted
 * cleanly when a stage has no mapped tools. Server component — pure render.
 */
export function StageToolLinks({ stageSlug }: { stageSlug: string }) {
  const tools = stageToolsFor(stageSlug);
  if (tools.length === 0) return null;

  return (
    <section
      aria-label="Tools for this step"
      className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Tools for this step
      </h2>
      <ul className="mt-3 space-y-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300"
            >
              <span className="min-w-0">
                <span className="font-medium text-ink">{tool.label}</span>
                {tool.description ? (
                  <span className="block text-sm text-ink-soft">
                    {tool.description}
                  </span>
                ) : null}
              </span>
              <span aria-hidden className="whitespace-nowrap font-medium text-brand-700">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
