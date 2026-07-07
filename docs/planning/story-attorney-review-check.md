# Story — UPL-safe attorney-consultation checkpoint

_Owner: Product Manager · attorney-consultation checkpoint story · 2026-06-16_

A single groomed, ready-to-build story for the check that asks the buyer to **confirm their own
status** on consulting a lawyer at the points where the app already advises one — primarily
**before signing the purchase contract**, and again at the **state-specific closing-path point** in
attorney states. It records the buyer's OWN attestation (never our judgment), nudges (never blocks)
toward the attorney directory, and surfaces an outstanding "consult an attorney" item in the cockpit
until the buyer resolves it. Written to the format/DoR/DoD/priority/estimate scale in
[`groomed-backlog-10-sprints.md`](./groomed-backlog-10-sprints.md).

---

## ATT1 — Attorney-consultation checkpoint (attest-only, non-blocking, UPL-safe)

**Pri:** P1 · **Est:** M · **ID:** S1-ATT1 · **Gate → unblock:** **none (buildable now)**

> **As an unrepresented buyer, I want** to be asked — at the moments where a lawyer is advised, above
> all right before I sign the binding contract — whether I've had an attorney review, and to get a
> one-click path to find one if I haven't, **so that** I make that call deliberately (the single best
> way to de-risk buying agent-free) instead of drifting past it, the way an agent would have flagged it.

- **Value/KPI:** The journey, the offer builder, and the state engine already *tell* the buyer to get
  a flat-fee attorney review before signing ("the single best way to neutralize" the agent-free risk —
  `journey/data.ts` stage 6). Nothing today captures whether they acted on it or resurfaces it if they
  didn't. This closes the highest-harm advice-to-action gap without ever crossing into legal advice.
  *KPI:* % of under-contract deals with a recorded pre-sign attestation; click-through from the
  "not yet" nudge to `/pros`; % of "not yet" attestations later resolved.
- **Dependencies:** shipped only — `useStageTool` persistence (`src/hooks/use-stage-tool.ts`),
  `useStateSelection` (`src/hooks/use-state-selection.ts`), the pro directory + finder services
  (`src/lib/pros/`, `/pros`), the 50-state engine (`src/lib/states/`, `attorneyStates()`,
  `getStateProfile`), the cockpit spine (**S1-R3**, `src/lib/cockpit/next-actions.ts`) and the
  completion/resume surfaces (**S0b**, `resumeTarget`). Composes onto them; introduces no new plumbing.

### Where it lives in the IA

The **same checkpoint component reused at each surface**, keyed by a `surface` id (no new top-bar
anchor — decision #8):

1. **PRIMARY — before signing (journey stage 6).** `negotiate-and-go-under-contract` →
   step `counter-and-sign` (`src/lib/journey/data.ts`), rendered near tasks `attorney-review`
   ("Have a flat-fee attorney review the contract before signing") and `sign-contract`. `surface: "pre-sign"`.
2. **PRIMARY — offer builder review/export step.** `src/components/offer/offer-wizard.tsx` final
   review, alongside the existing `OfferDisclaimer` ("subject to attorney review" —
   `src/components/offer/offer-disclaimer.tsx`) and the term-sheet preview, before the buyer treats the
   packet as ready to sign/export. Same `surface: "pre-sign"` attestation (one status, two entry points).
3. **SECONDARY — state closing-path point (journey stage 10).** `title-and-escrow` →
   step `title-search-and-closing-path`, task `confirm-closing-path`. In **attorney states**
   (`StateProfile.attorneyRequiredAtClosing` / `closingPath === "attorney"`, e.g. GA, SC, NC, NY, NJ,
   MA), the checkpoint frames the closing-attorney path with `getStateProfile(code).closingNote`.
   `surface: "closing-path"`. In escrow states it renders informationally (attorney optional, not urged).
4. **Cockpit / tracker surfacing** — see below.

### Acceptance criteria — the four attestation states

The check is a labelled radio group (`TrustCallout tone="info"`, "strongly recommended") with exactly
these options, and it **never gates the Continue / Sign / Export control** in any state:

- **`not-asked` (default / never answered):** the prompt renders ("Have you had an attorney review this
  before you sign?") with the three options unselected and a one-line "why this matters" (strongly
  recommended, your choice). Progress is fully available; nothing is blocked.
- **`reviewed` ("Yes, an attorney reviewed it"):** records the buyer's own "yes"; the nudge is hidden;
  a quiet confirming line remains. Resolves the cockpit/tracker item.
- **`not-yet` ("Not yet"):** a **prominent but non-blocking** nudge appears — `TrustCallout` +
  one-click **"Find a flat-fee real estate attorney"** linking to the directory filtered to the
  buyer's state and role: `/pros?role=attorney&state=<CODE>` (state omitted when unknown → generic
  `/pros?role=attorney`). At the `closing-path` surface in an attorney state, the nudge also shows the
  state closing-path context (`closingNote`). The buyer may still continue/sign/export. **This is the
  outstanding state** that surfaces in the cockpit/tracker.
