"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthMenu } from "@/components/auth-menu";
import { DealSwitcher } from "@/components/deal-switcher";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/listings", label: "Search Homes" },
  { href: "/journey", label: "Journey" },
  { href: "/states", label: "Your State" },
  { href: "/pros", label: "Find Pros" },
  { href: "/showings", label: "Showings" },
  { href: "/tools/offer-builder", label: "Offer Builder" },
  { href: "/tracker", label: "Tracker" },
  { href: "/tools/savings-calculator", label: "Calculator" },
  { href: "/glossary", label: "Glossary" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            H
          </span>
          <span>
            HomeOffer<span className="text-brand-600"> Direct</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-brand-700 ${
                pathname === link.href ? "text-brand-700" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden lg:inline-flex">
            <DealSwitcher />
          </span>
          <span className="hidden lg:inline-flex">
            <AuthMenu />
          </span>
          <Link href="/journey" className="btn-primary hidden sm:inline-flex">
            Start free
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-ink lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="text-xl leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-slate-200 bg-white lg:hidden"
        >
          <div className="container-page flex flex-col py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-2 py-3 text-base font-medium transition hover:bg-slate-50 ${
                  pathname === link.href ? "text-brand-700" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-2 py-3">
              <DealSwitcher />
            </div>
            <div className="px-2 py-3">
              <AuthMenu onNavigate={() => setOpen(false)} />
            </div>
            <Link
              href="/journey"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2"
            >
              Start free
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
