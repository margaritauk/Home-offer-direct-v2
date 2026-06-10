"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { CREDIBILITY_DOCS, DISCLOSURE_TIP } from "@/lib/showings/credibility";

interface PrepState {
  /** Doc id → ready. */
  ready: Record<string, boolean>;
}

const INITIAL: PrepState = { ready: {} };

function normalize(raw: PrepState): PrepState {
  return {
    ready: raw && raw.ready && typeof raw.ready === "object" ? raw.ready : {},
  };
}

/**
 * "Before you reach out" credibility checklist (#21). Helps an unrepresented
 * buyer line up the documents that make a listing agent take them seriously,
 * with the guardrail to share that they're pre-approved without revealing their
 * max budget (#22). Persists per-device via useStageTool.
 */
export function PreApprovalPrep() {
  const { value, hydrated, save } = useStageTool<PrepState>(
    "showing-prep",
    INITIAL,
  );
  const state = useMemo(() => normalize(value), [value]);

  const readyCount = CREDIBILITY_DOCS.filter((d) => state.ready[d.id]).length;

  const toggle = (id: string) =>
    save((prev) => {
      const cur = normalize(prev);
      return { ...cur, ready: { ...cur.ready, [id]: !cur.ready[id] } };
    });

  if (!hydrated) return null;

  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h2 className="text-lg font-semibold">Before you reach out: get credible</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Have these ready so a listing agent takes you seriously and books the
        showing faster.{" "}
        <span className="font-medium text-ink-muted">
          {readyCount}/{CREDIBILITY_DOCS.length} ready
        </span>
      </p>

      <ul className="mt-4 space-y-2">
        {CREDIBILITY_DOCS.map((doc) => {
          const ready = Boolean(state.ready[doc.id]);
          return (
            <li key={doc.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-300">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand-600"
                  checked={ready}
                  onChange={() => toggle(doc.id)}
                />
                <span>
                  <span
                    className={`block text-sm font-medium ${ready ? "text-ink-muted line-through" : "text-ink"}`}
                  >
                    {doc.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {doc.note}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <span className="font-semibold">Keep your cards close: </span>
        {DISCLOSURE_TIP}
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Keep your documents organized in the{" "}
        <Link href="/tracker" className="font-medium text-brand-700 hover:underline">
          document tracker
        </Link>
        .
      </p>
    </section>
  );
}
