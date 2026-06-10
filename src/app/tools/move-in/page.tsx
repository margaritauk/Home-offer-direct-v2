import type { Metadata } from "next";
import { MoveInTracker } from "@/components/tools/move-in";

export const metadata: Metadata = {
  title: "Move-in & post-purchase tracker",
  description:
    "Your first-weeks checklist after closing: utilities, homestead exemption, mortgage setup, locks and safety, maintenance reminders, and a document vault. Education, not tax or legal advice.",
};

export default function MoveInPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Move-in &amp; post-purchase
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          The keys are yours — now settle in. Work through utilities, your
          mortgage and address updates, locks and safety, maintenance reminders,
          and confirm your closing documents are stored safely.
        </p>
      </div>
      <div className="mt-8">
        <MoveInTracker />
      </div>
    </div>
  );
}
