import type { Metadata } from "next";
import { StateToolPage } from "@/components/tools/state-tool-page";
import { SavingsCalculator } from "@/components/savings-calculator";
import { TrustCallout } from "@/components/trust-callout";
import {
  buildStateToolPageDefaultMetadata,
  buildStateToolPageMetadata,
  resolveStateParam,
  stateToolParams,
} from "@/lib/states/tool-pages";
import { notFound } from "next/navigation";

const SLUG = "savings-calculator" as const;

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

export default async function SavingsCalculatorStatePage({
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
      <SavingsCalculator />
      <div className="mt-8 max-w-2xl">
        <TrustCallout tone="warning" title="The savings are not automatic">
          Since the 2024 NAR settlement, the buyer-side commission is negotiated
          deal-by-deal. If you&apos;re unrepresented and don&apos;t ask for it,
          the seller usually keeps it. Drag the &ldquo;capture&rdquo; slider to
          0% to see what walking away from that conversation costs you.
        </TrustCallout>
      </div>
    </StateToolPage>
  );
}
