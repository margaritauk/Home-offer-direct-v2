# Buyer's-Agent Advisor — 10-Sprint Replan Priorities

_Contributor: Buyer's Agent Advisor · 10-sprint replan · 2026-06-16_

## How to read this

My first audit (`docs/advisory/buyer-agent-gap-analysis.md`) is **done** — every
A/I/J item shipped. The transaction *spine* and the *judgment layer* (market read,
suggested price band, tactics, negotiation playbook, disclosure/HOA review,
contacts, deadlines, go-solo) are now on main. This is the **forward-looking**
replan: where does the product *still* fall short of an end-to-end buyer's agent,
now that the obvious worksheet gaps are closed?

The honest summary: **we built the pre-offer and offer-strategy brain very well.
What a real agent also does — and we still barely do — is (1) carry a live deal
forward through under-contract → close as a tracked, reminded, document-aware
process; (2) be a true two-sided collaboration surface where a represented buyer
and their agent actually work the same deal; and (3) coordinate the financing and
title/closing legwork an agent quarterbacks day-to-day.** A lot of what's left is
*not polish* — it's the "middle and end of the journey" that worksheets can't fake,
plus the represented/agent side that the v2 PRD promised but only built as dormant
infrastructure.

Below: ranked, grouped by theme, each item with **(1) problem · (2) why now ·
(3) size · (4) deps/risks · (5) UPL/FHA guardrails.** Sizes use the backlog scale
(S ≤3d · M ~1–2wk · L >2wk). A "top 5" summary closes it out.

---

## Theme 1 — Make the deal *live*: reminders, document custody, and an active dashboard

This is the highest-leverage theme. We have a beautiful *static* tracker and an
`.ics` export (A8), but a real agent's core daily value under contract is being the
**active nag and the document custodian**. Right now the product cannot remind a
signed-in user, cannot hold a single document, and the per-home dashboard is a
status board, not a "what do I do today" cockpit. The journey is strong at the ends
(education up front, checklists at close) and *passive* in the dangerous middle.

### R1 — Real deadline reminders (email/push), not just calendar export **[P0] · M**
1. **Problem.** A8's `.ics` is a one-time push into the buyer's calendar; if they
   skip it, or their contract dates change, nothing chases them. Missing a
   contingency-removal or financing date costs earnest money or the house — the #1
   thing an agent prevents. Cloud sync + accounts already exist; we have the
   identity to reach people and we're not using it.
2. **Why now.** Accounts/sync and the deal model are shipped but inert for
   *outbound* contact. This converts the no-account safety-net (A8) into the actual
   agent behavior — proactive, recurring, re-fired when dates move. Highest
   real-world harm-prevention per dollar in the whole backlog.
3. **Size.** M (server scheduler + opt-in + the email vendor that's currently
   gated). Could ship as **in-app + browser-push first (S–M)** to dodge the email
   vendor dependency, then add email.
4. **Deps/risks.** Email is a **gated vendor decision** (see PRD §monetization /
   "email — vendor+legal"). De-risk by shipping in-app/push reminders behind the
   existing account first; treat email as a fast-follow once the vendor clears.
   Needs CAN-SPAM/opt-out hygiene on any email path.
