"use client";

import { useEffect, useState } from "react";

/**
 * Inline "undo a destructive action" affordance (issue #152). Mirrors the
 * dismissible `whats-next` banner styling (brand-tinted rounded strip) and is
 * deliberately reusable across the per-stage tools and the tracker.
 *
 * - Renders nothing when `show` is false.
 * - Auto-hides after ~10s; the timer is cleared on unmount or when `show`
 *   toggles. Auto-hide only affects local visibility — the underlying undo
 *   snapshot is owned by the hook, so re-triggering a reset re-shows it.
 * - Accessible: `role="status"` so the row is announced, and a real `<button>`
 *   for Undo.
 */
const AUTO_HIDE_MS = 10_000;

export function UndoToast({
  show,
  onUndo,
  label = "Reset",
  onDismiss,
}: {
  show: boolean;
  onUndo: () => void;
  label?: string;
  onDismiss?: () => void;
}) {
  // Local auto-hide so the strip disappears even if the snapshot lingers.
  const [hidden, setHidden] = useState(false);

  // Reset local visibility whenever a new undo opportunity appears.
  useEffect(() => {
    if (show) setHidden(false);
  }, [show]);

  useEffect(() => {
    if (!show || hidden) return;
    const t = setTimeout(() => {
      setHidden(true);
      onDismiss?.();
    }, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [show, hidden, onDismiss]);

  if (!show || hidden) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"
    >
      <p className="text-sm text-brand-900">
        {label} — your previous values can be restored.
      </p>
      <button
        type="button"
        onClick={() => {
          onUndo();
          setHidden(true);
        }}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Undo
      </button>
    </div>
  );
}
