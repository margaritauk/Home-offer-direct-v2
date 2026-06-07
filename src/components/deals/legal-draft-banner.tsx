import { LEGAL_DRAFT_BANNER, LEGAL_REVIEW_APPROVED } from "@/lib/deals/agency-copy";

/**
 * Visible "DRAFT — pending legal review" banner (#76). Rendered above any
 * representation/consent wording while `LEGAL_REVIEW_APPROVED` is false. The
 * copy itself lives in `agency-copy.ts` so counsel can replace it in one place.
 */
export function LegalDraftBanner() {
  if (LEGAL_REVIEW_APPROVED) return null;
  return (
    <div
      role="note"
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <span className="font-semibold">⚠ {LEGAL_DRAFT_BANNER}</span>
    </div>
  );
}
