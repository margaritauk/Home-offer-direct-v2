import type { NavGroupItem } from "./nav-group";

/**
 * Shared navigation destinations for the simplified IA (epic #83). The desktop
 * header (#84/#85) and the mobile tab bar (#87) both read from these so the two
 * surfaces never drift.
 */

/** Tools group — always available (no gating). */
export const TOOLS_ITEMS: NavGroupItem[] = [
  { href: "/tools/savings-calculator", label: "Savings Calculator" },
  { href: "/tools/offer-builder", label: "Offer Builder" },
  { href: "/offer-status", label: "Offer Status" },
  { href: "/tracker", label: "Tracker" },
  { href: "/showings", label: "Showings" },
];

/**
 * My Deal group — the workspace. Gated: only rendered when the deal layer is
 * enabled AND the user is signed in (see SiteHeader). The DealSwitcher is hosted
 * inside the group rather than loose in the bar.
 */
export const MY_DEAL_ITEMS: NavGroupItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deal", label: "Manage Deal" },
  { href: "/account", label: "Account" },
];

/** Secondary / resource links — live in the footer + "More". */
export const SECONDARY_ITEMS: NavGroupItem[] = [
  { href: "/states", label: "Your State" },
  { href: "/pros", label: "Find Pros" },
  { href: "/glossary", label: "Glossary" },
];
