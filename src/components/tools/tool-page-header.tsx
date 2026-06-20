import Link from "next/link";
import { ToolJourneyFooter } from "./tool-journey-footer";

/**
 * Shared shell for every `/tools/*` page (UX audit IA fix). Renders the standard
 * container + title/intro block each tool page used to hand-roll, plus a
 * back-to-catalog affordance so buyers always have a way back to the full tools
 * index (the audit's missing-breadcrumb finding).
 *
 * A tool page becomes:
 *   <ToolPageHeader title="…" intro="…">
 *     <TheToolComponent />
 *   </ToolPageHeader>
 */
export interface ToolPageHeaderProps {
  title: string;
  intro: React.ReactNode;
  /** Where the back link points. Defaults to the tools catalog. Pass `null`-ish
   * by overriding with the catalog page's own value is unnecessary — the index
   * page simply doesn't use this component. */
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function ToolPageHeader({
  title,
  intro,
  backHref = "/tools",
  backLabel = "All tools",
  children,
}: ToolPageHeaderProps) {
  return (
    <div className="container-page py-12 lg:py-16">
      {backHref ? (
        <Link
          href={backHref}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg text-ink-soft">{intro}</p>
      </div>
      <div className="mt-8">{children}</div>
      <ToolJourneyFooter />
    </div>
  );
}
