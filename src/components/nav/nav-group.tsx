"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavGroupItem {
  href: string;
  label: string;
}

/**
 * Accessible desktop dropdown menu for a group of nav destinations (#85).
 *
 * Keyboard: Enter/Space/ArrowDown opens and focuses the first item; Escape
 * closes and returns focus to the trigger; ArrowUp/ArrowDown move between items;
 * Home/End jump to first/last. Closes on outside-click and on Escape. Uses
 * `aria-haspopup`/`aria-expanded`/`aria-controls` and a `menu`/`menuitem` shape.
 *
 * The trigger reads "active" when the current route matches the group label
 * (`labelActive`) OR any item href, so e.g. `/tracker` highlights "Tools".
 * `children` is rendered above the link items — used to host the DealSwitcher
 * inside the "My Deal" group.
 */
export function NavGroup({
  label,
  items,
  children,
  labelActive,
}: {
  label: string;
  items: NavGroupItem[];
  children?: React.ReactNode;
  /** Force the trigger into the active state regardless of route. */
  labelActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isActive =
    Boolean(labelActive) || items.some((i) => pathname === i.href);

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus to the first item when opened via keyboard.
  const focusItem = useCallback((index: number) => {
    const links = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]',
    );
    if (!links || links.length === 0) return;
    const clamped = (index + links.length) % links.length;
    links[clamped]?.focus();
  }, []);

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(-1));
    } else if (e.key === "Escape") {
      close();
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const links = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(currentIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(currentIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(-1);
    } else if (e.key === "Tab") {
      // Let focus leave naturally but close the menu.
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center gap-1 text-sm font-medium transition hover:text-brand-700 ${
          isActive ? "text-brand-700" : "text-ink-soft"
        }`}
      >
        {label}
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {children ? (
            <div className="border-b border-slate-100 px-2 py-2">{children}</div>
          ) : null}
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none ${
                pathname === item.href
                  ? "font-semibold text-brand-700"
                  : "text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
