"use client";

import { useRef, useState } from "react";
import { downloadDeal, importDealFile } from "@/lib/deal/export-browser";

/**
 * Device-local export/import of the buyer's whole deal (#163, Sprint C1).
 *
 * GUARDRAIL: everything here stays on the buyer's device. Export writes a .json
 * file straight to their downloads; import reads a file they pick and replaces
 * what's on this device. No upload, no account, no network.
 */
export function DealExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(
    null,
  );

  function onExport() {
    setStatus(null);
    try {
      downloadDeal();
      setStatus({ kind: "ok", message: "Exported. Check your downloads for the .json file." });
    } catch {
      setStatus({ kind: "error", message: "Sorry — the export failed. Please try again." });
    }
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so re-picking the same file fires onChange again.
    e.target.value = "";
    if (!file) return;

    setStatus(null);
    const ok = window.confirm(
      "This replaces what's on this device — continue?",
    );
    if (!ok) return;

    const res = await importDealFile(file);
    if (res.ok) {
      setStatus({ kind: "ok", message: "Imported. Your deal on this device now matches the file." });
    } else {
      setStatus({ kind: "error", message: res.error });
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Move your deal between devices</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Save a copy of everything you&apos;ve entered — your progress, state,
        tracker, offer, showings, and tools — as a single file, or load one back
        in. The file stays on your device: nothing is uploaded, and no account is
        needed.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={onExport}>
          Export my deal (.json)
        </button>
        <button
          type="button"
          className="btn-secondary w-full sm:w-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          Import a deal
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFileChosen}
        />
      </div>

      {status ? (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-4 text-sm ${
            status.kind === "error" ? "text-red-700" : "text-brand-700"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
