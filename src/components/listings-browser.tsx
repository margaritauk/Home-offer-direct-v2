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
import {
  LocationSelector,
  DEFAULT_RADIUS,
  type LocationValue,
} from "@/components/search/location-selector";
import {
  MoreFilters,
  EMPTY_MORE_FILTERS,
  type MoreFiltersValue,
} from "@/components/search/more-filters";

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
  const [location, setLocation] = useState<LocationValue>({ mode: "state" });
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [price, setPrice] = useState<RangeValue>({ min: 0, max: 0 });
  const [query, setQuery] = useState("");
  // `null` = follow the location-derived default (distance when a center exists,
  // else newest); once the buyer picks a sort we respect their choice.
  const [sortChoice, setSortChoice] =
    useState<NonNullable<ListingFilters["sort"]> | null>(null);
  const [more, setMore] = useState<MoreFiltersValue>(EMPTY_MORE_FILTERS);

  // A real search center exists only when "current location" resolved coords.
  const hasCenter = location.lat != null && location.lng != null;
  const sort: NonNullable<ListingFilters["sort"]> =
    sortChoice ?? (hasCenter ? "distance" : "newest");

  // Default the location to the buyer's selected state (once on hydration), shown
  // as a removable State chip. After this, clearing the chip/Clear-all just resets
  // the location; we never silently re-apply it, so the buyer can browse all states.
  useEffect(() => {
    if (hydrated && stateCode) {
      setLocation((loc) =>
        loc.mode === "state" && !loc.state ? { mode: "state", state: stateCode } : loc,
      );
    }
  }, [hydrated, stateCode]);

  // Real listings come from the server seam (mock or RentCast) via the search
  // route. We debounce filter changes (~300ms) and fetch async, tracking a
  // loading state and the response `source` so the disclaimer stays honest.
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // Becomes true after the first search resolves. Until then we may show
  // skeletons; afterwards we keep the previous results visible while refetching.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [source, setSource] = useState<"rentcast" | "mock">("mock");
  // RentCast requires a location to search; true → prompt instead of "no results".
  const [needsLocation, setNeedsLocation] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const filters: ListingFilters = {
      state: location.state || undefined,
      city: location.city || undefined,
      zip: location.zip || undefined,
      lat: location.lat,
      lng: location.lng,
      radius: location.lat != null ? location.radius ?? DEFAULT_RADIUS : undefined,
      propertyType: propertyType || undefined,
      propertyTypes: more.propertyTypes.length ? more.propertyTypes : undefined,
      minBeds: minBeds || undefined,
      maxBeds: more.maxBeds || undefined,
      minBaths: minBaths || undefined,
      minSqft: more.minSqft || undefined,
      maxSqft: more.maxSqft || undefined,
      minYearBuilt: more.minYearBuilt || undefined,
      maxYearBuilt: more.maxYearBuilt || undefined,
      maxDaysOnMarket: more.maxDaysOnMarket || undefined,
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
          needsLocation?: boolean;
        };
        // Ignore stale responses (a newer request superseded this one).
        if (id !== reqId.current) return;
        setResults(Array.isArray(data.listings) ? data.listings : []);
        setSource(data.source === "rentcast" ? "rentcast" : "mock");
        setNeedsLocation(Boolean(data.needsLocation));
      } catch {
        if (id !== reqId.current) return;
        setResults([]);
        setNeedsLocation(false);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location, propertyType, minBeds, minBaths, price, query, sort, more]);

  // Stale-while-revalidate (issue #182): show skeletons ONLY on the very first
  // load (nothing to keep on screen yet). For every later refetch, keep the
  // previous cards rendered and surface a subtle "Updating…" indicator instead
  // of blanking the list / flashing skeletons.
  const firstLoad = loading && !hasLoaded && results.length === 0;
  const updating = loading && !firstLoad;

  const clearAll = () => {
    setLocation({ mode: location.mode });
    setPropertyType("");
    setMinBeds(0);
    setMinBaths(0);
    setPrice({ min: 0, max: 0 });
    setQuery("");
    setMore(EMPTY_MORE_FILTERS);
  };

  const chips: FilterChip[] = [];
  if (location.lat != null && location.lng != null)
    chips.push({ id: "location", label: `Near me · ${location.radius ?? DEFAULT_RADIUS} mi` });
  else if (location.zip) chips.push({ id: "location", label: `ZIP ${location.zip}` });
  else if (location.city)
    chips.push({
      id: "location",
      label: location.state
        ? `${location.city}, ${location.state}`
        : location.city,
    });
  else if (location.state)
    chips.push({ id: "location", label: stateNames.get(location.state) ?? location.state });
  if (propertyType)
    chips.push({ id: "propertyType", label: `Type: ${propertyTypeLabels[propertyType]}` });
  if (minBeds) chips.push({ id: "minBeds", label: `${minBeds}+ beds` });
  if (more.maxBeds) chips.push({ id: "maxBeds", label: `Up to ${more.maxBeds} beds` });
  if (minBaths) chips.push({ id: "minBaths", label: `${minBaths}+ baths` });
  if (price.min) chips.push({ id: "minPrice", label: `Min ${usd(price.min)}` });
  if (price.max) chips.push({ id: "maxPrice", label: `Max ${usd(price.max)}` });
  if (more.minSqft) chips.push({ id: "minSqft", label: `Min ${more.minSqft.toLocaleString("en-US")} sqft` });
  if (more.maxSqft) chips.push({ id: "maxSqft", label: `Max ${more.maxSqft.toLocaleString("en-US")} sqft` });
  if (more.minYearBuilt) chips.push({ id: "minYearBuilt", label: `Built ${more.minYearBuilt}+` });
  if (more.maxYearBuilt) chips.push({ id: "maxYearBuilt", label: `Built ≤ ${more.maxYearBuilt}` });
  if (more.maxDaysOnMarket)
    chips.push({ id: "maxDaysOnMarket", label: `≤ ${more.maxDaysOnMarket} days on market` });
  for (const t of more.propertyTypes)
    chips.push({ id: `propertyTypes:${t}`, label: `Type: ${propertyTypeLabels[t]}` });
  if (query.trim()) chips.push({ id: "query", label: `“${query.trim()}”` });

  const removeChip = (id: string) => {
    if (id.startsWith("propertyTypes:")) {
      const t = id.slice("propertyTypes:".length) as PropertyType;
      setMore((m) => ({
        ...m,
        propertyTypes: m.propertyTypes.filter((x) => x !== t),
      }));
      return;
    }
    switch (id) {
      case "location":
        setLocation((loc) => ({ mode: loc.mode }));
        break;
      case "propertyType":
        setPropertyType("");
        break;
      case "minBeds":
        setMinBeds(0);
        break;
      case "maxBeds":
        setMore((m) => ({ ...m, maxBeds: 0 }));
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
      case "minSqft":
        setMore((m) => ({ ...m, minSqft: 0 }));
        break;
      case "maxSqft":
        setMore((m) => ({ ...m, maxSqft: 0 }));
        break;
      case "minYearBuilt":
        setMore((m) => ({ ...m, minYearBuilt: 0 }));
        break;
      case "maxYearBuilt":
        setMore((m) => ({ ...m, maxYearBuilt: 0 }));
        break;
      case "maxDaysOnMarket":
        setMore((m) => ({ ...m, maxDaysOnMarket: 0 }));
        break;
      case "query":
        setQuery("");
        break;
    }
  };

  return (
    <div>
      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="block sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Location</span>
          <LocationSelector value={location} onChange={setLocation} />
        </div>

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
          <span className="mb-1 block text-sm font-medium text-ink-soft">Keyword</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keyword in description…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            aria-label="Search listings"
          />
        </label>

        <div className="block sm:col-span-2 lg:col-span-3">
          <MoreFilters value={more} onChange={setMore} />
        </div>
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

      {/*
        Results bar (issue #182): the result count + a small "Updating…" spinner
        for stale-while-revalidate, alongside the Sort control (moved out of the
        filter grid so it sits with the results it reorders).
      */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-ink-muted" aria-live="polite">
          {firstLoad
            ? "Searching…"
            : needsLocation
              ? "Choose a location to search"
              : `${results.length} listing${results.length === 1 ? "" : "s"}`}
          {updating ? (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
                aria-hidden
              />
              Updating…
            </span>
          ) : null}
        </p>

        {!needsLocation && (results.length > 0 || updating) ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-ink-soft">Sort</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
              value={sort}
              onChange={(e) =>
                setSortChoice(e.target.value as NonNullable<ListingFilters["sort"]>)
              }
              aria-label="Sort"
            >
              {hasCenter ? (
                <option value="distance">Distance (nearest)</option>
              ) : null}
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
              <option value="newest">Newest on market</option>
              <option value="sqft-desc">Largest (sqft)</option>
              <option value="beds-desc">Most beds</option>
            </select>
          </label>
        ) : null}
      </div>

      {firstLoad ? (
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
      ) : needsLocation ? (
        <div className="mt-3 card text-center">
          <p className="font-medium text-ink">Pick where you want to search</p>
          <p className="mt-1 text-sm text-ink-soft">
            Real listings are searched by location. Use the{" "}
            <strong>current location</strong>, <strong>ZIP</strong>,{" "}
            <strong>city</strong>, or <strong>state</strong> selector above to
            see homes.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div
          className={`mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
            updating ? "pointer-events-none opacity-60" : ""
          }`}
          aria-busy={updating}
        >
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
