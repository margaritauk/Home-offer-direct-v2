"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Focus-on-route-change a11y pattern (UX continuity, Item 2 / S0a).
 *
 * Next App Router client-side navigations don't move focus by default, so
 * keyboard and screen-reader users are stranded at the top of `<body>` after a
 * prev/next or a tool-footer "Next". This hook moves focus to a target heading
 * (default: the destination H1) on every pathname change so the new page's
 * title is announced and is the next tab stop.
 *
 * Usage: attach the returned ref to the heading you want focused, and give that
 * heading `tabIndex={-1}` so it's programmatically focusable without becoming a
 * tab stop:
 *
 *   const headingRef = useFocusOnRouteChange<HTMLHeadingElement>();
 *   <h1 ref={headingRef} tabIndex={-1}>…</h1>
 *
 * `preventScroll` keeps the viewport where the user expects it (the heading is
 * already at the top of the content) rather than yanking the page.
 */
export function useFocusOnRouteChange<
  T extends HTMLElement = HTMLElement,
>(): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Defer to the next frame so the heading is mounted/painted before focus.
    const id = requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return ref;
}
