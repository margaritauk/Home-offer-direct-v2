"use client";

import { useState } from "react";
import { isAiExplainerOffered } from "@/lib/ai/explainer/client-flag";

/**
 * Shared in-place AI explainer panel (S7-AI2), reusing the proven #36/#57
 * surface verbatim: a secondary button → "Explaining…" → an indigo box under a
 * LOUD uppercase label, with the "only restates the factors above" note and a
 * licensed-professional handoff.
 *
 * DEFAULT-OFF: when `NEXT_PUBLIC_AI_EXPLAINER` is unset, the whole AI surface is
 * a gray "Coming soon" pill — never the button. The server route ALSO gates
 * independently (`isAiExplainerActive`), so the client flag alone never turns it
 * on. The narration comes back already screened (`screenOutput`) by the provider;
 * if it failed/was blocked the panel degrades to the deterministic read.
 */

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "unavailable" }
  | { status: "error" };

const OFFERED = isAiExplainerOffered();

export function InPlaceExplainer({
  endpoint,
  body,
  buttonLabel,
  loudLabel,
  restatesNote,
  handoffHref,
  handoffLabel,
  ariaLabel,
}: {
  /** The route to POST to (e.g. "/api/offer/price-band/explain"). */
  endpoint: string;
  /** The grounding payload the route re-runs into OUR deterministic numbers. */
  body: Record<string, unknown>;
  buttonLabel: string;
  /** The LOUD uppercase production label. */
  loudLabel: string;
  /** The "only restates the factors above" sentence. */
  restatesNote: string;
  handoffHref: string;
  handoffLabel: string;
  ariaLabel: string;
}) {
  const [ai, setAi] = useState<AiState>({ status: "idle" });

  // Default-OFF "Coming soon" — render the pill, never the button.
  if (!OFFERED) {
    return (
      <p className="text-sm text-ink-soft">
        AI explanation{" "}
        <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-ink-soft">
          Coming soon
        </span>
      </p>
    );
  }

  const explainWithAI = async () => {
    setAi({ status: "loading" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        available?: boolean;
        explanation?: { text: string } | null;
      };
      if (!data.available || !data.explanation) {
        setAi({ status: "unavailable" });
        return;
      }
      setAi({ status: "done", text: data.explanation.text });
    } catch {
      setAi({ status: "error" });
    }
  };

  return (
    <section aria-label={ariaLabel} className="space-y-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={explainWithAI}
        disabled={ai.status === "loading"}
      >
        {ai.status === "loading" ? "Explaining…" : buttonLabel}
      </button>

      {ai.status === "done" ? (
        <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
          <p className="font-semibold uppercase tracking-wide text-indigo-900">
            {loudLabel}
          </p>
          <p className="whitespace-pre-line">{ai.text}</p>
          <p className="text-xs text-indigo-900/80">
            {restatesNote}{" "}
            <a
              href={handoffHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              {handoffLabel}
            </a>{" "}
            before you act.
          </p>
        </div>
      ) : null}

      {ai.status === "unavailable" ? (
        <p className="text-sm text-ink-soft">
          The AI explainer isn&apos;t available right now. The read above still
          covers this.
        </p>
      ) : null}

      {ai.status === "error" ? (
        <p className="text-sm text-ink-soft">
          Something went wrong reaching the AI explainer. The read above still
          covers this.
        </p>
      ) : null}
    </section>
  );
}
