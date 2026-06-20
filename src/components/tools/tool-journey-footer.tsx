"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  journeyAnchorForTool,
  toolLabelForHref,
} from "@/lib/journey/navigation";
import { useLastPosition } from "@/hooks/use-last-position";

/**
 * The shared "back to your journey / next step" footer rendered at the bottom of
 * every `/tools/*` page (UX continuity, Item 2 / S0a — the keystone that kills
 * every tool dead-end, the scorecard included).
 *
 * It's hosted by {@link ToolPageHeader}, so every tool gets it with zero
 * per-tool edits. It reads its own `usePathname()` (an explicit `toolHref` prop
 * overrides, for testing) and resolves the links via the pure, unit-tested
 * {@link journeyAnchorForTool}:
 *  - mapped tool → "← Back to <stage>" + a prominent "Next: <step> →"
 *  - final-stage tool → "← Back to <stage>" + "Back to journey ✓"
 *  - UNMAPPED tool → a single back-link to `/journey` (no dead-end, ever)
 *
 * A `<nav aria-label="Journey navigation">` with the back link first and the
 * next link visually prominent; ≥44px tap targets; stacks on mobile and adds
 * bottom padding so it clears the fixed mobile tab bar.
 */
export function ToolJourneyFooter({ toolHref }: { toolHref?: string }) {
  const pathname = usePathname();
  const href = toolHref ?? pathname ?? "";
  const anchor = journeyAnchorForTool(href);
  const { record } = useLastPosition();

  // Persist this tool as the buyer's last position (resume target). Label is an
  // app-controlled tool title — never user free-text (FHA/UPL).
  useEffect(() => {
    if (!href.startsWith("/tools/")) return;
    record({
      kind: "tool",
      href,
      label: toolLabelForHref(href) ?? "your last tool",
    });
    // record identity is stable; re-run only when the tool href changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href]);

  return (
    <nav
      aria-label="Journey navigation"
      className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 pb-[env(safe-area-inset-bottom)] sm:flex-row sm:items-center sm:justify-between"
    >
      {anchor ? (
        <>
          <Link
            href={anchor.backHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium text-brand-700 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
          >
            ← {anchor.backLabel}
          </Link>
          <Link
            href={anchor.nextHref}
            className="btn-primary inline-flex min-h-[44px] items-center justify-center"
          >
            {anchor.nextLabel} →
          </Link>
        </>
      ) : (
        <Link
          href="/journey"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium text-brand-700 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
        >
          ← Back to your journey
        </Link>
      )}
    </nav>
  );
}
