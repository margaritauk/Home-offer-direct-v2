import type { Metadata } from "next";
import { CriteriaWorksheet } from "@/components/tools/criteria-worksheet";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Needs & criteria worksheet",
  description:
    "Sort your home search into must-haves, nice-to-haves, and deal-breakers — beds/baths, commute, budget ceiling, condition tolerance, property type, timeline — then carry your criteria into the Tour Scorecard so every home is scored against your own priorities. Objective property facts only.",
};

export default function NeedsPage() {
  return (
    <ToolPageHeader
      title="Needs & criteria worksheet"
      intro={
        <>
          A buyer consultation starts by separating must-haves from nice-to-haves
          and deal-breakers — so your search stays disciplined and your tours are
          scored against your own criteria, not the listing&apos;s sales copy.
          Keep it to objective property and logistics facts.
        </>
      }
    >
      <CriteriaWorksheet />
    </ToolPageHeader>
  );
}
