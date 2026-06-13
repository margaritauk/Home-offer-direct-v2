"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthMenu } from "@/components/auth-menu";
import { DealSwitcher } from "@/components/deal-switcher";
import {
  MY_DEAL_ITEMS,
  SECONDARY_ITEMS,
  TOOLS_ITEMS,
} from "@/components/nav/nav-config";
import { isDealsEnabled } from "@/lib/supabase/config";
import { useAuth } from "@/hooks/use-auth";
import type { NavGroupItem } from "@/components/nav/nav-group";

/**
 * Fixed bottom tab bar for mobile (#87): Journey · Search · Tools · My Deal +
 * More. Desktop is untouched (`lg:hidden`). Tabs that map to a group open a
 * bottom sheet listing that group's items; single-route tabs link directly.
 * Safe-area aware via env(safe-area-inset-bottom); the layout adds matching
 * bottom padding so content/footer is never covered.
 */

type Sheet = "tools" | "deal" | "more" | null;

function routeActive(pathname: string, hrefs: string[]): boolean {
  return hrefs.some((h) => pathname === h || pathname.startsWith(`${h}/`));
}

export function MobileTabBar() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<Sheet>(null);
  const { user } = useAuth();

  const showMyDeal = isDealsEnabled() && Boolean(user);

  const closeSheet = useCallback(() => setSheet(null), []);

  // Close the sheet whenever the route changes (after a tap navigates).
  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  const journeyActive = routeActive(pathname, ["/journey"]);
  const searchActive = routeActive(pathname, ["/listings"]);
  const toolsActive =
    sheet === "tools" || routeActive(pathname, TOOLS_ITEMS.map((i) => i.href));
  const dealActive =
    sheet === "deal" || routeActive(pathname, MY_DEAL_ITEMS.map((i) => i.href));

  const moreItems: NavGroupItem[] = showMyDeal
    ? SECONDARY_ITEMS
    : [...SECONDARY_ITEMS];

  return (
    <>
      {sheet ? (
        <TabSheet
          title={sheet === "tools" ? "Tools" : sheet === "deal" ? "My Deal" : "More"}
          onClose={closeSheet}
        >
          {sheet === "tools" ? <SheetLinks items={TOOLS_ITEMS} pathname={pathname} /> : null}
          {sheet === "deal" ? (
            <>
              <div className="px-2 pb-3">
                <DealSwitcher />
              </div>
              <SheetLinks items={MY_DEAL_ITEMS} pathname={pathname} />
            </>
          ) : null}
          {sheet === "more" ? (
            <>
              <SheetLinks items={moreItems} pathname={pathname} />
              <div className="px-2 pt-2">
                <AuthMenu onNavigate={closeSheet} />
              </div>
            </>
          ) : null}
        </TabSheet>
      ) : null}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5">
          <li>
            <TabLink href="/journey" label="Journey" icon="🧭" active={journeyActive} />
          </li>
          <li>
            <TabLink href="/listings" label="Search" icon="🔍" active={searchActive} />
          </li>
          <li>
            <TabButton
              label="Tools"
              icon="🧰"
              active={toolsActive}
              expanded={sheet === "tools"}
              onClick={() => setSheet((s) => (s === "tools" ? null : "tools"))}
            />
          </li>
          <li>
            {showMyDeal ? (
              <TabButton
                label="My Deal"
                icon="📂"
                active={dealActive}
                expanded={sheet === "deal"}
                onClick={() => setSheet((s) => (s === "deal" ? null : "deal"))}
              />
            ) : (
              <TabLink
                href="/dashboard"
                label="Dashboard"
                icon="📂"
                active={routeActive(pathname, ["/dashboard"])}
              />
            )}
          </li>
          <li>
            <TabButton
              label="More"
              icon="⋯"
              active={sheet === "more"}
              expanded={sheet === "more"}
              onClick={() => setSheet((s) => (s === "more" ? null : "more"))}
            />
          </li>
        </ul>
      </nav>
    </>
  );
}

function tabClass(active: boolean): string {
  // #166: ≥44px tap target — py-2.5 plus the icon/label keeps every tab over the
  // 44px minimum on mobile.
  return `flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[11px] font-medium transition ${
    active ? "text-brand-700" : "text-ink-muted"
  }`;
}

function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
      <span aria-hidden className="text-lg leading-none">
        {icon}
      </span>
      {label}
    </Link>
  );
}

function TabButton({
  label,
  icon,
  active,
  expanded,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={expanded}
      className={tabClass(active)}
    >
      <span aria-hidden className="text-lg leading-none">
        {icon}
      </span>
      {label}
    </button>
  );
}

function TabSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const headingId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-ink"
            aria-label="Close menu"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetLinks({
  items,
  pathname,
}: {
  items: NavGroupItem[];
  pathname: string;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`block rounded-lg px-3 py-3 text-base font-medium transition hover:bg-slate-50 ${
              pathname === item.href ? "text-brand-700" : "text-ink"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
