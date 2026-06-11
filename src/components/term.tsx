"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { glossaryBySlug } from "@/lib/glossary";

/**
 * Inline glossary primitive (issue #157). Wrap a term in tool copy —
 * `<Term slug="piti">PITI</Term>` — to render it as a dotted-underline button
 * that toggles a small popover with the plain-English definition plus a link to
 * the full glossary entry.
 *
 * - Copy is single-sourced from `glossaryBySlug`; nothing is hardcoded here.
 * - Unknown slug → renders the child text only (no button, no popover), so a
 *   typo degrades gracefully to plain text rather than a dead control.
 * - Accessible: real `<button type="button">` with `aria-expanded` and
 *   `aria-describedby` wired to the popover (`useId()`); Escape closes and
 *   returns focus to the trigger; outside click/blur closes too. Focus-visible
 *   ring reuses the brand design tokens (same recipe as `.btn`/`.field`).
 */
export function Term({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const entry = glossaryBySlug[slug];
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Escape closes and returns focus to the trigger; outside click/focus closes.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Unknown slug → degrade to plain text.
  if (!entry) {
    return <>{children}</>;
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help rounded-sm underline decoration-dotted decoration-1 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        {children}
      </button>
      {open ? (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-2 block w-72 max-w-[18rem] rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-normal text-ink-soft shadow-lg"
        >
          <span className="block font-semibold text-ink">{entry.term}</span>
          <span className="mt-1 block">{entry.definition}</span>
          <a
            href={`/glossary#${entry.slug}`}
            className="mt-2 inline-block font-medium text-brand-700 hover:underline"
          >
            Full glossary →
          </a>
        </span>
      ) : null}
    </span>
  );
}
