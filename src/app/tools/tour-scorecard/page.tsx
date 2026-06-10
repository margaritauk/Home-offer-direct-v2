import type { Metadata } from "next";
import { TourScorecard } from "@/components/tools/tour-scorecard";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Tour scorecard",
  description:
    "Score each home you tour on a consistent weighted rubric so you can compare them objectively later. An estimate aid, not advice.",
};

export default function TourScorecardPage() {
  return (
    <ToolPageHeader
      title="Tour scorecard"
      intro={
        <>
          Touring several homes blurs together fast. Score each one on the same
          rubric — location, condition, layout, price-vs-value, light, outdoor
          space, commute — and compare the weighted totals side by side.
        </>
      }
    >
      <TourScorecard />
    </ToolPageHeader>
  );
}
