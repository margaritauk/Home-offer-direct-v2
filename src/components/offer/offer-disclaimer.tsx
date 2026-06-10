import { TERM_SHEET_DISCLAIMER } from "@/lib/offer/term-sheet";
import { NOT_A_LAW_FIRM } from "@/components/legal-notice";

/**
 * The persistent UPL disclaimer (issues #17 and #40). Rendered prominently and
 * repeatedly across the wizard so every output is framed as a worksheet for an
 * attorney — never a binding contract. Leads with the single-sourced
 * "not a law firm" framing so the not-a-law-firm guardrail and the
 * attorney-review guardrail always travel together.
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
      <strong className="font-semibold">{NOT_A_LAW_FIRM}</strong>{" "}
      {TERM_SHEET_DISCLAIMER}
    </p>
  );
}
