import type { Metadata } from "next";
import Link from "next/link";
import { Dashboard } from "@/components/dashboard/dashboard";
import { CockpitBand } from "@/components/cockpit/cockpit-band";
import { ContactsHub } from "@/components/tools/contacts-hub";
import { ResumeCard } from "@/components/journey/resume-card";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "One place to see every home you're working on — journey progress, showing status, offer stage, the next deadline, outstanding documents, and what to do next on each.",
};

export default function DashboardPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Your home search
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Every home you&rsquo;re engaging, rolled up in one view: how far along
          the journey is, your showing and offer status, the next deadline, the
          documents still outstanding, and the next action on each. Everything
          saves on this device.
        </p>
        <Link
          href="/deal/print"
          className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:underline"
        >
          Print your binder →
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        <ResumeCard />
        <CockpitBand />
      </div>

      <div className="mt-10">
        <Dashboard />
      </div>

      <section className="mt-12" aria-labelledby="contacts-heading">
        <h2 id="contacts-heading" className="text-2xl font-bold">
          Who&apos;s who on your deal
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          The cast an agent normally quarterbacks — keep everyone&apos;s contact
          details in one place. Pure organization; nothing is shared.
        </p>
        <div className="mt-6">
          <ContactsHub />
        </div>
      </section>
    </div>
  );
}
