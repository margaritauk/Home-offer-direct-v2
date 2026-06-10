import type { Metadata } from "next";
import { ClearToClose } from "@/components/tools/clear-to-close";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Clear-to-close tracker & low-appraisal calculator",
  description:
    "Track your path to clear-to-close and run the numbers if the appraisal comes in low. Estimates, not lending advice.",
};

export default function ClearToClosePage() {
  return (
    <ToolPageHeader
      title="Clear-to-close tracker & low-appraisal calculator"
      intro={
        <>
          Follow your loan from appraisal to final approval, and if the
          appraisal comes in low, see the gap and the cash impact of each option
          framed neutrally.
        </>
      }
    >
      <ClearToClose />
    </ToolPageHeader>
  );
}
