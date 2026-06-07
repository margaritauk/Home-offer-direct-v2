import type { Metadata } from "next";
import { ListingsBrowser } from "@/components/listings-browser";

export const metadata: Metadata = {
  title: "Search homes",
  description:
    "Browse and filter homes for sale by state, price, beds, and type. Find a place, then start your offer — all without a buyer's agent.",
};

export default function ListingsPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Find a home
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Search homes</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Browse listings, filter to what fits, and when you find the one, jump
          straight into making an offer — no agent required.
        </p>
      </div>

      <div className="mt-8">
        <ListingsBrowser />
      </div>
    </div>
  );
}
