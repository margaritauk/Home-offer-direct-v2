"use client";

import { useMemo, useState } from "react";
import { explainOfferStrength, type StrengthTone } from "@/lib/offer/strength";
import { isAiExplainerOffered } from "@/lib/ai/explainer/client-flag";
import type { Offer } from "@/lib/offer/types";

const TONES: Record<StrengthTone, string> = {
  strength: "border-emerald-200 bg-emerald-50 text-emerald-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-ink-soft",
};

/**
 * Whether the UI is allowed to OFFER the AI explainer action (default false, so
 * the surface stays "Coming soon"). The server still gates independently, so
 * this flag alone never turns the feature on (issue #36).
 */
const AI_EXPLAINER_OFFERED = isAiExplainerOffered();

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string; basis: string[] }
  | { status: "unavailable" }
  | { status: "error" };

/**
 * Deterministic offer-strength explainer (#126). Narrates the buyer's own terms
 * into "what reads as stronger / what to weigh" notes — education only, never a
 * recommendation on what to offer or waive.
 *
 * When `NEXT_PUBLIC_AI_EXPLAINER === "true"` (issue #36), it ALSO offers an
 * optional AI plain-English summary, POSTed to `/api/offer/explain` (which gates
 * independently and grounds the model in these same deterministic factors). The
 * AI output is rendered under a LOUD "educational only, not advice, no
 * acceptance guarantee" label with an attorney/pro handoff. With the flag unset,
 * none of the AI surface renders — the component behaves exactly as before.
 */
export function OfferStrength({ offer }: { offer: Offer }) {
  const insights = useMemo(() => explainOfferStrength(offer), [offer]);
  const [ai, setAi] = useState<AiState>({ status: "idle" });

  if (insights.length === 0) return null;

  const explainWithAI = async () => {
    setAi({ status: "loading" });
    try {
      const res = await fetch("/api/offer/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer }),
      });
      const data = (await res.json()) as {
        available?: boolean;
        explanation?: { text: string; basis: string[] } | null;
      };
      if (!data.available) {
        setAi({ status: "unavailable" });
        return;
      }
      if (!data.explanation) {
        // Provider failed or its output was blocked by FHA screening.
        setAi({ status: "unavailable" });
        return;
      }
      setAi({
        status: "done",
        text: data.explanation.text,
        basis: data.explanation.basis,
      });
    } catch {
      setAi({ status: "error" });
    }
  };

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

      <div className="pt-2">
        {AI_EXPLAINER_OFFERED ? (
          <div className="space-y-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={explainWithAI}
              disabled={ai.status === "loading"}
            >
              {ai.status === "loading"
                ? "Explaining…"
                : "Explain my offer's strength (AI)"}
            </button>

            {ai.status === "done" ? (
              <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
                <p className="font-semibold uppercase tracking-wide text-indigo-900">
                  AI-generated, educational only — not legal or financial
                  advice, no acceptance guarantee
                </p>
                <p className="whitespace-pre-line">{ai.text}</p>
                <p className="text-xs text-indigo-900/80">
                  This summary only restates the factors above and does not
                  recommend what to offer or waive.{" "}
                  <a
                    href="https://www.americanbar.org/groups/legal_services/flh-home/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Talk to a licensed real-estate attorney or professional
                  </a>{" "}
                  before you act.
                </p>
              </div>
            ) : null}

            {ai.status === "unavailable" ? (
              <p className="text-sm text-ink-soft">
                The AI explainer isn&apos;t available right now. The plain-English
                read above still covers your offer.
              </p>
            ) : null}

            {ai.status === "error" ? (
              <p className="text-sm text-ink-soft">
                Something went wrong reaching the AI explainer. The read above
                still covers your offer.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            AI explanation{" "}
            <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-ink-soft">
              Coming soon
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
