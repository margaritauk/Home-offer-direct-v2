import type { Metadata } from "next";
import { ShowingsTracker } from "@/components/showings/showings-tracker";
import { AgencyExplainer } from "@/components/showings/agency-explainer";
import { MessageComposer } from "@/components/showings/message-composer";
import { ManualAddShowing } from "@/components/showings/manual-add-showing";

export const metadata: Metadata = {
  title: "Showings tracker",
  description:
    "Track your showing requests and visits per listing and per area, message listing agents with Fair-Housing-safe templates, and learn what to keep to yourself when the agent works for the seller.",
};

export default function ShowingsPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Contact agents &amp; schedule showings
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Showings tracker</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Touring homes without an agent means staying organized yourself. Track
          every showing per listing and per area, request tours with ready-made
          messages, and know what to keep to yourself — because the listing agent
          works for the seller. Everything saves on this device.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <ManualAddShowing />
          <ShowingsTracker />
          <MessageComposer />
        </div>
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <AgencyExplainer />
        </aside>
      </div>
    </div>
  );
}
