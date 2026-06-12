import type { Metadata } from "next";
import { DisclosureReview } from "@/components/tools/disclosure-review";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Seller-disclosure review",
  description:
    "A state-aware checklist that turns the seller's disclosure into the red-flag questions an agent would ask — water, roof, foundation, systems, environmental (including the federal pre-1978 lead overlay), HOA, and more. Facts and questions only; have your attorney/inspector confirm.",
};

export default function DisclosureReviewPage() {
  return (
    <ToolPageHeader
      title="Seller-disclosure review"
      intro={
        <>
          Agents read the seller&apos;s disclosure for red flags and turn them
          into questions. This worksheet does the same, tailored to your
          state&apos;s disclosure regime — and it&apos;s honest where the law asks
          sellers to disclose very little. It surfaces what to ask, never whether
          a disclosure is legally sufficient.
        </>
      }
    >
      <DisclosureReview />
    </ToolPageHeader>
  );
}
