import type { Metadata } from "next";
import { OfferTactics } from "@/components/offer/offer-tactics";
import { StateFormHandoff } from "@/components/offer/state-form-handoff";

export const metadata: Metadata = {
  title: "Offer help — tactics, forms & attorney review",
  description:
    "Understand advanced offer tactics — escalation clauses, appraisal-gap coverage, as-is offers, and rent-backs — and find the public state form (where one exists) before handing off to a flat-fee real estate attorney. Education only, not legal advice.",
};

export default function OfferHelpPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Offer help — tactics, forms &amp; attorney review
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          The tactics buyers use to win competitive offers, what&apos;s publicly
          available for your state, and how to hand off to a flat-fee attorney who
          drafts and reviews the actual contract. Education only — we never
          generate a ready-to-sign contract or tell you what to waive.
        </p>
      </div>

      <div className="mt-10 max-w-4xl space-y-12">
        <OfferTactics />
        <StateFormHandoff />
      </div>
    </div>
  );
}
