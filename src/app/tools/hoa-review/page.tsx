import type { Metadata } from "next";
import { HoaReview } from "@/components/tools/hoa-review";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "HOA / condo document review",
  description:
    "A checklist for the HOA/condo resale packet — reserves and budget, special assessments, CC&Rs and rules, litigation, rental caps, master and owner insurance, dues, and condo warrantability — so you don't miss a special assessment or a financing red flag an agent would catch. Facts and questions only; have your attorney review the governing documents.",
};

export default function HoaReviewPage() {
  return (
    <ToolPageHeader
      title="HOA / condo document review"
      intro={
        <>
          Agents read the HOA/condo resale packet for red flags — reserves, a
          pending special assessment, a rental cap, or a financing gotcha — and
          turn them into questions. This worksheet walks the same categories and
          captures what to ask. It surfaces the red flags, never whether the
          documents are legally sufficient — have your attorney review the
          governing documents.
        </>
      }
    >
      <HoaReview />
    </ToolPageHeader>
  );
}
