"use client";

import { useState } from "react";
import Link from "next/link";
import { useStateSelection } from "@/hooks/use-state-selection";
import { getStateProfile } from "@/lib/states";
import { screenText } from "@/lib/ai/screening";
import { StatePicker } from "@/components/state-picker";
import { TrustCallout } from "@/components/trust-callout";
import {
  SHOWING_SCRIPTS,
  TOUR_CHECKLIST_CRITERIA,
  dualAgencyCaution,
  getShowingScript,
} from "@/lib/tools/showing-scripts";

/**
 * Showing access reality + scripts + dual-agency caution + tour checklist (I1).
 * Extends the /showings area. All scripts are Fair-Housing-safe; the editable
 * customization field is screened. The dual-agency caution is state-aware; the
 * tour checklist complements (and links into) the Tour Scorecard.
 */
export function ShowingAccess() {
  const [scriptId, setScriptId] = useState<string>(SHOWING_SCRIPTS[0].id);
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState(false);
  const { stateCode, hydrated } = useStateSelection();

  const script = getShowingScript(scriptId) ?? SHOWING_SCRIPTS[0];
  const profile =
    hydrated && stateCode ? getStateProfile(stateCode) : undefined;
  const caution = profile ? dualAgencyCaution(profile) : undefined;

  const fullText = extra.trim() ? `${script.body}\n\n${extra.trim()}` : script.body;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable — the text is visible to copy manually */
    }
  };

  const commitExtra = () => {
    const screened = screenText(extra).text;
    if (screened !== extra) setExtra(screened);
  };

  return (
    <div className="space-y-10" data-testid="showing-access">
      {/* Scripts */}
      <section className="space-y-4" aria-labelledby="scripts-heading">
        <div>
          <h2 id="scripts-heading" className="text-xl font-bold">
            Getting a showing as an unrepresented buyer
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Some listing agents won&apos;t show to an unrepresented buyer, or will
            offer to represent you too. These neutral scripts keep your
            independence explicit. Pick a scenario and copy it.
          </p>
        </div>

        <label className="block sm:max-w-md">
          <span className="text-sm font-medium text-ink-soft">Scenario</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Showing scenario"
            value={scriptId}
            onChange={(e) => setScriptId(e.target.value)}
          >
            {SHOWING_SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-ink-muted">{script.description}</p>

        <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-ink">
          {fullText}
        </pre>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            Add your own line (optional — screened)
          </span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Property/transaction facts only. No personal appeals."
            value={extra}
            aria-label="Add your own line"
            onChange={(e) => setExtra(e.target.value)}
            onBlur={commitExtra}
          />
        </label>

        <div className="flex items-center gap-3">
          <button type="button" onClick={copy} className="btn-primary">
            {copied ? "Copied ✓" : "Copy script"}
          </button>
          <span className="text-xs text-ink-muted" aria-live="polite">
            {copied ? "Paste it into your email or text." : null}
          </span>
        </div>
      </section>

      {/* Dual-agency caution (state-aware) */}
      <section className="space-y-3" aria-labelledby="dual-agency-heading">
        <h2 id="dual-agency-heading" className="text-xl font-bold">
          Dual-agency caution
        </h2>
        <StatePicker label="Your state (for local rules)" className="max-w-sm" />

        {!profile ? (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-800">
              📍 Pick your state to see local rules
            </p>
            <p className="mt-1 text-sm text-brand-900">
              Whether one agent may represent both sides — or whether it&apos;s
              banned outright — depends on where you&apos;re buying.
            </p>
          </div>
        ) : (
          <TrustCallout
            tone={caution!.status === "banned" ? "info" : "warning"}
            title={`📍 In ${profile.name}: ${caution!.label}`}
          >
            <span className="block">{caution!.explanation}</span>
            {caution!.stateNote ? (
              <span className="mt-2 block text-sm">{caution!.stateNote}</span>
            ) : null}
            <span className="mt-2 block text-sm">{caution!.conflictNote}</span>
            <Link
              href={`/states/${profile.code.toLowerCase()}`}
              className="mt-2 inline-block text-sm font-medium text-brand-700 underline"
            >
              Full {profile.name} guide &amp; source →
            </Link>
          </TrustCallout>
        )}
        <p className="text-xs text-ink-muted">
          Dual-agency rules as of 2026 — confirm against your state&apos;s current
          law via the linked guide.
        </p>
      </section>

      {/* In-person tour checklist → Tour Scorecard */}
      <section className="space-y-3" aria-labelledby="tour-checklist-heading">
        <h2 id="tour-checklist-heading" className="text-xl font-bold">
          Quick in-person tour checklist
        </h2>
        <p className="text-sm text-ink-soft">
          What to look at and photograph on a solo tour — the building&apos;s
          condition, never who lives there. This complements the{" "}
          <Link
            href="/tools/tour-scorecard"
            className="font-medium text-brand-700 hover:underline"
            data-testid="tour-scorecard-link"
          >
            Tour Scorecard
          </Link>
          , where you can score and rank what you see.
        </p>
        <ul className="space-y-2">
          {TOUR_CHECKLIST_CRITERIA.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <span className="font-medium text-ink">{c.label}</span>
              {c.hint ? (
                <span className="mt-0.5 block text-xs text-ink-muted">{c.hint}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
