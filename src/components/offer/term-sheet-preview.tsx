"use client";

import { buildTermSheet, concessionScript } from "@/lib/offer/term-sheet";
import type { Offer } from "@/lib/offer/types";
import { OfferDisclaimer } from "./offer-disclaimer";

/**
 * Watermarked, print-styled document preview of the offer term-sheet (issue
 * #37, free tier of the monetization flow). It reuses {@link buildTermSheet}
 * so the content matches the on-screen summary, but lays it out like a formal
 * document and overlays a visible diagonal "HomeOffer Direct — SAMPLE"
 * watermark.
 *
 * Guardrails:
 *   - UPL (#17): the persistent attorney-review disclaimer is always shown; the
 *     document is framed as a worksheet, never a binding contract.
 *   - Monetization (#37/#40): the "Remove watermark & export" CTA is the free
 *     tier's upsell. It is intentionally DISABLED / "Coming soon" here — the
 *     paid export flow lives in #40/#41 and is out of scope for this story.
 */
export function TermSheetPreview({ offer }: { offer: Offer }) {
  const sheet = buildTermSheet(offer);
  const script = concessionScript(offer);

  return (
    <div className="space-y-4">
      <OfferDisclaimer />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Document preview</h3>
        <button
          type="button"
          className="btn-primary"
          disabled
          aria-disabled="true"
          title="The clean, watermark-free export is coming soon."
        >
          Remove watermark &amp; export
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
            Coming soon
          </span>
        </button>
      </div>

      {/* The watermarked "paper" document. The watermark layer sits above the
          content via a pseudo-positioned overlay; pointer-events-none keeps the
          text selectable underneath. */}
      <div
        data-testid="term-sheet-document"
        className="term-sheet-document relative overflow-hidden rounded-xl border border-slate-300 bg-white p-8 shadow-md sm:p-12"
      >
        {/* Diagonal repeating watermark overlay (CSS). */}
        <div
          data-testid="term-sheet-watermark"
          aria-hidden="true"
          className="term-sheet-watermark pointer-events-none absolute inset-0 z-10 flex select-none items-center justify-center"
        >
          <span className="rotate-[-30deg] whitespace-nowrap text-4xl font-black uppercase tracking-widest text-slate-900/10 sm:text-5xl">
            HomeOffer Direct — SAMPLE
          </span>
        </div>

        <div className="relative z-0">
          <header className="border-b-2 border-slate-900 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              HomeOffer Direct
            </p>
            <h4 className="mt-1 text-2xl font-bold text-ink">Offer worksheet</h4>
            <p className="mt-1 text-sm text-ink-muted">
              Worksheet — not a binding contract; subject to attorney review.
            </p>
          </header>

          <dl className="mt-6 space-y-6">
            {sheet.sections.map((section) => (
              <div key={section.heading}>
                <dt className="text-sm font-bold uppercase tracking-wide text-ink">
                  {section.heading}
                </dt>
                <div className="mt-2 divide-y divide-slate-100 text-sm">
                  {section.lines.map((line) => (
                    <div
                      key={line.label}
                      className="flex items-start justify-between gap-4 py-1.5"
                    >
                      <span className="text-ink-soft">{line.label}</span>
                      <span className="text-right font-medium text-ink">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </dl>

          {script ? (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-sm font-bold uppercase tracking-wide text-ink">
                Suggested ask (adapt with your attorney)
              </p>
              <p className="mt-2 text-sm italic text-ink-soft">&ldquo;{script}&rdquo;</p>
            </div>
          ) : null}

          <footer className="mt-8 border-t-2 border-slate-900 pt-3">
            <p className="text-xs text-ink-muted">{sheet.disclaimer}</p>
          </footer>
        </div>
      </div>

      <OfferDisclaimer />
    </div>
  );
}