- **`proceeding-without` ("I'm choosing to proceed without one"):** records the buyer's own informed
  choice; the nudge collapses to a quiet, non-judgmental line ("You've chosen to proceed without an
  attorney review — you can change this any time"). Progress unblocked; resolves the cockpit/tracker item.

Additional criteria:

- **Attestation is the buyer's, never ours.** The component only ever stores and reflects the option
  the buyer selected. It renders **no computed judgment** of whether they "should" have a lawyer, and
  never asserts they must — framing is always "strongly recommended," the choice and any engagement are
  the buyer's.
- **Persistence + resume.** The attestation persists per surface via `useStageTool` (auto-syncs to
  signed-in accounts through the existing `hod:tool:*` sync sweep) and survives reload/resume (S0b).
  Re-entering a surface shows the prior answer, editable. `hydrated` guard before first paint (no flash).
- **A11y.** Real radio group (`role="radiogroup"`, labelled options), keyboard-operable, visible focus
  ring, ≥44px targets, the directory link is a real focusable `<a>`; the outstanding-item count is
  `aria-live` polite. Status conveyed by text+icon, never color alone.
- **State awareness is a convenience, never a requirement.** Unknown/no state → the generic directory
  link + generic copy, no crash (mirror the state-picker fallback pattern used across tools).

### Cockpit / tracker surfacing

- **Cockpit (S1-R3 spine).** When the `pre-sign` attestation is **`not-yet`** — or is still `not-asked`
  once the buyer has reached the offer/under-contract stages — the cockpit surfaces **exactly one**
  non-urgent, **dateless** action card: title "Consider an attorney review before you sign", why-line
  "Strongly recommended before a binding contract — your choice", deep link `/pros?role=attorney&state=<CODE>`.
  It sorts at `NO_DATE_RANK` (never above a real dated deadline) and carries no urgency chip and no
  "of record" date. The card **disappears** the moment the buyer attests `reviewed` or
  `proceeding-without`. Implemented by extending the cockpit's action assembly (a small
  attestation-derived action folded in alongside `computeNextActions`), not by mutating home rollups.
- **Tracker (`/tracker`).** The same outstanding item shows as a checklist-style "Consult a real estate
  attorney (recommended)" row with the directory link, resolved (checked/cleared) once the buyer attests
  reviewed or proceeding-without. Never a hard blocker on any tracker action.

### Test plan (layered)

- **Pure attestation model (Vitest)** — `src/lib/attorney/consultation.ts`: default is `not-asked`;
  the only outstanding status is `not-yet` (`isOutstanding`); `not-asked` counts as outstanding only
  once the buyer is at/after the offer stage (pass the stage/flag in, keep the fn pure);
  `reviewed`/`proceeding-without` resolve; `prosLinkForState("ca")` → `/pros?role=attorney&state=CA`,
  no state → `/pros?role=attorney`; attorney-state vs escrow-state context selection via a stubbed
  profile (`attorneyRequiredAtClosing`). **~10–14 assertions.**
- **Component (RTL)** — renders the three options at each surface; selecting **"Not yet"** reveals the
  nudge and the directory link with the correct `href` (incl. state); selecting **"reviewed"** /
  **"proceeding-without"** hides the nudge and records the attestation; the prior answer rehydrates on
  re-mount; `hydrated` guard; radio group keyboard-navigable. **~6–8.**
