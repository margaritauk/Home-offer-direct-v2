import type { Metadata } from "next";
import { InspectionFindings } from "@/components/tools/inspection-findings";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Inspection findings logger",
  description:
    "Log home-inspection findings by severity and cost, decide which to act on, and see a fact-based summary. Not a substitute for a licensed inspector.",
};

export default function InspectionPage() {
  return (
    <ToolPageHeader
      title="Inspection findings logger"
      intro={
        <>
          After your inspection, log each finding with a severity and estimated
          cost, decide how to handle it, and get a clear summary to negotiate
          from facts.
        </>
      }
    >
      <InspectionFindings />
    </ToolPageHeader>
  );
}
