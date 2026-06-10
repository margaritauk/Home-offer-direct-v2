import Link from "next/link";

/**
 * Footer is the home for the secondary / resource layer (#84): Glossary, Your
 * State, and Find Pros leave the primary bar and live here (plus in-context on
 * the relevant journey steps). Every route stays reachable from the footer.
 */

const FOOTER_GROUPS: { title: string; links: { href: string; label: string }[] }[] =
  [
    {
      title: "Buy a home",
      links: [
        { href: "/journey", label: "Journey" },
        { href: "/listings", label: "Search Homes" },
        { href: "/dashboard", label: "Dashboard" },
      ],
    },
    {
      title: "Tools",
      links: [
        { href: "/tools", label: "All tools" },
        { href: "/tools/savings-calculator", label: "Savings Calculator" },
        { href: "/tools/offer-builder", label: "Offer Builder" },
        { href: "/offer-status", label: "Offer Status" },
        { href: "/tracker", label: "Tracker" },
        { href: "/showings", label: "Showings" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/states", label: "Your State" },
        { href: "/pros", label: "Find Pros" },
        { href: "/glossary", label: "Glossary" },
        { href: "/legal", label: "Legal & disclaimers" },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 pb-16 lg:pb-0">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {group.title}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-8 border-t border-slate-200 pt-6 text-sm text-ink-muted">
          © {new Date().getFullYear()} HomeOffer Direct. Educational guidance, not
          legal or financial advice.
        </p>
      </div>
    </footer>
  );
}
