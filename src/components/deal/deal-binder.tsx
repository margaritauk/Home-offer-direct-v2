"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collectDeal } from "@/lib/deal/export";
import type { SyncData } from "@/lib/sync/types";
import { getStages } from "@/lib/journey";
import { journeyProgress } from "@/lib/journey/progress";
import { computeMilestones } from "@/lib/deadlines";
import { monthlyPITI, type PitiInput } from "@/lib/budget";
import { calculateSavings, formatUSD, type SavingsInput } from "@/lib/savings";
import {
  compsEstimate,
  normalizeCompsState,
  type InterestedHome,
} from "@/lib/tools/comps";
import { buildTermSheet } from "@/lib/offer/term-sheet";
import { LegalNotice } from "@/components/legal-notice";

/**
 * Printable buyer binder / deal summary (#164, Sprint C2 — companion to the
 * #163 deal export).
 *
 * GUARDRAIL: read-only and device-local. It assembles a single-column summary of
 * everything the buyer has saved — entirely client-side from `collectDeal()`
 * (which snapshots localStorage; no network, no account) — and re-derives the
 * key figures through the SAME pure compute libs the live tools use, so the math
 * can never drift. It is a WORKSHEET: every section carries the estimates-not-
 * advice / subject-to-attorney-review framing (`LegalNotice`), and nothing here
 * is a binding contract or legal/financial advice.
 *
 * Empty states never crash and never fabricate: any section with no saved data
 * shows a muted "Not yet entered" line.
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Muted placeholder shown for any section the buyer hasn't filled in yet. */
function NotYetEntered() {
  return (
    <p className="text-sm italic text-ink-muted" data-testid="not-yet-entered">
      Not yet entered.
    </p>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-section renderers — each re-derives figures from the persisted blob via
// the shared compute libs, and returns the "Not yet entered" placeholder when
// there is nothing to show.
// ---------------------------------------------------------------------------

function BudgetSection({ blob }: { blob: unknown }) {
  // The budget tool persists a BudgetState; only the payment (PITI) inputs are
  // re-derived here. Guard against a missing/garbage blob.
  const piti =
    isRecord(blob) && isRecord(blob.piti)
      ? (blob.piti as unknown as PitiInput)
      : null;

  if (!piti) return <NotYetEntered />;

  const b = monthlyPITI(piti);
  return (
    <dl className="space-y-2">
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Estimated monthly payment
        </p>
        <p className="text-2xl font-bold" data-testid="binder-piti-total">
          {formatUSD(b.total)}/mo
        </p>
      </div>
      <Row label="Principal & interest" value={`${formatUSD(b.pi)}/mo`} />
      <Row label="Property tax" value={`${formatUSD(b.tax)}/mo`} />
      <Row label="Insurance" value={`${formatUSD(b.insurance)}/mo`} />
      <Row label="HOA" value={`${formatUSD(b.hoa)}/mo`} />
      <Row label="PMI" value={`${formatUSD(b.pmi)}/mo`} />
      <Row label="Loan amount" value={formatUSD(b.loanAmount)} />
    </dl>
  );
}

function SavingsSection({ blob }: { blob: unknown }) {
  // The savings tool persists a SavingsInput directly.
  const input =
    isRecord(blob) && typeof blob.homePrice === "number"
      ? (blob as unknown as SavingsInput)
      : null;

  if (!input) return <NotYetEntered />;

  const r = calculateSavings(input);
  return (
    <dl className="space-y-2">
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Commission savings you could capture
        </p>
        <p className="text-2xl font-bold" data-testid="binder-captured-savings">
          {formatUSD(r.capturedSavings)}
        </p>
      </div>
      <Row label="Negotiable buyer-side commission" value={formatUSD(r.negotiableCommission)} />
      <Row label="Cash to close (before savings)" value={formatUSD(r.cashToCloseBefore)} />
      <Row label="Cash to close (after savings)" value={formatUSD(r.cashToCloseAfter)} />
    </dl>
  );
}

function CompsHome({ home }: { home: InterestedHome }) {
  const est = compsEstimate({ sqft: home.sqft }, home.comps);
  const label = home.label.trim() || "Home";
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="font-semibold text-ink">{label}</p>
      {est.estimatedMid !== null ? (
        <p className="mt-1 text-sm text-ink-soft">
          Estimated fair value{" "}
          <span className="font-semibold text-ink">
            {formatUSD(est.estimatedLow ?? 0)} – {formatUSD(est.estimatedHigh ?? 0)}
          </span>{" "}
          (midpoint {formatUSD(est.estimatedMid)}, {est.usableCount} comp
          {est.usableCount === 1 ? "" : "s"})
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-muted">
          Not enough comps and square footage entered to estimate a value yet.
        </p>
      )}
    </div>
  );
}

function CompsSection({ blob }: { blob: unknown }) {
  const { homes } = normalizeCompsState(blob);
  if (homes.length === 0) return <NotYetEntered />;
  return (
    <div className="space-y-3">
      {homes.map((home) => (
        <CompsHome key={home.id} home={home} />
      ))}
    </div>
  );
}

function OfferSection({ offer }: { offer: SyncData["offer"] }) {
  if (!offer) return <NotYetEntered />;
  const sheet = buildTermSheet(offer);
  return (
    <dl className="space-y-5">
      {sheet.sections.map((section) => (
        <div key={section.heading}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {section.heading}
          </dt>
          <div className="mt-2 space-y-1.5">
            {section.lines.map((line) => (
              <Row key={line.label} label={line.label} value={line.value} />
            ))}
          </div>
        </div>
      ))}
    </dl>
  );
}

function DeadlinesSection({ tracker }: { tracker: SyncData["tracker"] }) {
  const { underContractDate, closingDate } = tracker;
  if (!underContractDate && !closingDate) return <NotYetEntered />;

  const milestones = computeMilestones({
    underContractDate,
    closingDate,
    offsets: tracker.offsets,
  });

  return (
    <div className="space-y-3">
      <dl className="space-y-2">
        <Row label="Under contract" value={underContractDate || "—"} />
        <Row label="Closing date" value={closingDate || "—"} />
      </dl>
      {milestones.length > 0 ? (
        <ul className="space-y-1.5 border-t border-slate-200 pt-3 text-sm">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-4">
              <span className="text-ink-soft">
                {m.label}
                {m.critical ? (
                  <span className="ml-1 text-xs font-semibold uppercase text-amber-700">
                    key
                  </span>
                ) : null}
              </span>
              <span className="text-right font-medium text-ink">{m.date}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">
          Enter both your under-contract and closing dates to see the milestone
          timeline.
        </p>
      )}
    </div>
  );
}

function ProgressSection({ progress }: { progress: SyncData["progress"] }) {
  const prog = journeyProgress(getStages(), progress);
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-2xl font-bold" data-testid="binder-progress">
        {prog.pct}%
      </p>
      <p className="text-sm text-ink-soft">
        {prog.doneTasks} of {prog.totalTasks} tasks · {prog.stagesComplete} of{" "}
        {prog.stages.length} stages complete
      </p>
    </div>
  );
}

