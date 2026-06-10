"use client";

import { useEffect, useMemo, useState } from "react";
import {
  queryListings,
  propertyTypeLabels,
  type ListingFilters,
  type PropertyType,
} from "@/lib/listings";
import { getStateOptions } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { ListingCard } from "@/components/listing-card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

const stateOptions = getStateOptions();
const propertyTypes = Object.keys(propertyTypeLabels) as PropertyType[];

export function ListingsBrowser() {
  const { stateCode, hydrated } = useStateSelection();
  const [state, setState] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [minBeds, setMinBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<NonNullable<ListingFilters["sort"]>>("newest");

  // Default the state filter to the buyer's selected state.
  useEffect(() => {
    if (hydrated && stateCode) setState(stateCode);
  }, [hydrated, stateCode]);

  const results = useMemo(
    () =>
      queryListings({
        state: state || undefined,
        propertyType: propertyType || undefined,
        minBeds: minBeds || undefined,
        maxPrice: maxPrice || undefined,
        query: query || undefined,
        sort,
      }),
    [state, propertyType, minBeds, maxPrice, query, sort],
  );

  return (
    <div>
      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">State</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={state}
            onChange={(e) => setState(e.target.value)}
            aria-label="State"
            suppressHydrationWarning
          >
            <option value="">All states</option>
            {stateOptions.map((o) => (
              <option key={o.code} value={o.code}>{o.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Property type</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
            aria-label="Property type"
          >
            <option value="">Any type</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{propertyTypeLabels[t]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Min beds</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={minBeds}
            onChange={(e) => setMinBeds(Number(e.target.value))}
            aria-label="Minimum beds"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 0 ? "Any" : `${n}+`}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Max price</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            aria-label="Maximum price"
          >
            <option value={0}>No max</option>
            {[300_000, 400_000, 500_000, 750_000, 1_000_000].map((n) => (
              <option key={n} value={n}>${(n / 1000).toLocaleString()}k</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City or address…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            aria-label="Search listings"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Sort</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={sort}
            onChange={(e) => setSort(e.target.value as NonNullable<ListingFilters["sort"]>)}
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <DisclaimerBanner icon={null} className="mt-4">
        <strong>Sample listings.</strong> These are illustrative placeholders, not
        real homes for sale. Live MLS listings are coming — see the roadmap.
      </DisclaimerBanner>

      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {results.length} listing{results.length === 1 ? "" : "s"}
      </p>

      {results.length > 0 ? (
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-ink-muted">No sample listings match those filters.</p>
      )}
    </div>
  );
}
