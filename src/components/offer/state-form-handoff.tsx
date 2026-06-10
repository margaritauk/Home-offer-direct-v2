"use client";

import Link from "next/link";
import { stateFormLink } from "@/lib/legal/state-forms";
import { getStateProfile } from "@/lib/states";
import { useStateSelection } from "@/hooks/use-state-selection";
import { StatePicker } from "@/components/state-picker";
import { LegalNotice, SUBJECT_TO_ATTORNEY_REVIEW } from "@/components/legal-notice";

/**
 * State-form links & attorney handoff (issue #16).
 *
 * Reuses the shared {@link useStateSelection} selection (via {@link StatePicker})
 * and resolves the buyer's state to a public, authoritative form source when one
 * genuinely exists. Otherwise it shows the honest fallback message. It NEVER
 * presents a filled, ready-to-sign contract — only a link to a blank public form
 * — and always surfaces the attorney handoff plus the persistent
 * {@link SUBJECT_TO_ATTORNEY_REVIEW} framing via {@link LegalNotice}.
 */
export function StateFormHandoff() {
  const { stateCode, hydrated } = useStateSelection();
  const profile = hydrated && stateCode ? getStateProfile(stateCode) : undefined;
  const link = hydrated && stateCode ? stateFormLink(stateCode) : null;
  const stateName = profile?.name;

  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">
          State forms &amp; attorney handoff
        </h2>
        <p className="mt-3 text-ink-soft">
          Some states publish a public real-estate form; most don&apos;t — the
          standard contracts are membership-gated REALTOR®/MLS forms. Pick your
          state to see what&apos;s actually available, then hand off to a flat-fee
          attorney to draft and review. {SUBJECT_TO_ATTORNEY_REVIEW}
        </p>
      </div>

      <StatePicker label="Your state" className="max-w-sm" />

      <div className="card space-y-3">
        {!hydrated || !stateCode ? (
          <p className="text-sm text-ink-soft">
            Select your state above to see whether a public statewide form exists.
          </p>
        ) : link ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Public form source{stateName ? ` — ${stateName}` : ""}
            </p>
            <p className="text-sm text-ink-soft">
              {stateName ?? "Your state"} publishes a public, authoritative form
              source. This is a blank educational form, not a ready-to-sign
              contract — have a licensed attorney complete and review it.
            </p>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              {link.label} →
            </a>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              No public statewide form{stateName ? ` — ${stateName}` : ""}
            </p>
            <p className="text-sm text-ink-soft">
              No public statewide form — use a flat-fee attorney or the listing
              brokerage&apos;s contract. The standard purchase contract in{" "}
              {stateName ?? "your state"} is typically a membership-gated
              REALTOR®/MLS form we can&apos;t republish.
            </p>
          </>
        )}

        <Link
          href="/pros?role=attorney"
          className="inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Hand off to a flat-fee real estate attorney →
        </Link>
      </div>

      <LegalNotice />
    </section>
  );
}
