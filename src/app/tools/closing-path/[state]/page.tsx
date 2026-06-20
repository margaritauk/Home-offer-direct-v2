import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StateToolPage } from "@/components/tools/state-tool-page";
import { ClosingDayTool } from "@/components/tools/closing-day";
import {
  buildStateToolPageDefaultMetadata,
  buildStateToolPageMetadata,
  resolveStateParam,
  stateToolParams,
} from "@/lib/states/tool-pages";

const SLUG = "closing-path" as const;

export function generateStaticParams() {
  return stateToolParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveStateParam(state);
  if (resolved === "invalid") return { title: "State not found" };
  if (resolved === null) return buildStateToolPageDefaultMetadata(SLUG);
  return buildStateToolPageMetadata(SLUG, resolved);
}

export default async function ClosingPathStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const resolved = resolveStateParam(state);
  // Invalid (non-empty, unknown) slug → 404. Empty → default + picker.
  if (resolved === "invalid") notFound();

  return (
    <StateToolPage slug={SLUG} profile={resolved}>
      <ClosingDayTool />
    </StateToolPage>
  );
}
