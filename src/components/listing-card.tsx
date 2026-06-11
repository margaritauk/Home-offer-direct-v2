import Link from "next/link";
import { propertyTypeLabels, type Listing } from "@/lib/listings";
import { formatUSD } from "@/lib/savings";
import { ListingImage } from "@/components/listing-image";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card group flex flex-col overflow-hidden p-0 transition hover:border-brand-300 hover:shadow-md"
    >
      <ListingImage
        id={listing.id}
        propertyType={listing.propertyType}
        className="aspect-[5/3] w-full"
      />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xl font-bold text-ink">{formatUSD(listing.price)}</p>
        <p className="mt-1 text-sm font-medium text-ink">
          {listing.address}
        </p>
        <p className="text-sm text-ink-muted">
          {listing.city}, {listing.state} {listing.zip}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
          <span>{listing.beds} bd</span>
          <span>·</span>
          <span>{listing.baths} ba</span>
          <span>·</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
          {typeof listing.distance === "number" ? (
            <>
              <span>·</span>
              <span className="font-medium text-brand-700">
                {listing.distance < 0.1
                  ? "<0.1 mi"
                  : `${listing.distance.toFixed(1)} mi away`}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {propertyTypeLabels[listing.propertyType]}
          </span>
          <span>{listing.daysOnMarket}d on market</span>
        </div>
      </div>
    </Link>
  );
}
