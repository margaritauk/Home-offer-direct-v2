"use client";

import { useState } from "react";
import { buildICS, ICS_MIME, icsFilename } from "@/lib/tools/ics";
import type { Milestone } from "@/lib/deadlines";

/**
 * "Export deadlines (.ics)" affordance for the tracker (A8). Generates the
 * calendar file client-side (Blob download — no account, no server) from the
 * tracker's computed milestones.
 *
 * - Disabled with an accessible explanation when there are no dated deadlines
 *   yet (not just dimmed).
 * - Per-deadline export and an "export all" button.
 * - "Exported" confirmation announced via `aria-live`.
 *
 * Convenience export, not the legal deadline of record — the contract governs.
 */

function download(milestones: Milestone[], filename: string) {
  if (typeof window === "undefined") return;
  const ics = buildICS(milestones, { calendarName: "Home purchase deadlines" });
  const blob = new Blob([ics], { type: ICS_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function TrackerIcsExport({ milestones }: { milestones: Milestone[] }) {
  const [status, setStatus] = useState("");
  const hasDeadlines = milestones.length > 0;

  const exportAll = () => {
    download(milestones, icsFilename("home-purchase-deadlines"));
    setStatus("Exported all deadlines to a calendar file.");
  };

  const exportOne = (m: Milestone) => {
    download([m], icsFilename(m.label));
    setStatus(`Exported “${m.label}” to a calendar file.`);
  };

  return (
    <section className="card space-y-3" aria-label="Calendar export">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Add to calendar</h2>
          <p className="text-sm text-ink-muted">
            Export your deadlines to Apple, Google, or Outlook with a day-before
            reminder. A convenience copy — your signed contract governs.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={exportAll}
          disabled={!hasDeadlines}
          aria-describedby={hasDeadlines ? undefined : "ics-export-help"}
        >
          Export deadlines (.ics)
        </button>
      </div>

      {!hasDeadlines ? (
        <p id="ics-export-help" className="text-sm text-ink-soft">
          Set your contract date to enable calendar export.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-soft">{m.label}</span>
              <button
                type="button"
                className="font-medium text-brand-700 hover:underline"
                onClick={() => exportOne(m)}
              >
                Add to calendar
              </button>
            </li>
          ))}
        </ul>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </section>
  );
}
