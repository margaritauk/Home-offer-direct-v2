# Product Requirements Document — HomeOffer Direct

_Owner: Product · Status: v1 (MVP) · Last updated: 2026-06-06_

## 1. Vision

A guided, self-serve web platform that walks a US home buyer through the entire
purchase — from initial search to post-closing — **without a buyer's agent**, so
they can confidently handle the process themselves and capture the commission
savings (~2.5% of price) that would otherwise be lost.

> We turn the 3–6 month, jargon-heavy, agent-mediated home-buying process into a
> clear, trackable checklist with the right guidance, templates, and pro
> hand-offs at exactly the right moments.

## 2. The problem & opportunity

From market research (`docs/research/market-research.md`):

- Buying without a buyer's agent is **legal in all 50 states**, yet the process
  is opaque and intimidating, so most buyers default to an agent.
- The **2024 NAR settlement** made buyer-agent commission fully negotiable and
  raised buyer awareness — a structural opening.
- Savings are **real but NOT automatic**: ~$7.5K–$10K+ only lands if the buyer
  explicitly negotiates the unpaid buyer-side commission into a **price
  reduction or closing credit**. Otherwise the seller keeps it.
- **White space:** no incumbent offers a guided, state-aware, transactional
  self-serve workflow. Portals (Zillow/Redfin) funnel users *to* agents;
  discount brokers still insert an agent; educational sites are static.

## 3. Target users (personas)

1. **First-time Fiona** — 29, tech-comfortable, financially cautious,
   overwhelmed by jargon. Needs hand-holding, definitions, and reassurance she
   isn't missing a deadline.
2. **Savvy-saver Sam** — 38, has bought before, numerate, motivated by the
   commission savings. Wants efficiency, templates, and the negotiation playbook.
3. **Relocating Riya** — 34, buying out of state, can't easily tour. Needs
   remote-friendly steps and to understand state-specific closing rules.

## 4. Goals & success metrics (MVP)

| Goal | Metric |
|------|--------|
| Help buyers understand the full journey | Stage/step pages cover all 14 canonical stages |
| Make savings tangible | Savings calculator on landing + dedicated tool |
| Drive trackable progress | Per-step checklists persist locally; overall progress shown |
| Reduce jargon friction | Searchable glossary; inline term links |
| Surface trust-critical moments | Wire-fraud, CD 3-day rule, walkthrough flagged prominently |

Non-goals for MVP: real MLS listing integration, accounts/auth, payments,
live attorney marketplace, multi-state contract template library (we stub the
state layer with guidance, not legal documents).

## 5. Core features (MVP scope)

1. **Landing page** — value prop, how it works, savings teaser, social-proof of
   the white space, CTA into the journey.
2. **Journey overview** — visual pipeline of all 14 stages with progress.
3. **Stage & step pages** — for each step: what/why/timeline, "without an agent"
   guidance, a checklist, related glossary terms, resources.
4. **Progress tracking** — check off tasks; progress persists in `localStorage`;
   overall + per-stage completion shown. No account required.
5. **Savings calculator** — estimate commission savings and net closing cash
   given home price, down payment, and negotiated credit.
6. **Glossary** — searchable definitions, linked from steps.
7. **Trust callouts** — reusable alert component for wire-fraud, the CD 3-day
   rule, and the final walkthrough.

## 6. Key user journeys

- **Explore → commit:** Land → see savings teaser → open Journey → browse stages.
- **Work a step:** Open a step → read guidance → tick checklist items → progress
  updates → jump to next step.
- **Estimate savings:** Open calculator → enter price/down payment/credit → see
  estimated savings and cash-to-close.
- **Look up a term:** Hit an unfamiliar term in a step → click to glossary.

## 7. Guardrails

- **Not legal/financial advice** — disclaimer in footer and on sensitive steps.
- **State-aware, not state-complete** — MVP gives state-path guidance
  (attorney vs escrow) without generating legal documents.
- **Trust-first** — never bury wire-fraud / deadline warnings.

## 8. Release plan (sprints)

- **Sprint 0 — Discovery & Foundation:** research, PRD, ADRs, scaffold. ✅
- **Sprint 1 — Core journey MVP:** data model + content, landing, journey
  overview, stage/step pages, progress tracking.
- **Sprint 2 — Tools, polish & quality:** savings calculator, glossary, trust
  callouts, tests (unit + E2E), CI, deploy config, docs.

---

## v2 — Repositioning: a home-buying organization platform for everyone

_Status: strategy approved. Keep the name "HomeOffer Direct"; broaden the audience._

### The shift
From a single-user, unrepresented-buyer tool to a **collaboration platform** that
keeps the whole purchase organized — used by **unrepresented buyers, represented
buyers, and their agents**, on equal footing. The self-serve buyer stays the
homepage hero; agents enter via a dedicated "For agents" path so we don't become
vague to everyone.

### Why now (the wedge)
Every incumbent (Dotloop, SkySlope, Follow Up Boss, Nekst, Realtor.com) makes the
**agent the system-of-record and the buyer a guest**, and **none serves the
unrepresented buyer**. Our differentiator: **one deal model that works with or
without an agent, with the buyer as a first-class owner.**

### Personas (equal footing)
1. **Unrepresented buyer** — self-serve hero; keeps every guardrail.
2. **Represented buyer** — same journey, shares the deal with their agent.
3. **Agent** — collaborates on each deal and manages many from a console.

### Collaboration model (both)
- **Shared deal workspace** — a buyer and their agent (± co-buyer, attorney,
  viewer) collaborate on one deal: shared journey, tracker, offer, budget, docs,
  activity, messaging.
- **Agent multi-client console** — one agent, many deals: pipeline, per-client
  status, next actions.

### Guardrails by audience
- **Unrepresented path keeps ALL guardrails** (UPL, FHA, SAFE-Act, trust).
- Some relax for **represented** users (a licensed agent is involved).
- **New** guardrails: explicit **per-deal consent + field-level scoping** for a
  buyer's financial data (GLBA), **agency-relationship capture** (avoid
  accidental dual agency), Fair Housing on shared recommendations, and **RESPA
  review** for any referral/closing-tied revenue.

### Monetization (decision deferred)
Research recommends **freemium buyers + paid agent seats** (RESPA-safe, protects
the hero), team/brokerage as expansion. Anything tied to closings/referrals is
the risky path (RESPA). Not committed — see epic + research.

### Release plan addition
New waves layer on top of the existing journey/tools:
- **Wave 0** Repositioning · **Wave 1** Multi-user foundation (deals/roles/RLS) ·
  **Wave 2** Invitations & membership · **Wave 3** Shared deal workspace ·
  **Wave 4** Agent console · **Wave 5** Monetization.
- Plus per-stage **interactive tools** (Waves A/B/C) that serve all audiences.

_Sources: `docs/research/collaboration-platform-research.md`,
`docs/research/interactive-stages-research.md`._
