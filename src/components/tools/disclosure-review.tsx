"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { useStateSelection } from "@/hooks/use-state-selection";
import { getStateProfile } from "@/lib/states";
import { screenText } from "@/lib/ai/screening";
import { StatePicker } from "@/components/state-picker";
import { PropertyField } from "@/components/homes/property-field";
import { TrustCallout } from "@/components/trust-callout";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { InPlaceExplainer } from "@/components/ai/in-place-explainer";
import {
  buildDisclosureChecklist,
  type DisclosureCategoryId,
} from "@/lib/tools/disclosure-review";
import { ToolDisclaimer } from "./tool-disclaimer";

interface DisclosureReviewState {
  property?: string;
  builtPre1978: boolean;
  /** Per-category: flagged + the buyer's screened "questions to ask". */
  byCategory: Partial<
    Record<DisclosureCategoryId, { flag: boolean; questions: string }>
  >;
}

const INITIAL: DisclosureReviewState = {
  property: "",
  builtPre1978: true,
  byCategory: {},
};

export function DisclosureReview() {
  const { value, hydrated, save } = useStageTool<DisclosureReviewState>(
    "disclosure",
    INITIAL,
  );
  const { stateCode, hydrated: stateHydrated } = useStateSelection();
  const profile =
    stateHydrated && stateCode ? getStateProfile(stateCode) : undefined;

  const checklist = useMemo(
    () =>
      profile
        ? buildDisclosureChecklist(profile, { builtPre1978: value.builtPre1978 })
        : null,
    [profile, value.builtPre1978],
  );

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const patchCategory = (
    id: DisclosureCategoryId,
    patch: Partial<{ flag: boolean; questions: string }>,
  ) =>
    save((prev) => ({
      ...prev,
      byCategory: {
        ...prev.byCategory,
        [id]: { flag: false, questions: "", ...prev.byCategory[id], ...patch },
      },
    }));

  return (
    <div className="space-y-8" data-testid="disclosure-review">
      <DisclaimerBanner>
        This worksheet helps you turn the seller&apos;s disclosure into{" "}
        <strong>questions to ask</strong> — it does <strong>not</strong> tell you
        whether a disclosure is legally sufficient or whether to walk. Have your
        attorney and inspector confirm anything that matters.
      </DisclaimerBanner>

      <PropertyField
        value={value.property ?? ""}
        onChange={(property) => save((prev) => ({ ...prev, property }))}
      />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Your state sets the baseline</h2>
        <p className="text-sm text-ink-soft">
          Disclosure duties vary sharply by state. Pick yours so this worksheet
          reflects the right expectations.
        </p>
        <StatePicker label="Your state" className="max-w-sm" />
      </section>

      {!profile ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">
            📍 Pick your state to tailor the checklist
          </p>
          <p className="mt-1 text-sm text-brand-900">
            The red-flag categories are universal, but the disclosure regime —
            and whether to ask about deaths/stigma — depends on where you&apos;re
            buying.
          </p>
        </div>
      ) : (
        <>
          <section
            aria-live="polite"
            className="rounded-xl border border-brand-300 bg-brand-50 p-5"
          >
            <p className="text-sm font-semibold text-brand-800">
              📍 In {profile.name}
            </p>
            <p className="mt-1 text-sm text-brand-900">{checklist!.intro}</p>
            {checklist!.formName ? (
              <p className="mt-1 text-sm text-brand-900">
                Look for the <strong>{checklist!.formName}</strong>.
              </p>
            ) : null}
            <Link
              href={`/states/${profile.code.toLowerCase()}`}
              className="mt-2 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
            >
              Full {profile.name} guide &amp; sources →
            </Link>
            <p className="mt-2 text-xs text-brand-700">
              State disclosure facts as of 2026 — confirm against your state&apos;s
              current form.
            </p>
          </section>

          {checklist!.caveatEmptorWarning ? (
            <TrustCallout tone="warning" title="Silence is not a clean bill of health">
              {profile.name} leans toward limited / &quot;buyer-beware&quot;
              disclosure. A seller who discloses little may simply have a light
              duty — it is <strong>not</strong> a guarantee there are no defects.
              Inspect harder and ask directly.
            </TrustCallout>
          ) : null}

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand-600"
              checked={value.builtPre1978}
              onChange={(e) =>
                save((prev) => ({ ...prev, builtPre1978: e.target.checked }))
              }
            />
            <span className="text-sm">
              <span className="block font-medium text-ink">
                This home was built before 1978
              </span>
              <span className="block text-xs text-ink-muted">
                Adds the federal lead-based-paint disclosure (required nationwide
                for pre-1978 homes).
              </span>
            </span>
          </label>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Red-flag categories</h2>
            {checklist!.categories.map((cat) => {
              const entry = value.byCategory[cat.id] ?? {
                flag: false,
                questions: "",
              };
              return (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  label={cat.label}
                  whatToLookFor={cat.whatToLookFor}
                  askYourPro={cat.askYourPro}
                  flag={entry.flag}
                  questions={entry.questions}
                  onPatch={(patch) => patchCategory(cat.id, patch)}
                />
              );
            })}
          </section>

          {/* AI2 — grounded explainer (default-OFF "Coming soon"). Narrates OUR
              red-flag categories — property condition, never the people (FHA) —
              and never adjudicates legal sufficiency. */}
          <div>
            <InPlaceExplainer
              endpoint="/api/disclosure/explain"
              body={{ state: profile.code, builtPre1978: value.builtPre1978 }}
              buttonLabel="Explain my disclosure red flags (AI)"
              ariaLabel="Explain my disclosure red flags (AI)"
              loudLabel="AI-generated, educational only — not legal advice; an attorney/inspector should confirm"
              restatesNote="This summary only restates the red-flag categories above — what to look for and what to ask about the property's condition; it never decides whether a disclosure is sufficient or whether to walk."
              handoffHref="https://www.americanbar.org/groups/legal_services/flh-home/"
              handoffLabel="Have a licensed attorney or inspector confirm"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-ink-soft">
            Bring your flagged questions to your{" "}
            <Link href="/tools/inspection" className="text-brand-700 hover:underline">
              inspection findings
            </Link>{" "}
            and{" "}
            <Link href="/tools/repair-request" className="text-brand-700 hover:underline">
              repair-request builder
            </Link>
            .
          </div>
        </>
      )}

      <ToolDisclaimer>
        This is an educational checklist, <strong>not legal advice</strong>. It
        surfaces what to ask and look for — it doesn&apos;t interpret the legal
        effect of a disclosure. Have your attorney/inspector confirm.
      </ToolDisclaimer>
    </div>
  );
}

