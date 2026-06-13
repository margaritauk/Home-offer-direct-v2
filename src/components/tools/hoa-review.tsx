"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { PropertyField } from "@/components/homes/property-field";
import { TrustCallout } from "@/components/trust-callout";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import {
  buildHoaChecklist,
  type HoaCategoryId,
} from "@/lib/tools/hoa-review";
import { ToolDisclaimer } from "./tool-disclaimer";

interface HoaReviewState {
  property?: string;
  /** Whether the home is governed by a condo/HOA/co-op. */
  isHoa: boolean;
  /** Per-category: flagged + the buyer's screened "questions to ask". */
  byCategory: Partial<
    Record<HoaCategoryId, { flag: boolean; questions: string }>
  >;
}

const INITIAL: HoaReviewState = {
  property: "",
  isHoa: false,
  byCategory: {},
};

export function HoaReview() {
  const { value, hydrated, save } = useStageTool<HoaReviewState>(
    "hoa",
    INITIAL,
  );

  const checklist = useMemo(
    () => buildHoaChecklist({ isHoa: value.isHoa }),
    [value.isHoa],
  );

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const patchCategory = (
    id: HoaCategoryId,
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
    <div className="space-y-8" data-testid="hoa-review">
      <DisclaimerBanner>
        This worksheet helps you turn the HOA/condo resale packet into{" "}
        <strong>questions to ask</strong> — it does <strong>not</strong> tell you
        whether the documents are legally sufficient or whether to walk. Have your
        attorney review the governing documents.
      </DisclaimerBanner>

      <PropertyField
        value={value.property ?? ""}
        onChange={(property) => save((prev) => ({ ...prev, property }))}
      />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Is this home in an association?</h2>
        <p className="text-sm text-ink-soft">
          Condos, many townhomes, and some single-family neighborhoods are
          governed by an HOA (or, rarely, a co-op). Turn this on to walk the
          resale-packet red flags.
        </p>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-brand-600"
            checked={value.isHoa}
            onChange={(e) =>
              save((prev) => ({ ...prev, isHoa: e.target.checked }))
            }
          />
          <span className="text-sm">
            <span className="block font-medium text-ink">
              This home is governed by a condo/HOA (or co-op)
            </span>
            <span className="block text-xs text-ink-muted">
              Shows the resale-packet checklist. Leave off for a non-association
              home.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-3" aria-labelledby="ownership-heading">
        <h2 id="ownership-heading" className="text-lg font-semibold">
          Condo vs HOA vs co-op
        </h2>
        <ul className="space-y-2">
          {checklist.ownershipNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <span className="font-medium text-ink">{note.label}</span>
              <span className="mt-0.5 block text-ink-soft">{note.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {!checklist.applies ? (
        <div
          className="rounded-lg border border-brand-200 bg-brand-50 p-4"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-brand-800">
            No association? No packet to review.
          </p>
          <p className="mt-1 text-sm text-brand-900">
            If this home isn&apos;t in an HOA, condo, or co-op there&apos;s no
            resale packet — skip this worksheet. If you&apos;re not sure, ask the
            listing side whether dues or governing documents apply.
          </p>
        </div>
      ) : (
        <>
          <TrustCallout tone="warning" title="Watch the review/cancellation window">
            {checklist.reviewWindowNote}
          </TrustCallout>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Resale-packet red flags</h2>
            {checklist.categories.map((cat) => {
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
                  whyItMatters={cat.whyItMatters}
                  askYourPro={cat.askYourPro}
                  flag={entry.flag}
                  questions={entry.questions}
                  onPatch={(patch) => patchCategory(cat.id, patch)}
                />
              );
            })}
          </section>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-ink-soft">
            Save the HOA management contact in your{" "}
            <Link href="/dashboard" className="text-brand-700 hover:underline">
              transaction contacts
            </Link>
            , and fold these into your{" "}
            <Link
              href="/tools/disclosure-review"
              className="text-brand-700 hover:underline"
            >
              seller-disclosure review
            </Link>
            .
          </div>
        </>
      )}

      <ToolDisclaimer>
        This is an educational checklist, <strong>not legal advice</strong>. It
        surfaces what to ask and look for — it doesn&apos;t interpret the legal
        effect of the governing documents. Have your attorney review the HOA docs.
      </ToolDisclaimer>
    </div>
  );
}

function CategoryCard({
  id,
  label,
  whatToLookFor,
  whyItMatters,
  askYourPro,
  flag,
  questions,
  onPatch,
}: {
  id: string;
  label: string;
  whatToLookFor: string;
  whyItMatters: string;
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
          <span className="mt-1 block text-sm text-ink-muted">
            <strong>Why it matters:</strong> {whyItMatters}
          </span>
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">
          Questions to ask
        </span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Write the questions you'll bring to the HOA/management or your attorney (facts only — screened)."
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
