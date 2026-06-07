import { TERM_SHEET_DISCLAIMER } from "@/lib/offer/term-sheet";

/**
 * The persistent UPL disclaimer (issue #17). Rendered prominently and
 * repeatedly across the wizard so every output is framed as a worksheet for an
 * attorney — never a binding contract.
 */
export function OfferDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      role="note"
      className={`rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
    >
      <span aria-hidden className="mr-1">
        🛡️
      </span>
      {TERM_SHEET_DISCLAIMER}
    </p>
  );
}
