import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allListings, getListingById, propertyTypeLabels } from "@/lib/listings";
import { formatUSD } from "@/lib/savings";
import { ListingImage } from "@/components/listing-image";
import { AgencyExplainer } from "@/components/showings/agency-explainer";
import { TrackShowingButton } from "@/components/showings/track-showing-button";

export function generateStaticParams() {
  return allListings().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.address}, ${listing.city} ${listing.state}`,
    description: listing.description,
  };
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 text-center">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) notFound();

  return (
    <div className="container-page py-12 lg:py-16">
      <Link href="/listings" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <ListingImage
            id={listing.id}
            propertyType={listing.propertyType}
            className="aspect-[5/3] w-full rounded-xl"
          />
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Sample listing.</strong> This is an illustrative placeholder,
            not a real home for sale. Live MLS listings are on the roadmap.
          </div>
          <h2 className="mt-6 text-xl font-bold">About this home</h2>
          <p className="mt-2 text-ink-soft">{listing.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-1">
              <dt className="text-ink-muted">Type</dt>
              <dd className="font-medium">{propertyTypeLabels[listing.propertyType]}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <dt className="text-ink-muted">Year built</dt>
              <dd className="font-medium">{listing.yearBuilt}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <dt className="text-ink-muted">Days on market</dt>
              <dd className="font-medium">{listing.daysOnMarket}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <dt className="text-ink-muted">Price / sqft</dt>
              <dd className="font-medium">
                {formatUSD(Math.round(listing.price / listing.sqft))}
              </dd>
            </div>
          </dl>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <p className="text-3xl font-bold text-ink">{formatUSD(listing.price)}</p>
            <p className="mt-1 font-medium text-ink">{listing.address}</p>
            <p className="text-ink-muted">
              {listing.city}, {listing.state} {listing.zip}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Spec label="beds" value={String(listing.beds)} />
              <Spec label="baths" value={String(listing.baths)} />
              <Spec label="sqft" value={listing.sqft.toLocaleString()} />
            </div>

            <div className="mt-5 space-y-2">
              <Link href="/journey/make-an-offer" className="btn-primary w-full">
                Found it? Start your offer →
              </Link>
              <Link href="/tools/savings-calculator" className="btn-secondary w-full">
                Estimate your savings
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Buying without an agent? Our guided journey walks you from offer to
              closing.
            </p>
          </div>

          <div className="mt-4">
            <TrackShowingButton
              listingId={listing.id}
              address={listing.address}
              city={listing.city}
              state={listing.state}
            />
          </div>
        </aside>
      </div>

      <div className="mt-10 max-w-3xl">
        <AgencyExplainer />
      </div>
    </div>
  );
}
