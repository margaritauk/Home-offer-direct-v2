"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { useStateSelection } from "@/hooks/use-state-selection";
import { getStateProfile } from "@/lib/states";
import { StatePicker } from "@/components/state-picker";
import { TrustCallout } from "@/components/trust-callout";
import { SOLO_FACTORS, summarizeGoSolo } from "@/lib/tools/go-solo";
import { ToolDisclaimer } from "./tool-disclaimer";

interface GoSoloState {
  /** Selected stake-factor ids. */
  selected: string[];
}

const INITIAL: GoSoloState = { selected: [] };

export function GoSolo() {
  const { value, hydrated, save } = useStageTool<GoSoloState>(
    "should-i-go-solo",
    INITIAL,
  );
  const { stateCode, hydrated: stateHydrated } = useStateSelection();
  const profile =
    stateHydrated && stateCode ? getStateProfile(stateCode) : undefined;

  const summary = useMemo(
    () => summarizeGoSolo(value.selected),
    [value.selected],
  );

  const toggle = (id: string) =>
    save((prev) => ({
      ...prev,
      selected: prev.selected.includes(id)
        ? prev.selected.filter((x) => x !== id)
        : [...prev.selected, id],
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-10">
      {/* Reflection checklist */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Does anything here apply to your purchase?
          </h2>
          <p className="text-sm text-ink-muted">
            This is a reflection aid, not a score. Check what fits — there are no
            wrong answers.
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">Higher-stakes factors</legend>
          {SOLO_FACTORS.map((f) => {
            const checked = value.selected.includes(f.id);
            return (
              <label
                key={f.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand-600"
                  checked={checked}
                  onChange={() => toggle(f.id)}
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {f.label}
                  </span>
                  {checked ? (
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {f.why}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      {/* Two-sided read (live) */}
      <section aria-live="polite" className="space-y-3">
        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">Your read</p>
          <p className="mt-1 text-lg font-semibold">{summary.headline}</p>
        </div>
        {summary.band === "consider-help" ? (
          <TrustCallout tone="info" title="What many buyers do here">
            Plenty of buyers still self-represent through most of the deal and
            bring in a flat-fee or hourly professional only for the parts that
            raise the stakes — most often the contract. It&apos;s a choice, not a
            requirement, and going solo remains legal in all 50 states.
          </TrustCallout>
        ) : null}
      </section>

      {/* The menu of help (state-aware) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">If you do want help, it isn&apos;t all-or-nothing</h2>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">Full buyer&apos;s agent</strong> —
            traditional representation; since the 2024 NAR settlement you&apos;d
            sign a written buyer-agency agreement and negotiate their pay.
          </li>
          <li>
            <strong className="text-ink">Flat-fee or hourly buyer agent</strong> —
            pay only for the help you use; rebate legality varies by state.
          </li>
          <li>
            <strong className="text-ink">Flat-fee or hourly real-estate attorney</strong>{" "}
            — often the most targeted option for contract review, especially in
            attorney-close states.
          </li>
        </ul>

        <StatePicker label="Your state (for local rules)" className="max-w-sm" />
        {profile?.attorneyRequiredAtClosing ? (
          <p className="text-sm text-ink-soft">
            Heads up: {profile.name} typically involves an attorney at closing
            anyway, so an attorney review may fit naturally into your process.
          </p>
        ) : profile ? (
          <p className="text-sm text-ink-soft">
            {profile.name} commonly closes through escrow/title rather than
            requiring an attorney — though you can still hire one to review your
            contract.
          </p>
        ) : null}

        <Link
          href="/pros"
          className="inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          Browse flat-fee attorneys &amp; pros (optional) →
        </Link>
      </section>

      {/* Post-NAR explainer with source + date */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">
          The post-2024 reality (so you&apos;re not surprised)
        </h2>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>
            Since <strong>August 17, 2024</strong>, a buyer who{" "}
            <em>uses</em> an MLS-participant agent signs a{" "}
            <strong>written buyer-agency agreement before touring</strong> a home
            with that agent.
          </li>
          <li>
            Buyer-side compensation is now{" "}
            <strong>negotiable and not guaranteed seller-paid</strong> — it&apos;s
            agreed deal-by-deal, and offers of buyer-agent compensation can no
            longer be advertised on the MLS.
          </li>
          <li>
            The unrepresented path this product champions{" "}
            <strong>does not trigger that agreement requirement</strong> — it&apos;s
            a rule about <em>using</em> an agent, and buying unrepresented is legal
            in all 50 states.
          </li>
          <li>
            Reality check: commissions did <strong>not</strong> collapse — they
            averaged about <strong>2.4–2.67%</strong> in 2025, near pre-settlement
            levels. Going solo can put that money back in play, but agents
            aren&apos;t suddenly unnecessary.
          </li>
        </ul>
        <p className="text-xs text-ink-muted" data-testid="go-solo-source">
          Sources: NAR Settlement FAQs &amp; Summary of 2024 MLS Changes
          (effective Aug 17, 2024); Redfin commissions data (Q2 2025). As of 2026.
        </p>
      </section>

      <ToolDisclaimer>
        This is an educational decision aid, not legal advice — it lays out
        trade-offs, it doesn&apos;t tell you whether to hire anyone. For your
        specific situation, have a licensed attorney advise you.
      </ToolDisclaimer>
    </div>
  );
}
