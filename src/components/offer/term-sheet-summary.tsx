"use client";

import { useState } from "react";
import { buildTermSheet, concessionScript, termSheetToText } from "@/lib/offer/term-sheet";
import type { Offer } from "@/lib/offer/types";
import { OfferDisclaimer } from "./offer-disclaimer";

/**
 * On-screen term-sheet summary of every value entered in the wizard (issue #12).
 * Worksheet framing only (#17): leads and closes with the attorney-review
 * disclaimer and offers a plain-text copy "for your attorney".
 */
export function TermSheetSummary({ offer }: { offer: Offer }) {
  const [copied, setCopied] = useState(false);
  const sheet = buildTermSheet(offer);
  const script = concessionScript(offer);

  async function copy() {
    try {
      await navigator.clipboard.writeText(termSheetToText(offer));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="space-y-4 print-area">
      <OfferDisclaimer />

      <div className="card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Your offer worksheet</h3>
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={copy}>
              {copied ? "Copied" : "Copy for your attorney"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

        <dl className="space-y-5">
          {sheet.sections.map((section) => (
            <div key={section.heading}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {section.heading}
              </dt>
              <div className="mt-2 space-y-1.5 text-sm">
                {section.lines.map((line) => (
                  <div key={line.label} className="flex items-start justify-between gap-4">
                    <span className="text-ink-soft">{line.label}</span>
                    <span className="text-right font-medium text-ink">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </dl>

        {script ? (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Suggested ask (adapt with your attorney)
            </p>
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm italic text-ink-soft">
              &ldquo;{script}&rdquo;
            </p>
          </div>
        ) : null}
      </div>

      <OfferDisclaimer />
    </div>
  );
}
