import type { Metadata } from "next";
import { TrackerApp } from "@/components/tracker-app";

export const metadata: Metadata = {
  title: "Deadline & document tracker",
  description:
    "Once you're under contract, missing a deadline is the biggest risk of buying without an agent. Track your contingency deadlines and required documents in one place.",
};

export default function TrackerPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Stay on top of your deal
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Deadline &amp; document tracker
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Once you&apos;re under contract, blowing a contingency deadline is the
          single biggest risk of going agent-free. Enter your two key dates and
          we&apos;ll map out every deadline that matters — plus a checklist of the
          documents to gather and keep. Everything saves on this device.
        </p>
      </div>

      <div className="mt-10">
        <TrackerApp />
      </div>
    </div>
  );
}
