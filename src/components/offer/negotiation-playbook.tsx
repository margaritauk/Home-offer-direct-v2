"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { TrustCallout } from "@/components/trust-callout";
import { formatUSD } from "@/lib/savings";
import { summarizeFindings, type Finding } from "@/lib/tools/inspection";
import {
  ANCHORING_AND_CONCESSIONS,
  NON_PRICE_LEVERS,
  READING_A_COUNTER,
  WALK_AWAY_DISCIPLINE,
  summarizeRepairLeverage,
  type PlaybookEntry,
} from "@/lib/tools/negotiation-playbook";

/**
 * Negotiation playbook (I2) — surfaced beside the Counter-offer Tracker and on
 * /tools/offer-help.
 *
 * Educational only: how to read a counter, anchoring/concessions, the non-price
 * lever menu, repair leverage from the inspection summary, and walk-away
 * discipline tied to the PRIVATE walk-away max the Counter-offer Tracker already
 * stores. The walk-away number is read for a quiet, private reminder and is NEVER
 * placed into any output, template, or seller-facing surface.
 */

interface InspectionStateLike {
  findings: Finding[];
}
interface CounterStateLike {
  maxPrice: number;
}

export function NegotiationPlaybook() {
  // Read-only consumers of the two existing tools' stored state.
  const inspection = useStageTool<InspectionStateLike>("inspection", {
    findings: [],
  });
  const counter = useStageTool<CounterStateLike>("counter-offer", {
    maxPrice: 0,
  });

  const repairLeverage = useMemo(
    () => summarizeRepairLeverage(summarizeFindings(inspection.value.findings ?? [])),
    [inspection.value.findings],
  );

  const walkAwayMax =
    counter.value.maxPrice > 0 ? counter.value.maxPrice : null;

  return (
    <section className="space-y-10" aria-label="Negotiation playbook">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Negotiation playbook</h2>
        <p className="mt-3 text-ink-soft">
          After an offer, this is how buyers hold the value an agent would help
          them negotiate — reading a counter, trading non-price levers, using
          inspection leverage, and knowing when to walk. Principles and
          trade-offs only; we never tell you to &quot;counter at $X.&quot;
        </p>
      </div>

      <PlaybookGroup title="Reading a counter" entries={READING_A_COUNTER} />
      <PlaybookGroup
        title="Anchoring & concessions"
        entries={ANCHORING_AND_CONCESSIONS}
      />
      <PlaybookGroup
        title="Levers beyond price"
        entries={NON_PRICE_LEVERS}
      />

      {/* Repair-negotiation leverage from the inspection summary */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-ink">
          Repair-negotiation leverage
        </h3>
        <div className="card space-y-2" data-testid="repair-leverage">
          {repairLeverage.lines.map((line) => (
            <p key={line} className="text-sm text-ink-soft">
              {line}
            </p>
          ))}
          {repairLeverage.hasLeverage ? (
            <Link
              href="/tools/repair-request"
              className="inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Turn findings into a neutral repair-or-credit request →
            </Link>
          ) : (
            <Link
              href="/tools/inspection"
              className="inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Open the Inspection Findings logger →
            </Link>
          )}
        </div>
      </div>

      {/* Walk-away discipline — tied to the private walk-away max */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-ink">Walk-away discipline</h3>
        {walkAwayMax !== null ? (
          <TrustCallout tone="warning" title="Your private walk-away max">
            You&apos;ve set a private walk-away max of {formatUSD(walkAwayMax)} in
            the Counter-offer Tracker. Keep it to yourself — it never goes into a
            counter, a script, or anything the seller sees. Once the live price
            would cross it, walking is a discipline, not a failure.
          </TrustCallout>
        ) : (
          <p className="text-sm text-ink-soft">
            Set a private walk-away max in the{" "}
            <Link
              href="/tools/counter-offer"
              className="font-medium text-brand-700 hover:underline"
            >
              Counter-offer Tracker
            </Link>{" "}
            before you negotiate. Decide your ceiling while you&apos;re calm, keep
            it private, and let it govern your responses.
          </p>
        )}
        <PlaybookGroup title="" entries={WALK_AWAY_DISCIPLINE} />
      </div>
    </section>
  );
}

function PlaybookGroup({
  title,
  entries,
}: {
  title: string;
  entries: PlaybookEntry[];
}) {
  return (
    <div className="space-y-3">
      {title ? (
        <h3 className="text-xl font-bold text-ink">{title}</h3>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <article key={entry.id} className="card space-y-2">
            <h4 className="text-base font-bold text-ink">{entry.title}</h4>
            <p className="text-sm text-ink-soft">{entry.body}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Trade-off
              </p>
              <p className="mt-1 text-sm text-ink-soft">{entry.tradeoff}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
