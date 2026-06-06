import type { ProProfile, FinderService, ProRole } from "./types";

/**
 * REAL, authoritative "find a vetted pro" services.
 *
 * Every entry below is a genuine organization with a verified official URL.
 * These are the trustworthy handoff path for a self-serve buyer. Do NOT add
 * fabricated businesses here.
 */
export const finderServices: FinderService[] = [
  // ---- Attorneys ----
  {
    id: "aba-lawyer-referral-directory",
    role: "attorney",
    name: "ABA Lawyer Referral Directory",
    description:
      "The American Bar Association's directory of approved state and local bar lawyer-referral services — use your own state's program.",
    website:
      "https://www.americanbar.org/groups/lawyer_referral/resources/lawyer-referral-directory/",
    perState: true,
  },
  {
    id: "martindale-hubbell-real-estate",
    role: "attorney",
    name: "Martindale-Hubbell",
    description:
      "A long-established attorney directory with peer-reviewed ratings where you can search real estate lawyers by city and state.",
    website: "https://www.martindale.com/areas-of-law/real-estate-lawyers/",
  },
  {
    id: "avvo-real-estate-lawyers",
    role: "attorney",
    name: "Avvo Real Estate Lawyers",
    description:
      "A consumer attorney directory with ratings and reviews for browsing residential real estate lawyers in your area.",
    website: "https://www.avvo.com/real-estate-lawyer.html",
  },
  {
    id: "nolo-lawyer-directory",
    role: "attorney",
    name: "Nolo Lawyer Directory",
    description:
      "Nolo's free directory of vetted real estate attorneys, organized by state and practice area.",
    website: "https://www.nolo.com/lawyers/real-estate",
  },

  // ---- Home inspectors ----
  {
    id: "internachi-find-inspector",
    role: "inspector",
    name: "InterNACHI — Find a Certified Inspector",
    description:
      "The International Association of Certified Home Inspectors' tool to find a certified inspector near the property.",
    website: "https://www.nachi.org/certified-inspectors",
  },
  {
    id: "ashi-find-an-inspector",
    role: "inspector",
    name: "ASHI — Find an Inspector",
    description:
      "The American Society of Home Inspectors' official tool to locate an ASHI member inspector in your area.",
    website: "https://www.homeinspector.org/for-consumers/find-an-inspector/",
  },

  // ---- Title / escrow ----
  {
    id: "alta-membership-directory",
    role: "title-escrow",
    name: "ALTA Membership Directory",
    description:
      "The American Land Title Association's directory for finding member title and settlement companies by location.",
    website: "https://www.alta.org/membership/directory",
  },
  {
    id: "cfpb-closing-resources",
    role: "title-escrow",
    name: "CFPB — Closing on Your New Home",
    description:
      "The Consumer Financial Protection Bureau's official guide to the closing process, settlement agents, and closing documents.",
    website: "https://www.consumerfinance.gov/owning-a-home/close/",
  },
];

/**
 * SAMPLE / illustrative listings only.
 *
 * These exist purely to demonstrate the directory UI. Every entry has
 * `isSample: true`, an obviously-illustrative name, no phone number, and only
 * a placeholder website. None of these are real businesses or endorsements.
 */
