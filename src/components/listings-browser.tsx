"use client";

import { useEffect, useRef, useState } from "react";
import {
  allListings,
  propertyTypeLabels,
  type Listing,
  type ListingFilters,
  type PropertyType,
} from "@/lib/listings";
import { getStateOptions } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { ListingCard } from "@/components/listing-card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { PriceRange, type PriceBounds, type RangeValue } from "@/components/listings/price-range";
import { FilterChips, type FilterChip } from "@/components/listings/filter-chips";

const stateOptions = getStateOptions();
const stateNames = new Map(stateOptions.map((o) => [o.code, o.name]));
const propertyTypes = Object.keys(propertyTypeLabels) as PropertyType[];

/** Data-derived price bounds for the slider; floor the hi at a sensible cap. */
const priceBounds: PriceBounds = (() => {
  const prices = allListings().map((l) => l.price);
  const lo = prices.length ? Math.min(...prices) : 0;
  const dataHi = prices.length ? Math.max(...prices) : 2_000_000;
  return { lo: Math.max(0, Math.floor(lo / 1000) * 1000), hi: Math.max(dataHi, 2_000_000) };
})();

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function ListingsBrowser() {
  const { stateCode, hydrated } = useStateSelection();
  const [state, setState] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [price, setPrice] = useState<RangeValue>({ min: 0, max: 0 });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<NonNullable<ListingFilters["sort"]>>("newest");

  // Default the state filter to the buyer's selected state (once on hydration).
  // After this, clearing the chip/Clear-all just resets local `state`; we never
  // silently re-apply it, so the buyer can browse all states.
  useEffect(() => {
    if (hydrated && stateCode) setState(stateCode);
  }, [hydrated, stateCode]);

  // Real listings come from the server seam (mock or RentCast) via the search
  // route. We debounce filter changes (~300ms) and fetch async, tracking a
  // loading state and the response `source` so the disclaimer stays honest.
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"rentcast" | "mock">("mock");
  const reqId = useRef(0);

  useEffect(() => {
    const filters: ListingFilters = {
      state: state || undefined,
      propertyType: propertyType || undefined,
      minBeds: minBeds || undefined,
      minBaths: minBaths || undefined,
      minPrice: price.min || undefined,
      maxPrice: price.max || undefined,
      query: query || undefined,
      sort,
    };

    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/listings/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });
        const data = (await res.json()) as {
          listings?: Listing[];
          source?: "rentcast" | "mock";
        };
        // Ignore stale responses (a newer request superseded this one).
        if (id !== reqId.current) return;
        setResults(Array.isArray(data.listings) ? data.listings : []);
        setSource(data.source === "rentcast" ? "rentcast" : "mock");
      } catch {
        if (id !== reqId.current) return;
        setResults([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [state, propertyType, minBeds, minBaths, price, query, sort]);

  const clearAll = () => {
    setState("");
    setPropertyType("");
    setMinBeds(0);
    setMinBaths(0);
    setPrice({ min: 0, max: 0 });
    setQuery("");
  };

  const chips: FilterChip[] = [];
  if (state) chips.push({ id: "state", label: `State: ${stateNames.get(state) ?? state}` });
  if (propertyType)
    chips.push({ id: "propertyType", label: `Type: ${propertyTypeLabels[propertyType]}` });
  if (minBeds) chips.push({ id: "minBeds", label: `${minBeds}+ beds` });
  if (minBaths) chips.push({ id: "minBaths", label: `${minBaths}+ baths` });
  if (price.min) chips.push({ id: "minPrice", label: `Min ${usd(price.min)}` });
  if (price.max) chips.push({ id: "maxPrice", label: `Max ${usd(price.max)}` });
  if (query.trim()) chips.push({ id: "query", label: `“${query.trim()}”` });

  const removeChip = (id: string) => {
    switch (id) {
      case "state":
        setState("");
        break;
      case "propertyType":
        setPropertyType("");
        break;
      case "minBeds":
        setMinBeds(0);
        break;
      case "minBaths":
        setMinBaths(0);
        break;
      case "minPrice":
        setPrice((p) => ({ ...p, min: 0 }));
        break;
      case "maxPrice":
        setPrice((p) => ({ ...p, max: 0 }));
        break;
      case "query":
        setQuery("");
        break;
    }
  };

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
          <span className="mb-1 block text-sm font-medium text-ink-soft">Min baths</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            value={minBaths}
            onChange={(e) => setMinBaths(Number(e.target.value))}
            aria-label="Minimum baths"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n === 0 ? "Any" : `${n}+`}</option>
            ))}
          </select>
        </label>

        <div className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Price range</span>
          <PriceRange
            min={price.min}
            max={price.max}
            onChange={setPrice}
            bounds={priceBounds}
            hydrated={hydrated}
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, address, or keyword…"
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

      {source === "rentcast" ? (
        <DisclaimerBanner icon={null} className="mt-4">
          <strong>Live data via RentCast.</strong> Listing photos are
          placeholders.
        </DisclaimerBanner>
      ) : (
        <DisclaimerBanner icon={null} className="mt-4">
          <strong>Sample listings.</strong> These are illustrative placeholders,
          not real homes for sale. Live MLS listings are coming — see the
          roadmap.
        </DisclaimerBanner>
      )}

      {chips.length > 0 ? (
        <div className="mt-4">
          <FilterChips chips={chips} onRemove={removeChip} onClearAll={clearAll} />
        </div>
      ) : null}

      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {loading
          ? "Searching…"
          : `${results.length} listing${results.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <div
          className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card h-72 animate-pulse bg-slate-100 p-0"
            />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-ink-muted">No listings match those filters.</p>
          {chips.length > 0 ? (
            <button type="button" className="btn-secondary" onClick={clearAll}>
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
