import Link from "next/link";
import { OFFER_TACTICS } from "@/lib/offer/tactics";
import { LegalNotice } from "@/components/legal-notice";

/**
 * Advanced offer-tactics education (issue #15).
 *
 * Renders the tactic cards (what it is / how it helps / how it backfires) and
 * ends every card with a "Discuss with a real estate attorney" CTA. Education
 * only — there are NO tool-generated escalation caps, dollar amounts, or
 * waiver recommendations here, and the persistent attorney-review framing is
 * carried by the {@link LegalNotice}.
 */
export function OfferTactics() {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Advanced offer tactics</h2>
        <p className="mt-3 text-ink-soft">
          In a competitive market you&apos;ll hear about these tactics. Here&apos;s
          what each one is, how it can help, and how it can backfire — so you can
          decide, with a licensed attorney, whether it&apos;s right for your deal.
          This is education only: we won&apos;t generate escalation amounts,
          appraisal-gap figures, or tell you which protections to waive.
        </p>
      </div>

      <LegalNotice />

      <div className="grid gap-4 sm:grid-cols-2">
        {OFFER_TACTICS.map((tactic) => (
          <article key={tactic.id} className="card space-y-3">
            <h3 className="text-lg font-bold text-ink">{tactic.name}</h3>

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
                How it backfires
              </p>
              <p className="mt-1 text-sm text-ink-soft">{tactic.howItBackfires}</p>
            </div>

            <Link
              href="/pros?role=attorney"
              className="inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Discuss with a real estate attorney →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