export const samplePros: ProProfile[] = [
  // ---- Attorneys ----
  {
    id: "sample-attorney-ca",
    name: "Sample Coastline Real Estate Law Group",
    role: "attorney",
    states: ["CA"],
    description:
      "Illustrative listing showing how a California purchase-contract review attorney would appear in the directory.",
    location: "Los Angeles, CA",
    pricingNote: "Flat $900–$1,600 contract review",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-attorney-ny",
    name: "Demo Empire State Closing Attorneys",
    role: "attorney",
    states: ["NY"],
    description:
      "Illustrative listing for a New York attorney handling buyer-side representation through closing.",
    location: "Brooklyn, NY",
    pricingNote: "Flat $1,500–$2,500 full representation",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-attorney-il",
    name: "Example Prairie Title & Closing Law LLC",
    role: "attorney",
    states: ["IL"],
    description:
      "Illustrative listing for an Illinois real estate attorney that reviews contracts and attends closing.",
    location: "Chicago, IL",
    pricingNote: "Flat $750–$1,200 contract review",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-attorney-nationwide",
    name: "Sample Remote Contract Review Counsel",
    role: "attorney",
    states: [],
    description:
      "Illustrative nationwide listing showing a remote, flat-fee purchase-contract review service.",
    pricingNote: "Flat $650–$1,000 remote contract review",
    website: "https://example.com",
    isSample: true,
  },

  // ---- Home inspectors ----
  {
    id: "sample-inspector-tx",
    name: "Example Lone Star Home Inspections LLC",
    role: "inspector",
    states: ["TX"],
    description:
      "Illustrative listing for a Texas general home inspection service covering structure, roof, and systems.",
    location: "Austin, TX",
    pricingNote: "From $375 for a standard single-family inspection",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-inspector-wa",
    name: "Demo Evergreen Property Inspections",
    role: "inspector",
    states: ["WA"],
    description:
      "Illustrative listing for a Washington inspector offering general and sewer-scope inspections.",
    location: "Seattle, WA",
    pricingNote: "From $450; +$200 sewer scope",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-inspector-fl",
    name: "Sample Sunshine State Home Inspectors Inc.",
    role: "inspector",
    states: ["FL"],
    description:
      "Illustrative listing for a Florida inspector that adds wind-mitigation and four-point reports.",
    location: "Tampa, FL",
    pricingNote: "From $400; wind-mitigation report +$125",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-inspector-nationwide",
    name: "Example National Inspection Network",
    role: "inspector",
    states: [],
    description:
      "Illustrative nationwide listing showing a referral network of independent certified inspectors.",
    pricingNote: "Typical range $350–$600 depending on size",
    website: "https://example.com",
    isSample: true,
  },

  // ---- Title / escrow ----
  {
    id: "sample-title-ca",
    name: "Sample Title & Escrow Co.",
    role: "title-escrow",
    states: ["CA"],
    description:
      "Illustrative listing for a California title and escrow company handling search, escrow, and closing.",
    location: "San Diego, CA",
    pricingNote: "Escrow fee approx. $2 per $1,000 of price",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-title-tx",
    name: "Demo Lone Star Title Company",
    role: "title-escrow",
    states: ["TX"],
    description:
      "Illustrative listing for a Texas title company issuing owner's title insurance and settling the closing.",
    location: "Houston, TX",
    pricingNote: "Title premium set by state promulgated rates",
    website: "https://example.com",
    isSample: true,
  },
  {
    id: "sample-title-fl",
    name: "Example Gulf Coast Settlement Services LLC",
    role: "title-escrow",
    states: ["FL"],
    description:
      "Illustrative listing for a Florida settlement agent coordinating title search, escrow, and recording.",
    location: "Orlando, FL",
    pricingNote: "Settlement fee approx. $500–$800",
    website: "https://example.com",
    isSample: true,
  },
];

/** Return finder services, optionally filtered to a single role. */
export function getFinderServices(role?: ProRole): FinderService[] {
  if (!role) return finderServices;
  return finderServices.filter((s) => s.role === role);
}

/**
 * Return sample pros, optionally filtered by role and/or state. A pro matches a
 * state when its `states` list is empty (nationwide) OR includes the uppercased
 * state code.
 */
export function getSamplePros(opts?: {
  role?: ProRole;
  state?: string;
}): ProProfile[] {
  const role = opts?.role;
  const state = opts?.state?.toUpperCase();
  return samplePros.filter((p) => {
    if (role && p.role !== role) return false;
    if (state && p.states.length > 0 && !p.states.includes(state)) return false;
    return true;
  });
}
