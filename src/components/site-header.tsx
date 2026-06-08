"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthMenu } from "@/components/auth-menu";
import { DealSwitcher } from "@/components/deal-switcher";
import { NavGroup } from "@/components/nav/nav-group";
import {
  MY_DEAL_ITEMS,
  SECONDARY_ITEMS,
  TOOLS_ITEMS,
} from "@/components/nav/nav-config";
import { isDealsEnabled } from "@/lib/supabase/config";
import { useAuth } from "@/hooks/use-auth";

/** Top-level anchors that are plain links (Journey, Search Homes). */
const PRIMARY_LINKS = [
  { href: "/journey", label: "Journey" },
  { href: "/listings", label: "Search Homes" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { enabled: cloudEnabled, user } = useAuth();

  // The "My Deal" group is gated exactly like the old DealNavLink/DealSwitcher:
  // it only renders when the deal layer is enabled AND a user is signed in. With
  // no keys / signed out it is absent entirely, so the guest nav is unchanged
  // apart from the regrouping.
  const showMyDeal = isDealsEnabled() && Boolean(user);
  // When cloud is enabled but the user is signed out, surface a Sign in link in
  // place of the gated group (reusing AuthMenu logic, which self-gates on cloud).
  const showSignIn = cloudEnabled && !user;

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

        {/* Desktop nav — 5 anchors: Journey · Search Homes · Tools ▾ · My Deal ▾ · Start free */}
        <nav className="hidden items-center gap-5 lg:flex">
          {PRIMARY_LINKS.map((link) => (
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

          <NavGroup label="Tools" items={TOOLS_ITEMS} />

          {showMyDeal ? (
            <NavGroup label="My Deal" items={MY_DEAL_ITEMS}>
              <DealSwitcher />
            </NavGroup>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          {/* Signed-out + cloud-enabled: a simple Sign in (AuthMenu self-gates). */}
          {showSignIn ? (
            <span className="hidden lg:inline-flex">
              <AuthMenu />
            </span>
          ) : null}

          <Link href="/journey" className="btn-primary hidden sm:inline-flex">
            Start free
          </Link>

          {/* Mobile menu toggle — "More" overflow for secondary items. */}
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

      {/* Mobile nav panel — primary movement lives in the bottom tab bar (#87);
          this panel is the full menu (everything reachable), opened from ☰. */}
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-slate-200 bg-white lg:hidden"
        >
          <div className="container-page flex flex-col py-2">
            <MobileSection title="Get started">
              {PRIMARY_LINKS.map((link) => (
                <MobileLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                  onClick={() => setOpen(false)}
                />
              ))}
            </MobileSection>

            <MobileSection title="Tools">
              {TOOLS_ITEMS.map((link) => (
                <MobileLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                  onClick={() => setOpen(false)}
                />
              ))}
            </MobileSection>

            {showMyDeal ? (
              <MobileSection title="My Deal">
                <div className="px-2 py-2">
                  <DealSwitcher />
                </div>
                {MY_DEAL_ITEMS.map((link) => (
                  <MobileLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={pathname === link.href}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </MobileSection>
            ) : null}

            <MobileSection title="Resources">
              {SECONDARY_ITEMS.map((link) => (
                <MobileLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                  onClick={() => setOpen(false)}
                />
              ))}
              {showSignIn ? (
                <div className="px-2 py-2">
                  <AuthMenu onNavigate={() => setOpen(false)} />
                </div>
              ) : null}
            </MobileSection>

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

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 py-2 first:border-t-0">
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function MobileLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-2 py-3 text-base font-medium transition hover:bg-slate-50 ${
        active ? "text-brand-700" : "text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
