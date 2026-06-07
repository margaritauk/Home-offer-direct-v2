import type { Metadata } from "next";
import { OfferStatusManager } from "@/components/offer-status/offer-status-manager";

export const metadata: Metadata = {
  title: "Offer status",
  description:
    "Track each offer's status through the pipeline — draft, sent, submitted, countered, accepted, rejected, or expired — capture the sent date and response-window expiration, and keep notes on every change.",
};

export default function OfferStatusPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Offer pipeline &amp; expiration
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Offer status</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Track where every offer stands and when each one expires, so you always
          know which deals need action. This is a personal worksheet to stay
          organized &mdash; not a contract or legal advice. Everything saves on
          this device.
        </p>
      </div>

      <div className="mt-10 max-w-3xl">
        <OfferStatusManager />
      </div>
    </div>
  );
}
