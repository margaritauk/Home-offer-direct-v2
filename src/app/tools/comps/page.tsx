import type { Metadata } from "next";
import { CompsWorksheet } from "@/components/tools/comps-worksheet";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { Term } from "@/components/term";

export const metadata: Metadata = {
  title: "Comps worksheet",
  description:
    "Enter comparable sales to estimate a fair-value range for a home before you make an offer. An estimate, not an appraisal.",
};

export default function CompsPage() {
  return (
    <ToolPageHeader
      title="Comps worksheet"
      intro={
        <>
          Ground your offer in recent comparable sales. Enter the subject home
          and a few <Term slug="comps">comps</Term>, adjust for differences, and
          see an estimated fair-value range based on adjusted price per square
          foot.
        </>
      }
    >
      <CompsWorksheet />
    </ToolPageHeader>
  );
}
