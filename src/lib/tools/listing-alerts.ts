/**
 * Listing-alert & access guide content (A9).
 *
 * Static, typed content (ADR-003 pattern) — an honest guide to setting
 * saved-search alerts on the major portals and an honest account of what an
 * unrepresented buyer may NOT see (true MLS-only / office-exclusive / "pocket"
 * listings, portal lag, coming-soon). No data layer.
 *
 * Compliance:
 *  - FHA: portal-neutral (lists several, endorses none); saved-search guidance
 *    stays on OBJECTIVE attributes (price, beds, type, commute) — never
 *    demographic or "good schools as value" proxies.
 *  - UDAP: no implied affiliation/affiliate framing with any portal; honest
 *    about coverage gaps.
 */

export interface PortalLink {
  name: string;
  /** Where the saved-search/alerts feature lives. */
  href: string;
  /** What to do there — neutral, no endorsement. */
  note: string;
}

/**
 * The major consumer portals, listed alphabetically, endorsing none. Each links
 * to the portal's home (the saved-search feature lives behind a free account).
 */
export const ALERT_PORTALS: readonly PortalLink[] = [
  {
    name: "Realtor.com",
    href: "https://www.realtor.com/",
    note: "Create a free account, save a search, and turn on email/app alerts.",
  },
  {
    name: "Redfin",
    href: "https://www.redfin.com/",
    note: "Save a search and enable instant or daily alerts; watch the coming-soon section.",
  },
  {
    name: "Zillow",
    href: "https://www.zillow.com/",
    note: "Save a search with your filters and turn on notifications for new and coming-soon homes.",
  },
] as const;

export interface GuideSection {
  id: string;
  heading: string;
  /** Plain-English paragraphs. */
  body: string[];
}

/**
 * The honest "what you might miss" sections. Kept factual and dated where the
 * policy is evolving (Clear Cooperation).
 */
export const ACCESS_GAP_SECTIONS: readonly GuideSection[] = [
  {
    id: "set-alerts",
    heading: "Set saved-search alerts on the major portals",
    body: [
      "The closest an unrepresented buyer gets to an agent's instant new-listing alerts is a saved search with notifications on the big consumer portals. Set the same objective filters on a couple of them so you're not relying on one feed.",
      "Keep filters to objective facts — price, beds/baths, property type, square footage, and commute time. That keeps your search disciplined and Fair-Housing-safe.",
    ],
  },
  {
    id: "portal-lag",
    heading: "Portals lag the MLS — sometimes by hours or days",
    body: [
      "New listings usually hit the MLS (which agents watch) before they syndicate to consumer portals, and portals de-duplicate imperfectly. A saved-search alert is good, but it is not as fast as MLS access.",
      "In a hot market those hours matter. Checking a portal's 'new today' view in the morning, plus watching coming-soon, narrows the gap.",
    ],
  },
  {
    id: "off-market",
    heading: "Some inventory genuinely isn't on the portals",
    body: [
      "True MLS-only, office-exclusive, and 'pocket' listings aren't fully visible on consumer portals. NAR's Clear Cooperation Policy governs how off-MLS listings are marketed, with a newer 'delayed marketing exempt listings' option — and the policy is still evolving (as of 2026).",
      "The practical takeaway: a portal search is not a complete view of the market. Attending open houses, contacting listing agents directly, and asking about coming-soon homes all help close the gap.",
    ],
  },
  {
    id: "our-coverage",
    heading: "Be clear about what this site shows",
    body: [
      "The homes shown here are a shortlist/demo, not a full search engine — do your serious searching on the portals above. When a live feed is enabled it still won't license listing photos, so it's a convenience layer, not a portal replacement.",
    ],
  },
] as const;

/**
 * Source/date stamp for the access-gap facts (accuracy compliance). Rendered in
 * the UI so the evolving Clear Cooperation policy carries an as-of date.
 */
export const LISTING_ALERTS_SOURCE =
  "Portal coverage & NAR Clear Cooperation Policy as of 2026 (NAR policy; Redfin/Realtor.com/Zillow saved-search features). Policy is evolving — re-check current rules.";
