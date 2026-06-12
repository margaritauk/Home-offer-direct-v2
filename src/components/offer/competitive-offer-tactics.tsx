"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { formatUSD } from "@/lib/savings";
import { illustrateEscalation } from "@/lib/offer/escalation";
import { modelGap } from "@/lib/offer/appraisal-gap";
import { MULTIPLE_OFFER_TACTICS } from "@/lib/offer/tactics";
import { ValidatedNumberField } from "@/components/tools/validated-field";

/**
 * Competitive-offer tactics (A3) — extends /tools/offer-help.
 *
 * Three education-only sections:
 *  1. Escalation-clause modeler — models the buyer's OWN numbers; never suggests
 *     a cap or figure (UPL). State-aware caution where escalation is disfavored.
 *  2. Appraisal-gap coverage helper AT OFFER TIME — distinct from the
 *     post-appraisal Clear-to-Close calc; shares no state.
 *  3. Multiple-offer / bidding-war playbook — trade-offs, never directives.
 *
 * All math lives in pure, unit-tested libs; this component is a thin shell.
 */
export function CompetitiveOfferTactics() {
  return (
    <section className="space-y-12">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Competitive-offer tactics
        </h2>
        <p className="mt-3 text-ink-soft">
          In a hot market you&apos;ll weigh escalation clauses, appraisal-gap
          coverage, and the levers beyond price. Model the math of your own
          numbers and learn the trade-offs — we never pick a figure for you or
          tell you what to waive.
        </p>
      </div>

      <DisclaimerBanner>
        Education only — not legal, financial, or appraisal advice. These tools
        model the arithmetic of numbers <strong>you</strong> enter; they never
        suggest a cap, a coverage amount, or which protections to give up.
        Drafting any clause is the practice of law — have your attorney draft and
        review the contract.
      </DisclaimerBanner>

      <EscalationModeler />
      <AppraisalGapHelper />
      <MultipleOfferPlaybook />
    </section>
  );
}

/** States where escalation clauses are disfavored/restricted (Researcher brief). */
const ESCALATION_CAUTIONS: Record<string, string> = {
  TX: "In Texas, the TREC standard contract has no escalation provision and their use is restricted — an escalation clause should be attorney-drafted.",
  NC: "In North Carolina, the Real Estate Commission discourages escalation clauses and warns of their pitfalls.",
};

