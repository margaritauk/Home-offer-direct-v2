"use client";

import { useMemo } from "react";
import { explainOfferStrength, type StrengthTone } from "@/lib/offer/strength";
import type { Offer } from "@/lib/offer/types";

const TONES: Record<StrengthTone, string> = {
  strength: "border-emerald-200 bg-emerald-50 text-emerald-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-ink-soft",
};

/**
 * Deterministic offer-strength explainer (#126). Narrates the buyer's own terms
 * into "what reads as stronger / what to weigh" notes — education only, never a
 * recommendation on what to offer or waive.
 */
export function OfferStrength({ offer }: { offer: Offer }) {
  const insights = useMemo(() => explainOfferStrength(offer), [offer]);
  if (insights.length === 0) return null;

  return (
    <section
      aria-label="How your offer reads"
      className="space-y-2 rounded-2xl border border-slate-200 p-5"
    >
      <h3 className="text-lg font-semibold">How your offer reads</h3>
      <p className="text-sm text-ink-soft">
        A plain-English read of the terms you entered — what a seller tends to
        see as stronger or weaker. This is education, not a recommendation on
        what to offer or waive; those choices are yours to make with your
        attorney.
      </p>
      <div className="space-y-2 pt-1">
        {insights.map((i) => (
          <div
            key={i.id}
            className={`rounded-lg border p-3 text-sm ${TONES[i.tone]}`}
          >
            <p className="font-medium">{i.title}</p>
            <p className="mt-0.5">{i.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
