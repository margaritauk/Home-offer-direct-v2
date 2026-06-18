import type { Metadata } from "next";
import { FinancingTracker } from "@/components/tools/financing-tracker";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Financing-milestone tracker",
  description:
    "Track your loan process — application, appraisal, underwriting conditions, and clear-to-close-by your financing date — so financing doesn't quietly blow up your deal. Educational, not lending advice.",
};

export default function FinancingPage() {
  return (
    <ToolPageHeader
      title="Financing-milestone tracker"
      intro={
        <>
          Between offer-accepted and closing, your loan is the thing most likely
          to slip. Track each step — application, appraisal, underwriting
          conditions, clear-to-close — and we&apos;ll surface the dates on your
          dashboard so you can ask your lender the right questions in time.
        </>
      }
    >
      <FinancingTracker />
    </ToolPageHeader>
  );
}
