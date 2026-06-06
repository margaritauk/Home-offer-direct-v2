import Link from "next/link";

const navLinks = [
  { href: "/journey", label: "The Journey" },
  { href: "/states", label: "Your State" },
  { href: "/tools/savings-calculator", label: "Savings Calculator" },
  { href: "/glossary", label: "Glossary" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            H
          </span>
          <span>
            HomeOffer<span className="text-brand-600"> Direct</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/journey" className="btn-primary hidden sm:inline-flex">
          Start free
        </Link>
      </div>
    </header>
  );
}