function CategoryCard({
  id,
  label,
  whatToLookFor,
  askYourPro,
  flag,
  questions,
  onPatch,
}: {
  id: string;
  label: string;
  whatToLookFor: string;
  askYourPro: string;
  flag: boolean;
  questions: string;
  onPatch: (patch: Partial<{ flag: boolean; questions: string }>) => void;
}) {
  const [draft, setDraft] = useState(questions);

  const commit = () => {
    const screened = screenText(draft).text;
    if (screened !== draft) setDraft(screened);
    onPatch({ questions: screened });
  };

  return (
    <div className="card space-y-3" aria-label={label}>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-brand-600"
          checked={flag}
          aria-label={`Flag ${label}`}
          onChange={(e) => onPatch({ flag: e.target.checked })}
        />
        <span>
          <span className="block text-base font-semibold text-ink">{label}</span>
          <span className="mt-1 block text-sm text-ink-soft">{whatToLookFor}</span>
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">
          Questions to ask
        </span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Write the questions you'll bring to the seller, inspector, or attorney (facts only — screened)."
          value={draft}
          aria-label={`Questions to ask about ${label}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
      </label>

      <p className="text-xs font-medium text-ink-muted" data-testid={`pro-handoff-${id}`}>
        ⚖️ {askYourPro}
      </p>
    </div>
  );
}
