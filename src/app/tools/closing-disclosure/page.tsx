import type { Metadata } from "next";
import { ClosingDisclosureTool } from "@/components/tools/closing-disclosure";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Closing Disclosure check",
  description:
    "Compare your Closing Disclosure against your Loan Estimate line by line, flag increases beyond CFPB tolerance limits, and confirm the 3-business-day rule date. Education, not legal or financial advice.",
};

export default function ClosingDisclosurePage() {
  return (
    <ToolPageHeader
      title="Closing Disclosure check"
      intro={
        <>
          Your Closing Disclosure (CD) should match the Loan Estimate (LE) you
          got when you applied. Enter both sets of figures to see what changed,
          catch any increase beyond the CFPB tolerance limits, and confirm the
          3-business-day review window before you sign.
        </>
      }
    >
      <ClosingDisclosureTool />
    </ToolPageHeader>
  );
}
