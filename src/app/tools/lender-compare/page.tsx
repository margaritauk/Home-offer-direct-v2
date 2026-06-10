import type { Metadata } from "next";
import { LenderCompare } from "@/components/tools/lender-compare";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Lender comparison",
  description:
    "Compare your own lender Loan Estimates side by side by total cost over a horizon — not just the lowest rate. Education, not a rate offer.",
};

export default function LenderComparePage() {
  return (
    <ToolPageHeader
      title="Lender comparison"
      intro={
        <>
          The lowest rate isn&apos;t always the best deal once points and fees
          are in the picture. Transcribe the numbers from your own Loan Estimates
          to compare lenders by total cost over the time you expect to keep the
          loan.
        </>
      }
    >
      <LenderCompare />
    </ToolPageHeader>
  );
}