5. **Guardrails.** Reminder copy stays factual ("Inspection contingency deadline —
   verify against your contract"), never directive ("waive it"). No deadline is
   "of record"; the contract governs. Reuse A8's neutral descriptions.

### R2 — Document binder with real file custody (upload, store, organize) **[P0] · L**
1. **Problem.** `documents.ts` is a *checklist of document names* — the buyer ticks
   "have pre-approval letter" but the product holds nothing. An agent (via their
   transaction-management system) is the buyer's filing cabinet: signed offer,
   inspection report, disclosures, CD, title commitment, wire instructions all in
   one place, retrievable at closing. Today the buyer juggles email attachments.
2. **Why now.** This is the connective tissue every later feature wants: the
   disclosure-review worksheet (A5) has nothing to attach the actual disclosure to;
   the contacts hub (A4) can't store the title commitment the title officer sends;
   shared workspace (T2) is hollow without shared documents. It also unblocks the
   future paid-export/e-sign monetization path.
3. **Size.** L (storage, per-deal scoping, encryption-at-rest, RLS, virus posture).
   Supabase Storage is already in the stack, which shrinks it.
4. **Deps/risks.** GLBA/financial-data custody raises the compliance bar — the v2
   PRD already names **field-level scoping + per-deal consent (GLBA)** for the
   represented path; document custody is the same regime. Wire instructions are the
   most sensitive object stored — pair with the existing wire-fraud callout. Cost of
   storage is the only infra risk.
5. **Guardrails.** We *store* documents, we don't *interpret legal sufficiency*
   (UPL line, same as A5/A6). No OCR-into-advice. FHA: never derive
   protected-class signals from stored docs. Consent + retention/delete on demand.

### R3 — Active "next actions" dashboard (the agent's daily driver) **[P1] · M**
1. **Problem.** `/dashboard` is a per-home status board. An agent translates the
   tracker into **"here are the 1–3 things to do this week and why."** We have all
   the inputs (milestones, stage, open checklist items, contacts, market read) but
   no surface that prioritizes them into a single forward action list.
2. **Why now.** Cheap given everything that's shipped — it's a *composition* of
   existing pure functions (`computeMilestones`, stage selectors, A4 contacts), not
   net-new logic. It's the difference between a reference site and a co-pilot, and
   it's where retention lives (the middle-journey drop-off the backlog worried about).
3. **Size.** M (mostly UI + a small prioritization selector over existing data).
4. **Deps/risks.** Best after R1 (so "do this now" can also be reminded). Risk:
   becoming a directive engine — keep it "tasks the contract/stage imply," not advice.
5. **Guardrails.** UPL: surface *process* next-steps ("schedule your inspection by
   the contingency date"), never strategic directives ("offer $X", "waive Y"). FHA: n/a.

---

## Theme 2 — Deliver the two-sided platform the v2 PRD promised (it's still dormant)

The v2 PRD repositioned the product as a **collaboration platform** for
unrepresented buyers, represented buyers, **and agents** — "one deal model that
works with or without an agent." On main, that exists only as **dormant
infrastructure**: a `Deal`/`DealMember`/`DealAgency` type model, RLS, invitations,
and agency-capture types — but **no shared workspace, no agent console, no activity
feed, no messaging.** The whole "represented/agent-collaboration side" the task asks
me to cover is essentially *unbuilt above the data layer*. This is the biggest
strategic gap between the PRD's vision and shipped reality.

### T1 — Light up the shared deal workspace (multi-user, not just multi-row) **[P1] · L**
1. **Problem.** Invitations and roles exist, but two people on one deal don't
   actually *see each other's work*: no shared activity feed, no presence, no
   "your agent updated the offer." A co-buyer, attorney, or agent invited today
   lands on... the same local-first tools, not a genuinely shared, live deal.
2. **Why now.** The foundation (Wave 1/2 — deals/roles/RLS/invites) is the
   expensive part and it's **done**. Wave 3 (shared workspace) is the payoff that
   makes the invitations meaningful. Without it the collaboration story is a promise,
   not a product, and the represented-buyer persona has no reason to invite anyone.
3. **Size.** L (activity feed, change attribution, conflict handling on shared
   tool state, per-field consent scoping).
4. **Deps/risks.** Depends on R2 for shared *documents* to be worth sharing. GLBA
   field-level scoping + per-deal consent (PRD) is mandatory before a buyer's
   financials are visible to an invited agent. RESPA review if any shared surface
   touches referral/closing revenue.
5. **Guardrails.** **Agency-relationship capture (avoid accidental dual agency)** —
   the `DealAgency` type is built; the *workflow* that forces capture before an agent
   sees buyer data isn't. FHA on any shared recommendation. Consent dated + revocable.

### T2 — Agent multi-client console (the "For agents" path) **[P2] · L**
1. **Problem.** The PRD's third persona — the **agent managing many deals** — has
   zero surface. No pipeline, no per-client next-actions, no agent entry path. We
   can't serve represented buyers' agents at all today.
2. **Why now.** It's the expansion/monetization wedge ("paid agent seats,
   RESPA-safe") the research recommended. But it's correctly *later*: it only makes
   sense after T1 proves the single-deal collaboration loop, and it depends on the
   gated **pricing decision** and **monetization** epics.
3. **Size.** L (new console IA, pipeline views, seat model).
4. **Deps/risks.** Hard-gated on the **pricing decision** and **monetization**
   (both explicitly deferred). Don't build ahead of that. Depends on T1.
5. **Guardrails.** RESPA (paid seats must not be referral-for-fee). The
   unrepresented buyer stays the homepage hero — the agent path must not dilute that
   or relax the buyer's UPL/FHA guardrails (PRD: "guardrails by audience").

### T3 — In-deal messaging / structured comments **[P2] · M**
1. **Problem.** Coordination today happens off-platform (text/email). An agent is
   the communication hub; a shared deal with no comms thread leaks the conversation
   out of the system and weakens every other shared surface.
2. **Why now.** Natural companion to T1; modest once the workspace exists. Lower
   than T1 because async comments add value only after there's a shared workspace to
   comment *on*.
3. **Size.** M (thread model + screening on every message).
4. **Deps/risks.** Depends on T1. **Every free-text message must route through the
   existing `screenText`/`screenOutput` seam** — this is a new high-volume free-text
   surface, the riskiest FHA leak vector we'd add.
5. **Guardrails.** FHA: screen all messages (no protected-class/steering/love-letter
   content reaching templates or the other party). UPL: it's a comms pipe, not advice.

---

## Theme 3 — Quarterback the financing + title/closing legwork (still thin mid/late-journey)

An agent doesn't just price the offer — they **chase the loan, the appraisal, the
title, and the closing**. Our coverage here is real but shallow: `lender-compare`
normalizes user-entered quotes, `clear-to-close` handles a low appraisal, the state
engine knows the closing path. What's missing is the *active orchestration* of the
under-contract-to-close financing and title milestones an agent rides herd on.

### F1 — Financing milestone tracker (loan process, appraisal, conditions) **[P1] · M**
1. **Problem.** Between offer-accepted and clear-to-close, the loan is the thing
   most likely to blow up a deal (rate locks, appraisal, underwriting conditions,
   "needs another doc by Friday"). We have a *checklist of documents* and a low-
   appraisal calc, but no tracked **loan-process timeline** the way an agent monitors
   it ("appraisal ordered? underwriting conditions cleared? CTC by financing date?").
2. **Why now.** Plugs the most dangerous gap in the under-contract middle, where the
   product is currently passive. Composes with R1 (reminders) and R3 (next actions).
3. **Size.** M (typed milestone model + component; arithmetic already exists for the
   appraisal piece).
4. **Deps/risks.** Best after R1. **SAFE Act** boundary — same as `lender-compare`:
   educate on the *process*, never quote a rate-as-offer or recommend a lender.
5. **Guardrails.** UPL/SAFE: process tracking + "ask your lender," never lending
   advice. FHA: n/a (process, not borrower attributes).

### F2 — Title & closing-cost orchestration depth **[P2] · M**
1. **Problem.** The state engine routes attorney-vs-escrow and the CD-check tool
   reviews the final number, but the *middle* — title commitment review (exceptions,
   liens, easements), owner's-title-insurance decision framing, and an
   estimated-closing-costs worksheet *before* the CD arrives — is thin. An agent
   walks the buyer through the title commitment and pre-estimates cash-to-close.
3. **Why now.** Rounds out the late journey; reuses the A5/A6 state-aware checklist
   pattern (title-commitment-review = a clone of the disclosure checklist).
4. **Size.** M (checklist clone + a closing-cost estimator worksheet).
5. **Deps/risks.** Reuses the state-engine read pattern (A5/A6/I1). **Legal sign-off**
   on the title-review boundary (same regime as disclosure review).
6. **Guardrails.** UPL: surface *what to check / what to ask the title officer*,
   never "this exception is/ isn't a problem." FHA: n/a.

### F3 — Post-close depth beyond the move-in checklist **[P2] · S–M**
1. **Problem.** Post-close is a single move-in checklist. A good agent's post-close
   value is concrete and ongoing: **homestead/exemption filing deadlines (state-
   aware), property-tax appeal windows, escrow-analysis literacy, refinance-watch,
   warranty/recordkeeping, and the annual "is your assessment fair?" nudge.** This
   is also the cheapest retention/referral surface (the relationship doesn't end at
   closing).
2. **Why now.** Low effort, high goodwill, evergreen SEO, and it extends lifetime
   value past the one transaction — the only place the product currently "ends."
3. **Size.** S–M (mostly state-aware typed content + a couple of small worksheets).
4. **Deps/risks.** State-aware items read the state engine. Some (tax appeal) need
   sourced/dated facts per the research convention.
5. **Guardrails.** UPL: "your county's homestead deadline is typically X — confirm
   with the assessor," never legal/tax advice. FHA: tax/assessment framed neutrally,
   never as a neighborhood-desirability proxy.

---

## Theme 4 — Productionize the AI layer from prototype to trustworthy default

Two AI explainers shipped as **prototypes** (free-tier Gemini, default-off, behind
the provider seam): #36 offer-strength and #57 budget. The grounding architecture is
genuinely good (explain-our-numbers-only, allowlist + `screenText`/`screenOutput`,
never compute). But it's a prototype on a free tier with no legal sign-off for public
claims — so it can't actually help most users yet.

### AI1 — Promote explainers to a production provider + clear them for public use **[P1] · M**
1. **Problem.** The explainers are off-by-default and on a free tier; the value
   (plain-English "why is my offer weak / can I afford this") never reaches users.
   The seam is built to swap providers in one file + an env value.
2. **Why now.** The hard part (grounding, screening, seam, two working
   implementations) is done. What's left is a production provider + the **gated legal
   sign-off for public AI claims** — a decision, not a rebuild. This is the cheapest
   way to add perceived "agent intelligence."
3. **Size.** M (provider impl is small; cost/rate-limit/caching and the compliance
   review are the work).
4. **Deps/risks.** **Hard-gated on legal sign-off for public AI claims** (named in
   the task as not-done). Cost/abuse controls needed once it's default-on.
5. **Guardrails.** UPL is the whole ballgame here: the model **only narrates our
   deterministic factors**, never invents numbers or gives directives — the existing
   grounding contract enforces this; keep it. FHA: every input stays allowlisted +
   screened; no free-text reaches the model unscreened.

### AI2 — Extend grounded explainers to the next high-value surfaces **[P2] · M**
1. **Problem.** Only offer-strength and budget have explainers. The
   highest-confusion surfaces for a solo buyer — the **suggested price band (A2)
   rationale**, the **disclosure red-flags**, and the **CD/closing-cost review** —
   would each benefit from the same grounded "explain it like my agent would" layer.
2. **Why now.** Pure reuse of the proven seam; A2's rationale is the most
   directive-prone surface in the product and the most valuable to narrate carefully.
3. **Size.** M (one `source-*`/input builder per surface).
4. **Deps/risks.** Depends on AI1 (production provider + sign-off). A2 is the
   highest UPL-risk surface — its explainer must be the most conservatively grounded.
5. **Guardrails.** Same grounding contract; A2 narration says "comps + market
   *suggest a range*; you decide," never "offer $X."

---

## Theme 5 — Honest-coverage and trust upkeep (small, ongoing)

### H1 — Keep the listings/MLS honesty current; revisit a real feed decision **[P2] · S**
1. **Problem.** `/listings` is labeled a demo (J3 shipped) and we route to portals
   (A9). That's honest but it's still the weakest part of "be your agent" — buyers
   start at search and we hand them off. Either commit to a real feed or keep the
   honesty copy current as Clear Cooperation / portal policy evolves.
2. **Why now.** Evolving 2026 MLS policy means the dated honesty copy needs a refresh
   cadence; a real feed is a strategic/cost decision, not a sprint task.
3. **Size.** S to maintain; a real feed is L and out of scope without a data deal.
4. **Deps/risks.** Real feed = MLS/IDX licensing + cost (strategic). Keep the
   "as of 2026" dated framing accurate in the meantime.
5. **Guardrails.** FHA: portal-neutral, no steering, objective attributes only.
   UDAP: no implied MLS-completeness or portal affiliation.

### H2 — Recurring fact/date freshness sweep on legal & market claims **[P1] · S]**
1. **Problem.** The product now surfaces many sourced-and-dated facts (NAR/post-NAR,
   seller-credit caps, dual-agency states, escalation-restriction states, months-of-
   supply bands, commission averages). These **go stale**; an agent's value includes
   *current* local/legal knowledge.
2. **Why now.** It's cheap, it protects the trust the whole product is built on, and
   the convention (source + date node) already exists — this just operationalizes a
   recurring review so dated claims don't rot.
3. **Size.** S per sweep (process, not a build).
4. **Deps/risks.** Owned with the Researcher. Risk is *not* doing it — stale legal
   facts are an accuracy/UDAP liability.
5. **Guardrails.** Accuracy compliance: every claim keeps its source + as-of date.

---

## Top 5 for the next 10 sprints

Ranked by leverage — what most closes the remaining gap between this product and a
real end-to-end buyer's agent:

1. **R1 — Real deadline reminders (email/push).** _[P0 · M]_ Turns the static
   tracker into the proactive nag that is an agent's single highest harm-prevention
   value. Accounts/sync already exist; ship in-app/push first, email behind the gated
   vendor. **Do this first.**

2. **R2 — Document binder with real file custody.** _[P0 · L]_ We hold zero
   documents today; this is the connective tissue every other late-journey and
   collaboration feature needs, and it unblocks the monetization path. Heaviest item,
   highest structural payoff. (GLBA/consent regime applies.)

3. **R3 — Active "next-actions" dashboard.** _[P1 · M]_ Cheap composition of
   already-shipped pure functions that converts a reference site into a co-pilot and
   defends mid-journey retention. Best effort-to-value ratio in the replan.

4. **T1 — Light up the shared deal workspace.** _[P1 · L]_ The v2 PRD's
   collaboration promise is dormant infra; the expensive foundation (deals/roles/RLS/
   invites) is done, so building Wave 3 finally makes invitations meaningful and
   serves the represented-buyer persona. (Agency-capture + GLBA scoping mandatory.)

5. **AI1 — Productionize the AI explainers + clear public-claim sign-off.** _[P1 · M]_
   The grounded seam and two implementations are built; a production provider plus the
   gated legal sign-off is the cheapest large jump in perceived "agent intelligence."
   Strictly grounded, never directive.

**Honest call on the themes:** Themes 1 and 2 are where the *real* remaining
buyer's-agent gap lives — the live, reminded, document-aware deal and the two-sided
collaboration the PRD promised but left dormant. Theme 3 (financing/title
orchestration) is the thinnest *spine* gap. Theme 4 is high-value but gated on a
legal decision. Theme 5 is small but non-negotiable trust upkeep. Most of what's
left is **genuine middle-and-end-of-journey capability and the represented/agent
side — not polish.**

---

## Compliance posture (holds for every item)

- **UPL.** Everything stays educational — facts, ranges, trade-offs, process
  next-steps — never directive ("offer $X", "waive Y", "this title exception is
  fine"). Contractual/document surfaces keep "have your attorney review." The AI
  layer narrates our deterministic numbers only; it never computes or advises.
- **FHA.** Neutral, objective property/market/process data only; no protected-class
  signals, steering, or love-letters. **Every new free-text surface** (R2 doc notes,
  T3 messages, F-series fields) routes through `screenText`/`screenOutput` and stays
  off the AI allowlist unless explicitly screened.
- **GLBA / consent (represented + custody paths).** R2, T1, T3 touch buyers'
  financial data and documents — require per-deal consent + field-level scoping,
  dated and revocable, and force **agency-relationship capture** before an agent sees
  buyer data (guards accidental dual agency).
- **RESPA.** T2 (paid agent seats) and any closing/referral-tied revenue need RESPA
  review; the pro directory stays the only referral surface, fee-free.
- **SAFE Act.** F1 and lender surfaces educate on process; never quote a rate-as-
  offer or recommend a lender.
- **Accuracy.** Every legal/market claim keeps its source + as-of date (H2 keeps it
  fresh). Public AI claims (AI1/AI2) and public savings copy do not launch ahead of
  the deferred external legal sign-off.
