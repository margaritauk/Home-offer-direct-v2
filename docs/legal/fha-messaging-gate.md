# Fair Housing messaging gate (#22)

The Fair Housing Act (FHA) gate for every buyer-facing messaging / agent-outreach
surface. This is the Definition of Done for issue #22, applied alongside the
agent-contact + outreach log shipped in issue #29.

**Framing principle:** HomeOffer Direct only helps an unrepresented buyer move
neutral **property and transaction facts**. No surface solicits, stores, infers,
or volunteers protected-class information — race, color, religion, sex, national
origin, familial status, disability, age, marital status, or source of income —
and there is no buyer "love letter" feature, by design. We never transmit a
message on the buyer's behalf.

## Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | No data field anywhere solicits or stores protected-class info. | **Satisfied in-code** — `AgentContact` (`src/lib/showings/types.ts`) carries only `name`, `phone`, `email`, `brokerage`, `source`; `OutreachEntry` carries `id`, `date`, `channel`, `outcome`, `notes`. No protected-class field. The agent-outreach component test asserts no input label/placeholder matches a protected-class pattern. |
| 2 | Message templates carry no protected-class placeholders. | **Satisfied in-code** — `TEMPLATE_PLACEHOLDERS` (`src/lib/showings/templates.ts`) is a closed, neutral set; `templates.test.ts` asserts no forbidden words and that every body token is allowlisted. |
| 3 | No buyer "love letter" template or feature. | **Satisfied in-code** — no love-letter template exists (`templates.test.ts` asserts this); `screenOutput` in `src/lib/ai/screening.ts` additionally blocks love-letter-style appeals for AI surfaces. |
| 4 | Facts-only guidance is shown near the messaging / outreach UI. | **Satisfied in-code** — `agent-outreach.tsx` shows "Contact info is what you entered from the public listing / sign / open house — we don't provide it… stick to property and transaction facts." `message-composer.tsx` and `agency-explainer.tsx` carry the same steering. |
| 5 | Free text that feeds a template / outreach note is screened. | **Satisfied in-code** — the outreach `outcome` and `notes` fields are passed through `screenText` (`src/lib/ai/screening.ts`) before they are stored/used, matching how the offer AI input is screened. |
| 6 | The tool never sends / transmits a message on the buyer's behalf. | **Satisfied in-code** — "Email" / "Call" build `mailtoUrl(...)` / `telUrl(...)` (`src/lib/showings/outreach.ts`) that open the buyer's OWN email / phone app with a prefilled FHA-safe draft. The message composer copies to clipboard. No network send path exists. |
| 7 | Agent contact is buyer-entered from a public source, not provided by us. | **Satisfied in-code** — copy states the buyer entered it "from the public listing / sign / open house — we don't provide it." There is no lookup / directory feature. |
| 8 | **Final FHA legal review before launch.** | **DEFERRED — external.** A licensed attorney / fair-housing review of the templates, copy, and screening must be recorded before launch. This cannot be completed in-repo and remains an open gate. |

## Deferred external gate

Item #8 requires review by a licensed attorney / fair-housing counsel and
**cannot** be satisfied by code in this repository. Treat it as a hard, blocking
launch gate:

- Do not launch buyer-facing messaging / outreach until the review is recorded.
- When sign-off is obtained, record who reviewed it and the date here, and flip
  item #8 to satisfied.

> Status: FHA legal review has **not** been performed. Nothing in this
> repository should be read as completed fair-housing legal review.

## Key references

- `src/lib/showings/types.ts` — `AgentContact` / `OutreachEntry` (facts-only shapes).
- `src/lib/showings/outreach.ts` — `mailtoUrl` / `telUrl` (open the buyer's own app; never transmit).
- `src/lib/showings/templates.ts` — closed, FHA-safe placeholder set; no love letter.
- `src/lib/ai/screening.ts` — `screenText` (input redaction) / `screenOutput` (love-letter + protected-class block).
- `src/components/showings/agent-outreach.tsx` — agent contact + outreach log; facts-only copy; screens free text.
- `src/components/showings/message-composer.tsx` / `agency-explainer.tsx` — facts-only messaging guidance.
