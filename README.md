# HomeOffer Direct 🏡

A guided, self-serve web platform that walks US home buyers through the **entire
process of buying a house without a buyer's agent** — from search to closing and
beyond — so they can confidently handle it themselves and capture the commission
savings (~2.5% of price) that would otherwise be lost.

> Built by an agentic "scrum pod" (research → product → architecture →
> development → test → deploy) in agile sprints.

## Why this exists

Buying agent-free is legal in all 50 states, and since the 2024 NAR settlement
the buyer-side commission is fully negotiable. But the savings are **not
automatic** — you only capture them if you negotiate the unpaid commission into a
price reduction or closing credit. No incumbent offers a guided, state-aware,
transactional workflow for the unrepresented buyer. That's the gap this fills.

See [`docs/research/market-research.md`](docs/research/market-research.md) for the
full market analysis, [`docs/product/prd.md`](docs/product/prd.md) for the product
spec, and [`docs/architecture/adr.md`](docs/architecture/adr.md) for architecture
decisions.

## Features

- **The Journey** — 14-stage, plain-English roadmap with per-step guidance and
  "doing this without an agent" coaching.
- **Progress tracking** — tick off checklist tasks; progress persists in
  `localStorage`. No account required.
- **Savings calculator** — quantify the commission you could capture and your
  cash-to-close.
- **Glossary** — searchable, plain-English definitions of home-buying jargon.
- **Trust callouts** — wire-fraud, the Closing Disclosure 3-day rule, and the
  final walkthrough surfaced loudly.
- **Per-state legal engine** — pick your state to see its closing path (attorney
  vs escrow), required seller disclosures, and transfer-tax customs for all 50
  states + DC. State-aware guidance is injected into the relevant journey steps.
  Guidance and official-form references only — never generated legal documents.
- **Professional directory + handoffs** — find real estate attorneys, inspectors,
  and title/escrow companies (real official finder services + clearly-labeled
  samples), surfaced contextually in the journey.
- **Deadline & document tracker** — turn your contract dates into a countdown of
  every deadline that matters (incl. the Closing Disclosure 3-business-day rule)
  plus a phase-grouped document checklist.
- **Accounts + cloud sync (optional)** — sign in to sync progress, state, and
  tracker across devices. Off by default; see
  [`docs/setup/cloud-sync.md`](docs/setup/cloud-sync.md) to enable via Supabase.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + Testing Library (unit/component)
- [Playwright](https://playwright.dev/) (E2E)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint |
| `npm test` | Unit/component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Project structure

```
src/
  app/                     Routes (App Router)
    page.tsx               Landing
    journey/               Overview + [stage] + [stage]/[step]
    states/                State guide + [code] (50 states + DC)
    tools/savings-calculator/
    glossary/
  components/              UI + client components
  hooks/
    use-progress.ts        localStorage progress tracking
    use-state-selection.ts localStorage state selection
  lib/
    journey/               Domain types + 14-stage content + selectors
    states/                StateProfile type + 51-jurisdiction data + selectors
    glossary.ts            Glossary terms + helpers
    savings.ts             Savings math (pure, fully unit-tested)
docs/                      Research, PRD, ADRs
e2e/                       Playwright specs
```

## Deployment

Configured for [Vercel](https://vercel.com/) (`vercel.json`). Push the branch and
import the repo, or run `vercel`. CI (`.github/workflows/ci.yml`) runs typecheck,
lint, unit tests, build, and E2E on every push.

## Disclaimer

Educational guidance only — not legal or financial advice. Home-buying rules vary
by state; consult a licensed real estate attorney for your situation.
