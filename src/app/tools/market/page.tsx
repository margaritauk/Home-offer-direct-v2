import type { Metadata } from "next";
import { MarketConditions } from "@/components/tools/market-conditions";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { Term } from "@/components/term";

export const metadata: Metadata = {
  title: "Market conditions",
  description:
    "Read whether your target area is a buyer's, balanced, or seller's market from the underlying numbers — days on market, list-to-sale ratio, months of supply, and price trend — with plain-English trade-offs. An estimate, not advice.",
};

export default function MarketConditionsPage() {
  return (
    <ToolPageHeader
      title="Market conditions"
      intro={
        <>
          See whether your area leans buyer&apos;s or seller&apos;s — the way an
          agent reads market temperature before sizing an offer. Enter{" "}
          <Term slug="months-of-supply">months of supply</Term>,{" "}
          <Term slug="days-on-market">days on market</Term>,{" "}
          <Term slug="list-to-sale-ratio">list-to-sale ratio</Term>, and the
          recent price trend, and get a plain-English read with the numbers behind
          it.
        </>
      }
    >
      <MarketConditions />
    </ToolPageHeader>
  );
}
