"use client";

import { useEffect, useRef, useState } from "react";
import { useOffer } from "@/hooks/use-offer";
import { track } from "@/lib/analytics";
import { savingsBucket } from "@/lib/analytics/events";
import { OfferDisclaimer } from "./offer-disclaimer";
import {
  DatesStep,
  FinancingStep,
  PriceStep,
  PropertyStep,
} from "./basics-steps";
import { ContingenciesStep } from "./contingencies-step";
import { ConcessionStep } from "./concession-step";
import { DeadlinesStep } from "./deadlines-step";
import { TermSheetSummary } from "./term-sheet-summary";
import { TermSheetPreview } from "./term-sheet-preview";
import { OfferStrength } from "./offer-strength";
import { SuggestedRangeStep } from "./suggested-range-step";

const STEPS = [
  "Price & deposit",
  "Suggested range",
  "Financing",
  "Dates & possession",
  "Fixtures & costs",
  "Contingencies",
  "Commission savings",
  "Deadlines",
  "Worksheet",
] as const;

/**
 * The Offer Creation Wizard shell (issue #12): a multi-step form over the
 * offer worksheet with a progress indicator and automatic save/resume (every
 * field change persists via useOffer -> localStorage + cloud sync seam).
 *
 * The whole flow is framed as a worksheet for an attorney (#17): the disclaimer
 * is shown on every step and the final step is an on-screen term-sheet summary.
 */
export function OfferWizard() {
  const { offer, hydrated, update, setContingency, reset } = useOffer();
  const [step, setStep] = useState(0);
  // On the final Worksheet step, the buyer can switch between the on-screen
  // summary and the watermarked document preview (issue #37).
  const [worksheetView, setWorksheetView] = useState<"summary" | "preview">("summary");

  const last = STEPS.length - 1;
  const progress = Math.round((step / last) * 100);

  // Funnel: offer-builder start (once per mount, after hydration).
  const startedRef = useRef(false);
  useEffect(() => {
    if (hydrated && !startedRef.current) {
      startedRef.current = true;
      track("offer_builder_started", {});
    }
  }, [hydrated]);

  // North-star: offer-builder completion when the buyer reaches the Worksheet.
  const completedRef = useRef(false);
  useEffect(() => {
    if (step === last && !completedRef.current) {
      completedRef.current = true;
      const hasConcessionAsk =
        offer.concession.type !== "none" && offer.concession.percent > 0;
      const estCaptured =
        hasConcessionAsk && offer.price > 0
          ? (offer.price * offer.concession.percent) / 100
          : 0;
      track("offer_builder_completed", {
        hasConcessionAsk,
        savingsBucket: savingsBucket(estCaptured),
      });
    }
  }, [step, last, offer]);

  return (
    <div className="space-y-6">
      <OfferDisclaimer />

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <span className="text-ink-muted">{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {hydrated && offer.updatedAt ? (
          <p className="mt-2 text-xs text-ink-muted" suppressHydrationWarning>
            Saved automatically — you can leave and resume anytime.
          </p>
        ) : null}
      </div>

      {/* Step body */}
      <div className="card">
        <h2 className="text-xl font-bold">{STEPS[step]}</h2>
        <div className="mt-4">
          {step === 0 ? <PriceStep offer={offer} onChange={update} hydrated={hydrated} /> : null}
          {step === 1 ? <SuggestedRangeStep listPrice={offer.price || undefined} /> : null}
          {step === 2 ? <FinancingStep offer={offer} onChange={update} hydrated={hydrated} /> : null}
          {step === 3 ? <DatesStep offer={offer} onChange={update} hydrated={hydrated} /> : null}
          {step === 4 ? <PropertyStep offer={offer} onChange={update} hydrated={hydrated} /> : null}
          {step === 5 ? (
            <ContingenciesStep
              contingencies={offer.contingencies}
              onChange={setContingency}
              hydrated={hydrated}
            />
          ) : null}
          {step === 6 ? <ConcessionStep offer={offer} onChange={update} hydrated={hydrated} /> : null}
          {step === 7 ? <DeadlinesStep offer={offer} /> : null}
          {step === 8 ? (
            <div className="space-y-4">
              <div
                role="tablist"
                aria-label="Worksheet view"
                className="inline-flex rounded-lg border border-slate-300 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={worksheetView === "summary"}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    worksheetView === "summary"
                      ? "bg-brand-600 text-white"
                      : "text-ink-soft hover:text-ink"
                  }`}
                  onClick={() => setWorksheetView("summary")}
                >
                  Summary
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={worksheetView === "preview"}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    worksheetView === "preview"
                      ? "bg-brand-600 text-white"
                      : "text-ink-soft hover:text-ink"
                  }`}
                  onClick={() => setWorksheetView("preview")}
                >
                  Preview document
                </button>
              </div>

              {worksheetView === "summary" ? (
                <TermSheetSummary offer={offer} />
              ) : (
                <TermSheetPreview offer={offer} />
              )}

              <OfferStrength offer={offer} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-sm font-medium text-ink-muted hover:text-ink"
            onClick={reset}
          >
            Start over
          </button>
          {step < last ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep((s) => Math.min(last, s + 1))}
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
