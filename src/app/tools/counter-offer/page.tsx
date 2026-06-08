import type { Metadata } from "next";
import { CounterOfferTracker } from "@/components/tools/counter-offer-tracker";

export const metadata: Metadata = {
  title: "Counter-offer tracker",
  description:
    "Track each round of price and term changes during negotiation, see the current live terms, and keep your walk-away max private. Facts only.",
};

export default function CounterOfferPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Counter-offer tracker</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Negotiation moves fast. Log each round — who moved, the price, term
          changes, and status — to see the current live terms at a glance and
          keep your private max in view.
        </p>
      </div>
      <div className="mt-8">
        <CounterOfferTracker />
      </div>
    </div>
  );
}
