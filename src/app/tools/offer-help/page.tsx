import type { Metadata } from "next";
import { OfferTactics } from "@/components/offer/offer-tactics";
import { CompetitiveOfferTactics } from "@/components/offer/competitive-offer-tactics";
import { NegotiationPlaybook } from "@/components/offer/negotiation-playbook";
import { StateFormHandoff } from "@/components/offer/state-form-handoff";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Offer help — tactics, forms & attorney review",
  description:
    "Model escalation clauses and offer-time appraisal-gap coverage, learn multiple-offer levers and a negotiation playbook, find the public state form (where one exists), and hand off to a flat-fee real estate attorney. Education only, not legal advice.",
};

export default function OfferHelpPage() {
  return (
    <ToolPageHeader
      title="Offer help — tactics, forms & attorney review"
      intro={
        <>
          The tactics buyers use to win competitive offers, what&apos;s publicly
          available for your state, and how to hand off to a flat-fee attorney who
          drafts and reviews the actual contract. Education only — we never
          generate a ready-to-sign contract or tell you what to waive.
        </>
      }
    >
      <div className="max-w-4xl space-y-12">
        <OfferTactics />
        <CompetitiveOfferTactics />
        <NegotiationPlaybook />
        <StateFormHandoff />
      </div>
    </ToolPageHeader>
  );
}
