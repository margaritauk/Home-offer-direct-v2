import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} HomeOffer Direct. Educational guidance, not legal or financial advice.</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/listings" className="hover:text-brand-700">Search Homes</Link>
          <Link href="/journey" className="hover:text-brand-700">Journey</Link>
          <Link href="/states" className="hover:text-brand-700">Your State</Link>
          <Link href="/pros" className="hover:text-brand-700">Find Pros</Link>
          <Link href="/showings" className="hover:text-brand-700">Showings</Link>
          <Link href="/tracker" className="hover:text-brand-700">Tracker</Link>
          <Link href="/tools/offer-builder" className="hover:text-brand-700">Offer Builder</Link>
          <Link href="/glossary" className="hover:text-brand-700">Glossary</Link>
          <Link href="/tools/savings-calculator" className="hover:text-brand-700">Calculator</Link>
        </nav>
      </div>
    </footer>
  );
}
