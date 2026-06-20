"use client";

import { useToolData } from "@/hooks/use-tool-data";
import { toolHasData, toolIdForHref } from "@/lib/journey/navigation";

/**
 * Per-tool "you've saved data here" dot for the `/tools` index (Item 2 / S0b).
 * A tiny client island so the index page stays server-rendered. Shows an
 * icon + text ("✓ Saved"), never color alone, and only when the tool's
 * `useStageTool` blob has non-empty data ({@link toolHasData}) — opening a tool
 * is NOT progress.
 */
export function ToolSavedDot({ href }: { href: string }) {
  const { toolData, hydrated } = useToolData();
  if (!hydrated) return null;
  const toolId = toolIdForHref(href);
  if (!toolId || !toolHasData(toolId, toolData[toolId])) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
      <span aria-hidden>✓</span> Saved
    </span>
  );
}