export function DealBinder() {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<SyncData | null>(null);

  // Snapshot localStorage once on mount (client-side only). collectDeal() is
  // SSR-safe but returns empty defaults there, so we read it after hydration to
  // pick up the buyer's real data.
  useEffect(() => {
    setData(collectDeal().data);
    setHydrated(true);
  }, []);

  const stageTools = useMemo(() => data?.stageTools ?? {}, [data]);

  if (!hydrated || !data) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/account" className="text-sm font-medium text-brand-700 hover:underline">
          ← Back to your account
        </Link>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="print-area space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Your buyer binder</h1>
          <p className="text-sm text-ink-soft">
            A single-page summary of everything you&apos;ve saved on this device —
            your budget, savings, comps, offer, deadlines, and journey progress.
            Print it or save it as a PDF to review or hand to your attorney.
          </p>
          <LegalNotice variant="banner" />
        </header>

        <Section title="Budget">
          <BudgetSection blob={stageTools.budget} />
        </Section>

        <Section title="Savings">
          <SavingsSection blob={stageTools.savings} />
        </Section>

        <Section title="Comps">
          <CompsSection blob={stageTools.comps} />
        </Section>

        <Section title="Offer">
          <OfferSection offer={data.offer} />
        </Section>

        <Section title="Deadlines">
          <DeadlinesSection tracker={data.tracker} />
        </Section>

        <Section title="Journey progress">
          <ProgressSection progress={data.progress} />
        </Section>

        <LegalNotice variant="inline" />
      </div>
    </div>
  );
}
