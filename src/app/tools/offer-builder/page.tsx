import type { Metadata } from "next";
import { OfferWizard } from "@/components/offer/offer-wizard";
import { TrustCallout } from "@/components/trust-callout";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { Term } from "@/components/term";

export const metadata: Metadata = {
  title: "Offer worksheet builder",
  description:
    "A step-by-step worksheet to organize all the terms of your home offer — price, earnest money, financing, contingencies, dates, and the commission-savings ask — to review with your attorney. Not a binding contract.",
};

export default function OfferBuilderPage() {
  return (
    <ToolPageHeader
      title="Offer worksheet builder"
      intro={
        <>
          Assemble a complete, well-organized offer one step at a time — price,{" "}
          <Term slug="earnest-money">earnest money</Term>, financing,{" "}
          <Term slug="contingency">contingencies</Term>, dates, and the
          commission-savings ask. Everything saves as you go, so you can leave
          and pick up where you left off.
        </>
      }
    >
      <div className="max-w-2xl">
        <TrustCallout tone="warning" title="This is a worksheet, not a contract">
          This tool helps you organize your thinking and produces a term-sheet
          summary to review with a licensed attorney. It is educational only, not
          legal advice. It will never generate a ready-to-sign contract, and it
          won&apos;t tell you which contingencies to waive — those decisions are
          yours to make with your attorney. Everything here is{" "}
          <strong>subject to attorney review</strong>.
        </TrustCallout>
      </div>

      <div className="mt-8 max-w-3xl">
        <OfferWizard />
      </div>
    </ToolPageHeader>
  );
}
