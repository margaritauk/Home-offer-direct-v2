"use client";

import { useState } from "react";
import { ShowingsTracker } from "./showings-tracker";
import { ShowingsCalendar } from "./showings-calendar";

type View = "list" | "calendar";

/**
 * List / Calendar switch for the showings page (issue #28). Keeps the existing
 * tracker as the default view and adds the calendar as an additive, discoverable
 * tab. Both read the same `useShowings` store, so they stay in sync.
 */
export function ShowingsViews() {
  const [view, setView] = useState<View>("list");

  const tab = (value: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={
        view === value
          ? "rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white"
          : "rounded-lg px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-100"
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div
        className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
        role="group"
        aria-label="Showings view"
      >
        {tab("list", "List")}
        {tab("calendar", "Calendar")}
      </div>

      {view === "list" ? <ShowingsTracker /> : <ShowingsCalendar />}
    </div>
  );
}
