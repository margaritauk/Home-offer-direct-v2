import Link from "next/link";
import {
  ACCESS_GAP_SECTIONS,
  ALERT_PORTALS,
  LISTING_ALERTS_SOURCE,
} from "@/lib/tools/listing-alerts";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

/**
 * Listing-alert & access guide (A9). Static, server-rendered, portal-neutral
 * content. No data layer, no localStorage.
 */
export function ListingAlertsGuide() {
  return (
    <div className="space-y-8" data-testid="listing-alerts-guide">
      <DisclaimerBanner>
        Honest heads-up: portal saved searches get you close to an agent&apos;s
        listing access, but <strong>not all the way</strong>. Some homes never
        reach the public portals.
      </DisclaimerBanner>

      <section aria-labelledby="portals-heading" className="space-y-4">
        <h2 id="portals-heading" className="text-lg font-semibold">
          Where to set saved-search alerts
        </h2>
        <p className="text-sm text-ink-soft">
          Set the same objective filters on a couple of these — we don&apos;t
          endorse any one of them.
        </p>
        <ul className="space-y-3">
          {ALERT_PORTALS.map((p) => (
            <li key={p.name} className="card">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:underline"
              >
                {p.name} ↗
              </a>
              <p className="mt-1 text-sm text-ink-soft">{p.note}</p>
            </li>
          ))}
        </ul>
      </section>

      {ACCESS_GAP_SECTIONS.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="space-y-2"
        >
          <h2 id={`${section.id}-heading`} className="text-lg font-semibold">
            {section.heading}
          </h2>
          {section.body.map((para, i) => (
            <p key={i} className="text-sm text-ink-soft">
              {para}
            </p>
          ))}
        </section>
      ))}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-ink-soft">
        Heading out to tour what your alerts surface? See the{" "}
        <Link href="/showings" className="text-brand-700 hover:underline">
          showings tracker
        </Link>{" "}
        for scripts to get a showing as an unrepresented buyer and a dual-agency
        caution, and browse our{" "}
        <Link href="/listings" className="text-brand-700 hover:underline">
          sample listings
        </Link>{" "}
        (a shortlist, not a full search).
      </div>

      <p className="text-xs text-ink-muted" data-testid="listing-alerts-source">
        {LISTING_ALERTS_SOURCE}
      </p>
    </div>
  );
}
