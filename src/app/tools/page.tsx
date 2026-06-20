import type { Metadata } from "next";
import Link from "next/link";
import { toolsByStage } from "@/lib/journey/navigation";
import { ToolSavedDot } from "@/components/tools/tool-saved-dot";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Every HomeOffer Direct tool in one place, grouped by where it helps in your home-buying journey — from budgeting and comps to inspections, closing, and move-in.",
};

export default function ToolsIndexPage() {
  const groups = toolsByStage();
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Tools</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Every tool, grouped by where it helps in your journey. Jump straight to
          the one you need, or follow them in order as you go.
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {groups.map((group) => (
          <section key={group.stageSlug}>
            <h2 className="text-xl font-semibold">{group.stageTitle}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="card block h-full transition hover:border-brand-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{tool.label}</p>
                      <ToolSavedDot href={tool.href} />
                    </div>
                    {tool.description ? (
                      <p className="mt-2 text-sm text-ink-soft">
                        {tool.description}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
