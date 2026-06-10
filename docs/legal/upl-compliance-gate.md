# UPL compliance gate (#17)

The unauthorized-practice-of-law (UPL) gate for the offer wizard and any
document-producing surface. This is the Definition of Done for issue #17,
layered on top of the "not a law firm" framework (#40).

**Framing principle:** HomeOffer Direct is an educational worksheet tool — not a
law firm or brokerage. Outputs are worksheets for a licensed attorney to review,
never ready-to-sign binding contracts, and the tool never recommends which
specific terms to choose.

## Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Wizard never outputs a ready-to-sign tailored binding contract. Outputs are framed as worksheets/summaries. | **Satisfied in-code** — every offer surface renders as an "offer worksheet" and the document preview is watermarked "SAMPLE" with a "Worksheet — not a binding contract" header. The watermark-free/paid export is disabled ("Coming soon"). |
| 2 | No recommendations on which contingencies to waive or what escalation terms to use. Educate on trade-offs only. | **Satisfied in-code** — `src/lib/offer/term-sheet.ts` neutrally summarizes the values the buyer entered; contingency content explains trade-offs and does not advise which to waive. No escalation-clause recommender exists. |
| 3 | Persistent "not legal advice / subject to attorney review" framing across the wizard. | **Satisfied in-code** — `OfferDisclaimer` leads and closes the summary and preview, now prefixed with the single-sourced `NOT_A_LAW_FIRM` line. `TERM_SHEET_DISCLAIMER` carries "not a binding contract / not legal advice / subject to attorney review." |
| 4 | Outputs explicitly framed as worksheets for an attorney. | **Satisfied in-code** — headings read "Your offer worksheet" / "Offer worksheet"; the copy action is "Copy for your attorney"; suggested-ask blocks say "adapt with your attorney." |
| 5 | Single-sourced "not a law firm" framework with a `/legal` disclaimers page. | **Satisfied in-code** (#40) — `src/components/legal-notice.tsx` exports `NOT_A_LAW_FIRM` / `SUBJECT_TO_ATTORNEY_REVIEW` and a `LegalNotice` component (banner/inline). `/legal` page covers not-a-law-firm, attorney review, AI notice, draft paid-document terms, and estimates-not-advice. Footer links to `/legal`. |
| 6 | AI features, when present, only explain/organize user-provided information — no legal/financial advice. AI remains gated. | **Satisfied in-code (forward-looking)** — no AI feature is enabled; the `/legal` "AI features notice" documents the guardrail for when it is. Re-confirm when AI ships. |
| 7 | Reviewed against the software safe-harbor pattern (self-help tool that organizes user input vs. tailored legal advice). | **Partially satisfied** — the design follows the safe-harbor pattern (neutral organization of user-entered values, no individualized recommendations, persistent disclaimers). Formal confirmation that the pattern is correctly applied is part of the external legal sign-off below. |
| 8 | Paid/export and AI features are not enabled by content work. | **Satisfied in-code** — paid export stays disabled ("Coming soon"); `/legal` paid-document terms are marked "draft — not yet active; pending legal review." |
| 9 | **Legal sign-off required before launch.** | **DEFERRED — external.** A licensed attorney must review the framework, the `/legal` content, the draft paid-document terms, and the safe-harbor analysis before launch. This cannot be completed in-repo and remains an open gate. |

## Deferred external gate

Item #9 (and the formal confirmation portion of item #7) require review by a
licensed attorney and **cannot** be satisfied by code or content changes in this
repository. Treat them as a hard, blocking launch gate:

- Do not launch any paid export or AI feature until the sign-off is recorded.
- The draft Terms of Service and refund policy on `/legal` stay marked
  "draft — not yet active; pending legal review" until then.
- When sign-off is obtained, record who reviewed it and the date here, and flip
  items #7 and #9 to satisfied.

> Status: legal review has **not** been performed. Nothing in this repository
> should be read as completed legal review.

## Key references

- `src/components/legal-notice.tsx` — single-sourced framing + `LegalNotice`.
- `src/app/legal/page.tsx` — public disclaimers page.
- `src/components/offer/offer-disclaimer.tsx` — persistent wizard disclaimer.
- `src/lib/offer/term-sheet.ts` — `TERM_SHEET_DISCLAIMER`, neutral worksheet builder.
- `src/components/offer/term-sheet-summary.tsx` / `term-sheet-preview.tsx` — worksheet surfaces.
- `src/components/site-footer.tsx` — footer link to `/legal`.