function EscalationModeler() {
  const { stateCode, hydrated } = useStateSelection();
  const [base, setBase] = useState(0);
  const [increment, setIncrement] = useState(0);
  const [cap, setCap] = useState(0);
  const [competingOffer, setCompetingOffer] = useState(0);

  const model = useMemo(
    () => illustrateEscalation({ base, increment, cap, competingOffer }),
    [base, increment, cap, competingOffer],
  );

  const profile = stateCode ? getStateProfile(stateCode) : undefined;
  const stateCaution = profile ? ESCALATION_CAUTIONS[profile.code] : undefined;

  return (
    <div className="space-y-4">
      <div className="max-w-2xl">
        <h3 className="text-xl font-bold text-ink">Escalation-clause modeler</h3>
        <p className="mt-2 text-sm text-ink-soft">
          An escalation clause says you&apos;ll beat a competing offer by a set
          increment, up to a cap you choose. Enter <em>your own</em> numbers and a
          competing offer to model where it would land:{" "}
          <strong>resulting price = min(competing + increment, your cap)</strong>.
        </p>
      </div>

      {/* State-aware caution — kept usable as education. */}
      {hydrated && stateCaution ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            📍 In {profile?.name}
          </p>
          <p className="mt-1 text-sm text-amber-900">{stateCaution}</p>
        </div>
      ) : null}

      <div className="card grid gap-4 sm:grid-cols-2">
        <ValidatedNumberField
          label="Your base (starting) offer"
          value={base}
          onChange={setBase}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
        />
        <ValidatedNumberField
          label="Beat-by increment"
          value={increment}
          onChange={setIncrement}
          bounds={{ min: 0, softMax: 100000 }}
          unit="$"
          hint="How much you'd top a competing offer by."
        />
        <ValidatedNumberField
          label="Your cap (maximum price)"
          value={cap}
          onChange={setCap}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
        />
        <ValidatedNumberField
          label="Assumed competing offer"
          value={competingOffer}
          onChange={setCompetingOffer}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
          hint="A what-if number to model against."
        />
      </div>

      <div aria-live="polite" aria-label="Escalation result">
        {!model.valid ? (
          model.errors.length > 0 && (base || increment || cap) ? (
            <ul className="space-y-1 text-sm text-red-700">
              {model.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Enter your base, increment, and cap to model a result.
            </p>
          )
        ) : (
          <div className="rounded-xl bg-brand-600 p-6 text-white">
            <p className="text-sm font-medium text-brand-100">
              Your offer would resolve to
            </p>
            <p className="mt-1 text-3xl font-bold">
              {formatUSD(model.resultingPrice ?? 0)}
            </p>
            <p className="mt-2 text-sm text-brand-100">
              {model.noEscalation
                ? "The competing offer is at or below your base, so the clause wouldn't escalate you."
                : model.cappedOut
                  ? "This hits your cap — the competing offer pushed the clause to your ceiling."
                  : "Below your cap — the clause beats the competing offer by your increment."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-ink-soft">
        <p>
          <strong>What to know.</strong> An escalation clause reveals your
          ceiling to the seller, typically requires proof of the competing offer
          to trigger, and any amount above the home&apos;s appraised value is cash
          you bring yourself (it&apos;s not financeable). Some sellers simply
          won&apos;t accept one, and some markets restrict or disfavor them.
        </p>
        <Link
          href="/pros?role=attorney"
          className="inline-block font-medium text-brand-700 hover:underline"
        >
          Have a real-estate attorney draft the clause →
        </Link>
      </div>
    </div>
  );
}

function AppraisalGapHelper() {
  const [contractPrice, setContractPrice] = useState(0);
  const [appraisedValue, setAppraisedValue] = useState(0);
  const [coverageCap, setCoverageCap] = useState(0);

  const model = useMemo(
    () => modelGap({ contractPrice, appraisedValue, coverageCap }),
    [contractPrice, appraisedValue, coverageCap],
  );

  const entered = contractPrice > 0 && appraisedValue > 0;

  return (
    <div className="space-y-4">
      <div className="max-w-2xl">
        <h3 className="text-xl font-bold text-ink">
          Appraisal-gap coverage (at offer time)
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          If you offer above what the home appraises for, your lender lends on the{" "}
          <strong>lower</strong> of price or appraisal — so you cover the gap in
          cash, on top of your down payment and closing costs. Model how much
          gap you&apos;d be committing to before you offer.{" "}
          <em>
            This is the pre-offer planning view; it&apos;s separate from the
            post-appraisal Clear-to-Close calculator.
          </em>
        </p>
      </div>

      <div className="card grid gap-4 sm:grid-cols-3">
        <ValidatedNumberField
          label="Your contract / offer price"
          value={contractPrice}
          onChange={setContractPrice}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
        />
        <ValidatedNumberField
          label="Hypothetical appraised value"
          value={appraisedValue}
          onChange={setAppraisedValue}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
        />
        <ValidatedNumberField
          label="Gap you'd cover (optional)"
          value={coverageCap}
          onChange={setCoverageCap}
          bounds={{ min: 0, softMax: 10000000 }}
          unit="$"
          hint="Leave blank to cover the full gap."
        />
      </div>

      <div aria-live="polite" aria-label="Appraisal-gap result">
        {!entered ? (
          <p className="text-sm text-ink-muted">
            Enter your price and a hypothetical appraised value to see the cash
            impact.
          </p>
        ) : !model.isLow ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6">
            <p className="text-sm font-semibold text-emerald-900">
              No gap to cover
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              At this hypothetical appraised value, the home appraises at or above
              your price — there&apos;s no gap cash to bring.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-brand-600 p-6 text-white">
            <p className="text-sm font-medium text-brand-100">
              Cash you&apos;d bring to cover the gap
            </p>
            <p className="mt-1 text-3xl font-bold">
              {formatUSD(model.cashToCover)}
            </p>
            <p className="mt-2 text-sm text-brand-100">
              The full gap is {formatUSD(model.gap)}.{" "}
              {model.partialCoverage
                ? `Covering ${formatUSD(
                    model.cashToCover,
                  )} leaves ${formatUSD(
                    model.remainingExposure,
                  )} that would still need a renegotiation or an exit to close.`
                : "You'd be covering the whole gap in cash."}
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-ink-soft">
        For context only (market-dependent, as of 2025): buyers often cover{" "}
        <strong>3–5%</strong> to stay competitive and <strong>5–10%</strong> to
        win a bidding war. That&apos;s background, not a recommendation — gap cash
        is generally not financeable, so size it against what you can actually
        bring.
      </p>
    </div>
  );
}

function MultipleOfferPlaybook() {
  return (
    <div className="space-y-4">
      <div className="max-w-2xl">
        <h3 className="text-xl font-bold text-ink">
          Multiple-offer / bidding-war playbook
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          When a home draws several offers, price is only one axis. Here are the
          levers buyers use and the trade-off each one carries — so you can decide
          what fits your deal, never a checklist of moves to make.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MULTIPLE_OFFER_TACTICS.map((tactic) => (
          <article key={tactic.id} className="card space-y-3">
            <h4 className="text-lg font-bold text-ink">{tactic.name}</h4>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                What it is
              </p>
              <p className="mt-1 text-sm text-ink-soft">{tactic.whatItIs}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                How it helps
              </p>
              <p className="mt-1 text-sm text-ink-soft">{tactic.howItHelps}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                The trade-off
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {tactic.howItBackfires}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
