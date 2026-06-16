# HomeOffer Direct — 10-Sprint Roadmap

_Owner: Product Manager · 10-sprint roadmap · 2026-06-16_

This is the authoritative forward roadmap for the next ten sprints. It reconciles the
**Buyer's-Agent Advisor** lens (depth: make the deal *live*; light up the two-sided
platform; quarterback financing/title; productionize the AI) with the **Market
Researcher** lens (monetization-now; a funded competitor — Homa, FL, free + $1,995 Pro;
buyer-side commission stable ~2.42%; AI-claims UDAP enforcement rising; press the 50-state
SEO moat) against the **business KPIs** (north-star = realized buyer savings; the
savings-calc → market-read → offer-builder → unlock → closed-deal funnel). It builds on the
two replan briefs (`realtor-priorities.md`, `market-research-priorities.md`) and the
now-shipped buyer's-agent backlog (`product-backlog.md`); it does **not** re-derive them.

---

## Strategy statement

The buyer's-agent worksheet gaps are closed and the SEO/legal-engine moat is shipped — so
the next ten sprints make two simultaneous bets and refuse to stall behind gates. **Bet
one: turn on monetization now**, because a funded rival (Homa) is already collecting
buyer-side dollars and every free month cedes the price anchor and the willingness-to-pay we
can't measure without a paywall; we ship the flat, no-commission, no-loan/title-cross-sell
unlock (#41/#58) as our structural trust wedge, priced as a tiered DIY/Guided test that we
deliberately re-test *upward* toward the in-market $1,995 anchor. **Bet two: close the
"dangerous middle" of the live deal** — real reminders, document custody, an active
next-actions cockpit, and the financing/title spine — because that is the agent value
worksheets can't fake and it is exactly what makes a paid unlock worth paying for. We
sequence buildable-now value first (the reminders/cockpit/binder-plumbing and the
SEO/parity work need no external gate), and where a gate exists (Stripe, email vendor,
Anthropic key, e-sign, public-AI-claims legal sign-off) we ship **flag-gated and
plumbing-first** behind a default-off seam — mirroring how RentCast and the Gemini
explainers already ship — so the gate clears into working software rather than blocking the
sprint. The two-sided collaboration platform (shared workspace, agent console) is real but
correctly *later*: we light up the single-deal shared workspace once it has documents worth
sharing, and we hold the agent console behind the pricing decision, because 2026 competitive
fire is in the buyer-direct lane and the unrepresented buyer stays the homepage hero.
Everything stays inside the UPL / FHA / UDAP / RESPA / SAFE-Act guardrails the codebase
already enforces; public savings and AI claims do not launch ahead of the deferred external
legal sign-off.

---

## Sprint-by-sprint table

| Sprint | Theme / goal | Epics & stories (IDs) | Primary success metric | Key dependencies | Gate (vendor / legal / decision) + recommended unblock |
|---|---|---|---|---|---|
| **S1** | **Reminders + cockpit (buildable-now agent value)** | R1 reminders (in-app/browser-push first, on existing accounts) · R3 active next-actions dashboard · H2 fact/date freshness sweep | % of active deals with ≥1 reminder armed; weekly return rate of signed-in users to the cockpit | Accounts/cloud-sync + `computeMilestones` (shipped); R3 composes existing selectors | **None for the in-app/push path** — explicitly *no* email vendor needed; email is the S2 fast-follow. Ship push behind the existing account. |
| **S2** | **Monetization on (close the "free while rivals charge" gap)** | #41 paywall/unlock + #58 paid export · #63 pricing **decision** (founders) · tiered DIY/Guided WTP test · funnel→unlock instrumentation · email fast-follow for R1 reminders + receipts (#42) | Free→paid conversion at the unlock; WTP read across price points; realized-savings event fires at unlock | Funnel events (stood up with A2, shipped); R1 (S1) for the email path | **Stripe (#41) + pricing decision (#63) + email vendor (#42).** Unblock: founders commit DIY price + one Guided tier tested *upward*; add Stripe test key (plumbing behind `PAYMENTS_ENABLED` default-off); pick Resend. Ship paywall flag-gated so the build lands before the key. |
| **S3** | **Document custody (the connective tissue)** | R2 document binder — upload/store/organize on Supabase Storage, per-deal RLS, encryption-at-rest, consent + delete-on-demand · attach-points for A5 disclosure / A4 contacts | % of paid deals storing ≥1 document; binder retention to closing | Supabase Storage (in stack); pairs with #58 paid export | **GLBA custody bar + legal sign-off on retention/consent.** Unblock: legal signs the per-deal-consent + field-scoping + retention/delete policy (same regime PRD names for the represented path); ship binder behind `DOC_BINDER_ENABLED`, wire-instructions object carries the existing wire-fraud callout. |
| **S4** | **Productionize the AI explainers (cheapest jump in "agent intelligence")** | AI1 — promote #36 offer-strength + #57 budget to a production provider (Anthropic/Claude per `external-dependencies.md`), cost/rate-limit/caching, abuse controls; flip default-on **only behind public-claims sign-off** | % of offer/budget sessions viewing an explainer; explainer→offer-completion lift | Provider seam + two impls (shipped); R2 not required | **Legal sign-off for public AI claims (hard gate) + Anthropic key.** Unblock: legal clears the conservative, grounded-only claim copy (narrate-our-numbers, never compute/advise); add `ANTHROPIC_API_KEY`; keep the seam swap one-file. Ship provider live but **default-off** until sign-off, then flip. |
| **S5** | **Financing spine (the most dangerous under-contract gap)** | F1 financing-milestone tracker (loan process, appraisal, underwriting conditions, CTC-by-financing-date) composing R1 reminders + R3 cockpit | % of under-contract deals tracking ≥1 financing milestone; reminder coverage of the financing date | R1 (S1), R3 (S1); appraisal arithmetic exists (`clear-to-close`) | **None** (SAFE-Act boundary, not a vendor gate). Keep process-only — "ask your lender," never quote a rate-as-offer or recommend a lender. |
| **S6** | **Title/closing depth + post-close LTV** | F2 title-commitment review (A5-pattern clone) + pre-CD closing-cost estimator · F3 post-close depth (state-aware homestead/exemption deadlines, tax-appeal windows, escrow-analysis literacy, refi-watch) | Title-review completion among under-contract deals; post-close page engagement / return visits | State engine + A5/A6 checklist pattern (shipped) | **Legal sign-off on the title-review boundary** (same regime as disclosure review). Unblock: reuse the cleared A5/A6 boundary copy; F3 tax/homestead facts carry source + as-of date (H2 cadence). |
| **S7** | **SEO + tools flywheel (press the moat) + AI explainer extension** | SEO1 — tool-led transactional intent pages on the 50-state engine (savings calc, offer builder, state closing-path "…in <state>") tuned for AI-Overview resilience · AI2 — grounded explainers on A2 price-band rationale + disclosure red-flags | Organic sessions to tool pages; tool-page→activation; A2-rationale explainer view rate | 50-state engine + 51 pages (shipped); AI2 depends on AI1 (S4) | **A2 explainer narration governed by the public-AI-claims sign-off (S4).** Unblock: A2 narration says "comps + market *suggest a range*; you decide," never "offer $X" — most conservative grounding. |
| **S8** | **Light up the shared deal workspace (the dormant two-sided promise)** | T1 — shared activity feed, change attribution, presence, conflict handling on shared tool state; agency-relationship capture workflow before an agent sees buyer data | Invited-member activation (invitee performs ≥1 action on a shared deal); co-buyer/agent retention | R2 documents (S3) to make sharing worthwhile; deals/roles/RLS/invites (shipped) | **GLBA field-level scoping + per-deal consent + dual-agency capture; RESPA review if any shared surface touches referral/closing revenue.** Unblock: legal signs the consent-before-visibility + agency-capture workflow; consent dated + revocable. |
| **S9** | **In-deal comms + live-data parity** | T3 — in-deal messaging/structured comments (every message through `screenText`/`screenOutput`) · P2-6 — productionize the flagged RentCast market/listings tools to parity within margin guardrails (`RENTCAST_DISABLED` kill switch) | Messages sent per active shared deal; live-data tool usage at no margin breach | T1 (S8) for a workspace to comment on; RentCast seam (shipped, flagged) | **None new** (FHA screening is the gate, enforced in-code). Unblock: messaging is the riskiest free-text FHA leak vector — route 100% through the screening seam, off the AI allowlist. Watch RentCast data-cost; kill switch caps it. |
| **S10** | **Agent console wedge (gated expansion) + trust upkeep** | T2 — agent multi-client console / pipeline / "For agents" entry + seat model (#62) · H1 listings/MLS honesty refresh · H2 recurring fact/date sweep | Agent seat sign-ups / pipeline deals per agent (pilot); honesty-copy currency | T1 (S8); hard-gated on pricing (#63) + monetization (S2 proven) | **Pricing decision (#63) + RESPA review (paid seats must not be referral-for-fee).** Unblock: only build once S2 monetization proves out and founders approve agent-seat pricing; RESPA-clean seat model, fee-free pro directory unchanged. |

---

## Detailed sprint notes

### S1 — Reminders + cockpit (no gate; ship first)
- **R1 reminders, in-app/push first.** Converts A8's one-time `.ics` into the proactive
  nag that is an agent's single highest harm-prevention value. Ship a server scheduler +
  opt-in + in-app/browser-push on the existing account; re-fire when contract dates move.
  **Email path is deliberately deferred to S2** so this sprint carries no vendor gate.
- **R3 active next-actions dashboard.** Cheap composition of shipped pure functions
  (`computeMilestones`, stage selectors, A4 contacts) into "the 1–3 things to do this week
  and why." Defends the mid-journey drop-off; best effort-to-value ratio in the replan.
- **H2 freshness sweep.** Operationalize the source+date review so dated legal/market
  claims don't rot (accuracy/UDAP protection).
- **Guardrails.** UPL: reminders/next-steps are *process* ("schedule your inspection by the
  contingency date"), never directive. No deadline is "of record" — the contract governs.

### S2 — Monetization on (the urgent competitive call)
- **#41/#58 paywall + paid export**, tiered **DIY (anchor) / Guided (premium)**, anchored
  to "keep 95%+ of your ~$10k." Per the pricing analysis, run the WTP test but **add a
  Guided tier meaningfully above the $199–$499 band** toward Homa Pro's $1,995 — the band
  alone risks anchoring us as the "cheap DIY" option.
- **Trust wedge in copy:** "we don't earn a commission and don't sell your loan or title" —
  a flat-fee position Homa's transaction-broker and reAlpha's mortgage/title-cross-sell
  models structurally can't claim.
- **Email fast-follow (#42)** lights up the R1 email reminder path + sends receipts.
- **Guardrails.** UPL/RESPA: tiers are tools+education, not advice; referrals stay flat,
  disclosed, fee-free. UDAP: savings copy stays conditional ("up to ~2.5%, if you ask and
  the deal allows", per J2) and does not launch ahead of external legal sign-off.

### S3 — Document custody
- **R2 binder.** The connective tissue every later feature wants: A5 has nothing to attach
  the actual disclosure to; A4 can't hold the title commitment; T1 (S8) is hollow without
  shared documents; and it unblocks the paid-export/e-sign path. Heaviest single item,
  highest structural payoff. Supabase Storage shrinks it.
- **Guardrails.** We *store*, we don't *interpret legal sufficiency* (UPL line). No
  OCR-into-advice; no protected-class signals derived from stored docs (FHA). GLBA: per-deal
  consent + field-scoping, retention + delete-on-demand. Wire instructions carry the
  wire-fraud callout.

### S4 — Productionize the AI explainers
- **AI1.** The hard part (grounding, screening, seam, two impls) is done; what's left is a
  production provider + the gated public-claims sign-off — a decision, not a rebuild, and
  the cheapest large jump in perceived agent intelligence. Provider per
  `external-dependencies.md` (Anthropic/Claude, grounded, no-math).
- **Guardrails.** UPL is the whole ballgame: the model **only narrates our deterministic
  factors**, never invents numbers or gives directives. Every input allowlisted + screened;
  no free-text reaches the model unscreened. Ship live but default-off; flip on only behind
  sign-off. Cost/abuse controls before default-on (the rising UDAP enforcement makes
  conservative claims non-optional).

### S5 — Financing spine
- **F1.** Between offer-accepted and clear-to-close the loan is the thing most likely to
  blow up a deal; today we have a doc checklist and a low-appraisal calc but no tracked
  loan-process timeline. Composes with R1 reminders + R3 cockpit.
- **Guardrails.** SAFE-Act: educate on the process, never quote a rate-as-offer or
  recommend a lender; "ask your lender."

### S6 — Title/closing depth + post-close LTV
- **F2** title-commitment review (A5-pattern clone) + a pre-CD closing-cost estimator;
  **F3** post-close depth (homestead/exemption deadlines, tax-appeal windows, escrow
  literacy, refi-watch) — the cheapest retention/referral surface and evergreen SEO that
  extends LTV past the one transaction.
- **Guardrails.** UPL: surface *what to check / what to ask the title officer*, never "this
  exception is/isn't a problem"; tax/homestead framed neutrally with source + as-of date.

### S7 — SEO/tools flywheel + AI explainer extension
- **SEO1.** Press the 50-state moat (Homa is FL-only; reAlpha/Prevu ~8–13 states). In a
  modest-volume 2026 market, organic efficiency dominates unit economics; prioritize
  **tool-led / transactional intent** pages over pure explainers to survive AI Overviews.
- **AI2.** Extend the grounded explainer to the A2 price-band rationale (the most
  directive-prone surface) and disclosure red-flags — pure reuse of the proven seam.
- **Guardrails.** A2 narration is the most conservatively grounded: "suggests a range; you
  decide," never "offer $X." FHA: SEO/saved-search stays on objective attributes, no
  demographic/"good schools as value" proxies.

### S8 — Shared deal workspace
- **T1.** The v2 PRD's collaboration promise is dormant infra; the expensive foundation
  (deals/roles/RLS/invites) is done, so Wave 3 finally makes invitations meaningful and
  serves the represented-buyer persona. Sequenced *after* R2 so there are documents worth
  sharing.
- **Guardrails.** GLBA field-level scoping + per-deal consent before a buyer's financials
  are visible to an invited agent; **force agency-relationship capture** (guards accidental
  dual agency) before an agent sees buyer data; consent dated + revocable. RESPA review on
  any shared revenue surface.

### S9 — In-deal comms + live-data parity
- **T3** messaging — the riskiest new high-volume free-text surface; every message routes
  through `screenText`/`screenOutput`, kept off the AI allowlist (FHA: no
  protected-class/steering/love-letter content reaching the other party). It's a comms pipe,
  not advice (UPL).
- **P2-6** — productionize the flagged RentCast market/listings tools to *parity* (it's
  becoming table stakes, not a wedge) within margin guardrails; `RENTCAST_DISABLED` kill
  switch caps data-cost.

### S10 — Agent console + trust upkeep
- **T2 (#62).** The expansion/monetization wedge — paid agent seats, pipeline, "For agents"
  entry. Correctly last: only after T1 proves the single-deal loop and S2 monetization
  proves out; **hard-gated on the pricing decision**.
- **H1** keep `/listings` honesty copy current as Clear Cooperation / portal policy evolves;
  a real feed remains a strategic/cost decision out of sprint scope. **H2** recurring sweep.
- **Guardrails.** RESPA: paid seats must not be referral-for-fee; the pro directory stays
  the only referral surface, fee-free. The unrepresented buyer stays the homepage hero —
  the agent path must not dilute that or relax the buyer's UPL/FHA guardrails.

---

## Decisions we need from the founders

1. **Pricing model + tier boundary (#63) — the single most blocking decision.** Confirm:
   (a) a **flat one-time unlock** (not % of price, which recreates the agent-commission
   conflict we exist to remove; not monthly, which a once-per-transaction buyer churns);
   (b) the **DIY anchor price** and at least **one Guided tier tested *upward*** toward the
   in-market $1,995 anchor (our planned $199–$499 band likely under-monetizes the guided
   tier); (c) what is DIY vs. Guided (the paywall should sit on the highest-value
   artifact — operative offer/export + binder + handoffs). *Blocks S2; gates S10.*
2. **Legal sign-off — schedule the deferred external review now.** Three distinct clearances
   on the critical path: **(i) public AI claims** (blocks AI1 default-on, S4; AI2, S7);
   **(ii) document-custody consent/retention** under the GLBA regime (blocks R2, S3);
   **(iii) the shared-workspace consent-before-visibility + agency-capture + RESPA posture**
   (blocks T1, S8). J2 conditional-savings copy and any public savings copy also do not
   launch ahead of (i)'s public-claims clearance.
3. **Which vendors to commit, and when:**
   - **Stripe (#41)** — required for S2. Recommend adding a test key now and shipping the
     paywall behind `PAYMENTS_ENABLED` (default-off) so the build lands before the live key.
   - **Email provider (#42)** — required for the S2 email path / receipts; recommend
     **Resend**. (S1 reminders ship without it via in-app/push.)
   - **Anthropic / Claude API key (#36/#57)** — required for AI1 default-on (S4); the
     grounded, no-math production provider per `external-dependencies.md`.
   - **E-signature (#45)** — *not* on this 10-sprint critical path; defer to the
     legally-reviewed paid-contracts epic. Flag only.
   - **Real listing feed (IDX/MLS)** — strategic/cost decision, out of sprint scope; keep
     `/listings` honest (H1) until a data deal exists.

---

## KPIs each sprint moves (north-star = realized buyer savings; funnel)

| Sprint | North-star lever | Funnel stage moved | Leading KPI |
|---|---|---|---|
| S1 | Protects closed-deal outcome (no missed contingency) | Activation / mid-journey retention | Reminders armed per deal; weekly cockpit return rate |
| S2 | **Captures revenue + first measurable WTP**; realized-savings event fires at unlock | **Unlock / conversion** | Free→paid conversion; price-point WTP read |
| S3 | Makes the paid unlock worth keeping (custody) → retention to close | Post-unlock retention | Deals storing ≥1 document; binder-to-closing retention |
| S4 | Perceived agent intelligence → offer-completion lift | Market-read → offer-builder | Explainer view rate; explainer→completion lift |
| S5 | Prevents financing-stage deal collapse | Under-contract → clear-to-close | Financing-milestone coverage; financing-date reminder coverage |
| S6 | Title-risk catch + extends LTV past close | Closing + post-close | Title-review completion; post-close return visits |
| S7 | **Lowest-CAC acquisition** (organic) feeds the whole funnel | Top-of-funnel → activation | Organic sessions to tool pages; tool-page→activation |
| S8 | Serves the represented-buyer persona; deepens retention | Activation (invited members) | Invitee activation; multi-party deal retention |
| S9 | Keeps coordination on-platform; data parity | Mid-journey retention | Messages per shared deal; live-data tool usage |
| S10 | Opens the agent expansion revenue line | New (agent) acquisition | Agent seat sign-ups; pipeline deals per agent |

---

## Sequencing rationale (the trade-off calls)

- **Buildable-now value leads (S1).** Reminders and the cockpit need no external gate and
  are the highest harm-prevention-per-dollar work in the replan — so they ship before
  anything gated, and they de-risk every later "do this now" surface.
- **Monetization is pulled to S2, not deferred.** The market call is explicit: a funded
  rival is collecting buyer-side dollars and we cannot measure WTP without a paywall.
  Plumbing-first (flag-gated Stripe) means the founders' pricing decision clears into
  working software, not a blocked sprint.
- **Documents (S3) before collaboration (S8).** The advisor and researcher agree: the
  shared workspace is hollow without shared documents, and 2026 competitive pressure is in
  the buyer-direct lane — so custody comes first and the two-sided platform is built only
  once it has something worth sharing.
- **AI is gated, so it's plumbing-first too (S4), extended later (S7).** The seam and two
  impls exist; we promote the provider and flip on only behind the public-claims sign-off,
  then extend to the highest-value surfaces once the legal posture is proven.
- **The financing/title spine (S5–S6)** is the thinnest *spine* gap and composes cleanly on
  S1's reminders/cockpit — middle-and-end-of-journey capability, not polish.
- **The agent console (S10) is last by design** — hard-gated on the pricing decision and
  dependent on T1; we defend the buyer-hero lane first and expand only once monetization
  proves out.
