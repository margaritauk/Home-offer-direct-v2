# Agent Team — HomeOffer Direct

_Owner: Product · Status: v1 · Last updated: 2026-06-12_

HomeOffer Direct is built by an agentic **scrum pod**: a small team of
role-based agents that runs the product end-to-end in agile sprints, with every
change merged to `main` behind a green CI gate. This document is the canonical
**roster** — who's on the team, what each role owns, and where their work lives.

Until now the roster was implicit (discovered from document headers). This file
makes it explicit so new roles have a clear home and the pipeline is legible.

## The sprint pipeline

```
research → business → product → architecture → design → development → test → marketing → deploy
```

Each role owns a stage but the pod is collaborative: research grounds product,
product frames architecture and design, engineering builds, QA gates, and the
analysts (business + marketing) keep the work tied to outcomes and go-to-market.

## Roster

Every role authors docs under `docs/` with an attribution header so authorship
is traceable. Two header styles are in use:

- **Owner style** — `_Owner: <Role> · Status: <status> · Last updated: <date>_`
- **Prepared-by style** — `**Prepared by:** <Role>` (used by Research briefs)

| Role | Mission | Primary deliverables |
|------|---------|----------------------|
| **Researcher** | Ground every initiative in real market, user, and domain evidence. | `docs/research/*.md` |
| **Business Analyst** | Tie features to business outcomes: market sizing, model, unit economics, KPIs, and requirements traceability. | `docs/business/*.md` |
| **Product Owner** | Own the PRD, scope, and backlog priority; turn evidence into shippable requirements. | `docs/product/prd.md` |
| **Architect** | Own technical direction and trade-offs via ADRs; keep the system coherent. | `docs/architecture/adr.md` |
| **Product Designer (UX)** | Own information architecture, flows, heuristics, and accessibility. | `docs/research/ux-*.md`, `docs/research/navigation-ia-*.md` |
| **Engineer** | Build the product in `src/` to spec, behind the data/source seams. | `src/**`, tests co-located |
| **QA / Test** | Gate quality: unit/component (Vitest) + E2E (Playwright); every PR green. | `src/**/*.test.*`, `e2e/**` |
| **Marketing Analyst** | Own positioning, audience, channels, messaging, and the acquisition funnel — within the FHA/UPL guardrails. | `docs/marketing/*.md` |

## Compliance is everyone's job

Two hard guardrails bind the whole pod, the analysts especially:

- **Fair Housing (FHA)** — see [`docs/legal/fha-messaging-gate.md`](../legal/fha-messaging-gate.md).
  Marketing and product copy never target or exclude on a protected class and
  never use "love-letter"-style personal appeals.
- **Unauthorized Practice of Law (UPL)** — see [`docs/legal/upl-compliance-gate.md`](../legal/upl-compliance-gate.md).
  We provide educational guidance and official-form references, never generated
  legal documents or individualized legal advice.

The Business and Marketing Analysts treat both gates as acceptance criteria on
any claim, metric, or message they produce.

## Adding a role

1. Add a row to the **Roster** table above with the role's mission and where its
   docs live.
2. If the role changes the workflow, update the **sprint pipeline** here and the
   pod description in [`README.md`](../../README.md).
3. Create the role's first deliverable under its `docs/` home with an attribution
   header, so the role is an active member with output — not just a name.
