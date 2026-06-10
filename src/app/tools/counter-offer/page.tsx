import type { Metadata } from "next";
import { CounterOfferTracker } from "@/components/tools/counter-offer-tracker";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Counter-offer tracker",
  description:
    "Track each round of price and term changes during negotiation, see the current live terms, and keep your walk-away max private. Facts only.",
};

export default function CounterOfferPage() {
  return (
    <ToolPageHeader
      title="Counter-offer tracker"
      intro={
        <>
          Negotiation moves fast. Log each round — who moved, the price, term
          changes, and status — to see the current live terms at a glance and
          keep your private max in view.
        </>
      }
    >
      <CounterOfferTracker />
    </ToolPageHeader>
  );
}
