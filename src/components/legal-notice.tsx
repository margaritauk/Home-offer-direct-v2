/**
 * The single-sourced "not a law firm" legal framing (issues #40 and #17).
 *
 * Every document-adjacent surface renders a {@link LegalNotice} so the
 * guardrail is consistent and impossible to forget. Server component — pure
 * render, no client state.
 *
 * UPL guardrail (#17): the wording is factual and non-advisory. It states what
 * HomeOffer Direct is (an educational worksheet tool) and is not (a law firm or
 * brokerage), and that every output is subject to review by a licensed
 * attorney. The copy lives in exported constants so it is single-sourced and
 * testable.
 */

/** The core "not a law firm / not legal advice" sentence. Single-sourced. */
export const NOT_A_LAW_FIRM =
  "HomeOffer Direct is not a law firm or a brokerage and does not provide legal advice.";

/** The companion "subject to attorney review" sentence. Single-sourced. */
export const SUBJECT_TO_ATTORNEY_REVIEW =
  "Our worksheets and summaries are for education and are subject to review by a licensed attorney.";

/**
 * `banner` — a prominent, bordered callout for document-adjacent surfaces
 * (offer worksheet, term-sheet preview). `inline` — a compact one-liner for
 * tools and dense pages.
 */
export type LegalNoticeVariant = "banner" | "inline";

export function LegalNotice({
  variant = "banner",
  className = "",
}: {
  variant?: LegalNoticeVariant;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p className={`text-xs text-ink-muted ${className}`.trim()}>
        <strong className="font-semibold">{NOT_A_LAW_FIRM}</strong>{" "}
        {SUBJECT_TO_ATTORNEY_REVIEW}
      </p>
    );
  }

  return (
    <p
      role="note"
      className={`rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`.trim()}
    >
      <span aria-hidden className="mr-1">
        🛡️
      </span>
      <strong className="font-semibold">{NOT_A_LAW_FIRM}</strong>{" "}
      {SUBJECT_TO_ATTORNEY_REVIEW}
    </p>
  );
}
