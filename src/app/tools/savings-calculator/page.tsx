import type { Metadata } from "next";
import { SavingsCalculator } from "@/components/savings-calculator";
import { TrustCallout } from "@/components/trust-callout";

export const metadata: Metadata = {
  title: "Commission savings calculator",
  description:
    "Estimate how much of the buyer-side commission you could capture by buying without an agent — and what your cash to close looks like.",
};

export default function SavingsCalculatorPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Commission savings calculator</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Buying without a buyer&apos;s agent puts roughly 2.5% of the price back
          in play. But it&apos;s only yours if you negotiate it into a price
          reduction or closing credit. See what that&apos;s worth on your deal.
        </p>
      </div>

      <div className="mt-8">
        <SavingsCalculator />
      </div>

      <div className="mt-8 max-w-2xl">
        <TrustCallout tone="warning" title="The savings are not automatic">
          Since the 2024 NAR settlement, the buyer-side commission is negotiated
          deal-by-deal. If you&apos;re unrepresented and don&apos;t ask for it,
          the seller usually keeps it. Drag the &ldquo;capture&rdquo; slider to
          0% to see what walking away from that conversation costs you.
        </TrustCallout>
      </div>
    </div>
  );
}