- **UPL "no directive / not-blocking" assertions (the point of the story)** — assert the checkpoint's
  copy contains **no imperative directive** ("you must hire", "required", "you should hire", "hire a
  lawyer or you can't proceed") — clone the screening/UPL assertion pattern used in the offer suite;
  assert the **Continue / Sign / Export control is never disabled or blocked** by any attestation value
  (drive all four states, control stays enabled); assert the component renders **only the option the
  buyer selected** and never a computed "you need a lawyer" verdict; assert the directory link resolves
  to the real finder services / sample-labelled pros, never a fabricated attorney. **~6–8.**
- **Cockpit (Vitest)** — a `not-yet` (or stage-gated `not-asked`) attestation yields exactly one
  dateless, non-urgent action sorted below any dated deadline; a `reviewed`/`proceeding-without`
  attestation yields none. **~4–6.**
- **E2E (Playwright, ~1)** — on an under-contract deal: pre-sign checkpoint visible → choose "Not yet"
  → cockpit shows the attorney item and the `/pros?role=attorney&state=…` link → choose
  "an attorney reviewed it" → item clears. No live directory calls.

### Implementation notes (real paths)

- **Pure core:** new `src/lib/attorney/consultation.ts` — `type AttestationStatus =
  "not-asked" | "reviewed" | "not-yet" | "proceeding-without"`; a per-surface record
  (`{ [surface: string]: { status; updatedAt } }`); pure helpers `isOutstanding(status)`,
  `attorneyReviewOutstanding(record, { atOrAfterOfferStage })`, `prosLinkForState(code?)` →
  `/pros?role=attorney&state=<CODE>`, and `attorneyContextForState(code)` (returns the attorney-state
  vs escrow-state framing from `getStateProfile`/`attorneyStates()`). No React, no DOM — fully
  unit-testable, mirroring `lib/cockpit/next-actions.ts`.
- **Persistence:** `useStageTool<AttorneyConsultRecord>("attorney-consult", INITIAL)` — one
  `hod:tool:attorney-consult:v1` blob keyed by `surface`; auto-syncs to signed-in accounts via the
  existing sync sweep and `emitLocalChange()`. **No new table, no migration, no flag.**
- **Component:** new `src/components/legal/attorney-checkpoint.tsx` —
  `<AttorneyCheckpoint surface="pre-sign" | "closing-path" />`. Reads `useStageTool` +
  `useStateSelection`; renders the three-option radio group inside a `TrustCallout tone="info"`
  (strongly-recommended, non-blocking tier — sits between the quiet `ToolDisclaimer` and the loud
  `DisclaimerBanner`); the "Not yet" nudge links to `prosLinkForState(...)`. Reused at all four IA
  entry points; server-safe hydration guard.
- **Directory:** extend `/pros` (`src/app/pros/page.tsx`) to read a `state` search param and pass it to
  the already-supported `getSamplePros({ role, state })` filter (the lib supports it today; only the
  page needs to thread the param). No directory data changes.
- **Cockpit/tracker wiring:** fold the attestation-derived action into the cockpit action assembly
  (thin, dateless, `NO_DATE_RANK`) and add the outstanding row to the tracker checklist. No change to
  `HomeRollup`.
- **Copy reuse:** lean on the already-cleared attorney-handoff language (`proRoleLabels.attorney.blurb`,
  the stage-6 `withoutAnAgent`/`attorney-review` task copy, the `go-solo` tool). No new legal claim to
  clear.

### Compliance

- 🟡 **UPL is the whole point.** We **prompt and inform, we do not require, advise, or opine.** The
  check records the buyer's OWN attestation; it never renders our judgment of their legal status, never
  says they "must" hire a lawyer, and never blocks progress. Framing stays "strongly recommended";
  attorney choice and engagement are the buyer's. The UPL assertions above are DoD gate #5, not a comment.
- 🟦 **FHA.** The attestation is an app-controlled enum with no free-text; if any optional note field is
  added it routes through `screenText`/`screenOutput` and stays off the AI allowlist. Directory
  filtering is on objective attributes (state, role) only.
- 🟪 **RESPA.** The directory is a flat, disclosed, fee-free handoff (real finder services + clearly
  labelled samples) — no referral-for-fee, no % of price.
- 🟧 **UDAP / H2.** Any flat-fee stat surfaced in copy (e.g. "$500–$1,500") carries a `SourceStamp`
  (source + as-of) per the S1-H2 cadence.

### Gate → roadmap slot

- **Gate:** **none.** No vendor key, no new legal sign-off (reuses already-cleared attorney-handoff
  copy and the existing directory). No default-OFF flag needed — buildable and default-ON now.
- **Roadmap slot:** **S1 fast-follow to S1-R3** (it plugs directly into the cockpit spine and the S0b
  resume surfaces, both landing in S1) — or, if S1 is full, the **first S2 pickup**. Small, gate-free,
  high UPL value; it should not wait behind any gated epic.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal (UPL boundary confirmation only).
