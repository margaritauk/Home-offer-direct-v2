import type { Metadata } from "next";
import Link from "next/link";
import { Dashboard } from "@/components/dashboard/dashboard";
import { WhatsNext } from "@/components/nav/whats-next";

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

      <div className="mt-8">
        <WhatsNext />
      </div>

      <div className="mt-10">
        <Dashboard />
      </div>
    </div>
  );
}
