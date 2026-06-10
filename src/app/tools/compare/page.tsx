import type { Metadata } from "next";
import { CompareHomes } from "@/components/tools/compare-homes";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Compare homes",
  description:
    "Compare 2–4 homes side by side on the facts that matter — price, $/sqft, beds/baths, days on market, and your own tour scores. Facts only, no steering.",
};

export default function ComparePage() {
  return (
    <ToolPageHeader
      title="Compare homes"
      intro={
        <>
          Pick a few homes from listings or your tracked showings and line up the
          facts: price, price per square foot, beds and baths, square footage,
          days on market, and your own tour score when you have one.
        </>
      }
    >
      <CompareHomes />
    </ToolPageHeader>
  );
}
