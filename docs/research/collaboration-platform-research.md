# Research & Architecture Brief: Collaboration Platform Repositioning

_Researcher report — prepared 2026-06-07. Grounds the repositioning PRD, the multi-user ADR, and the backlog. Source of leadership direction: reposition HomeOffer Direct (same name) from an unrepresented-buyer tool into a home-buying **organization & collaboration platform** serving three audiences on equal footing — (1) unrepresented buyers, (2) represented buyers, (3) real-estate agents — with both a **shared per-deal workspace** and an **agent multi-client console**. Monetization is researched but deliberately **not committed**._

---

## 0. Where we are today (single-user grounding)

Read of the current app to set the migration baseline:

- **Data is per-user, local-first.** Task completion, selected state, tracker, offer, showings, and offer-status all live in `localStorage` (`ADR-004`, `ADR-008`, `ADR-010`). Keys are namespaced `hod:*:v1` (`src/lib/sync/local-store.ts`).
- **Cloud sync is an optional mirror, not a backend.** When `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are set (`isCloudSyncEnabled()`), the app mirrors the whole local blob into **one Supabase row per user** — `public.user_data` keyed by `auth.users.id`, protected by RLS so a user only ever reads/writes their own row (`supabase/schema.sql`, `ADR-009`/`ADR-010` cloud-sync work in Sprint 5).
- **Sync mechanics.** `readLocal()`/`writeLocal()` snapshot all stores into a single `SyncData` object (`src/lib/sync/types.ts`); `mergeSyncData()` does a last-write-wins / union merge on first sign-in (`src/lib/sync/merge.ts`); `fetchRemote()`/`pushRemote()` upsert the row (`src/lib/sync/remote.ts`); `CloudSync` orchestrates merge-on-login + debounced push (`src/components/cloud-sync.tsx`); `useAuth` is email/password only (`src/hooks/use-auth.ts`). No realtime, no service-role key, anon-key + RLS only.
- **Critical implication:** the entire data model assumes **one owner per dataset**. There is no concept of a "deal" as a shared object, no membership, no roles, no per-deal scoping. **Shared/multi-user deals are a genuinely new capability**, not an extension of the existing row. The good news: auth is already in place, the local-first/guest mode already works, and the `SyncData` shape is a clean seam to wrap into a per-deal payload.

The repositioning therefore reframes today's "my journey/tracker/offer" as **deal #1, owned by me, membership = just me** — and adds the ability to invite an agent (or co-buyer/attorney) into that deal, and for an agent to see many such deals.

---

## 1. Market & competitive landscape

### What exists today (three clusters, none unified for our three audiences)

| Cluster | Representative tools | Core object | Who it serves | Gap for us |
|---|---|---|---|---|
| **Transaction management** | Dotloop, SkySlope, Brokermint, Paperless Pipeline, DocuSign Rooms, Open To Close, Lone Wolf Deal Tracker | The **transaction/"loop"/"room"** | Agents & brokers (compliance-first); clients added as parties | Built for the *agent's* compliance & e-sign workflow; the buyer is a guest, not a first-class user. No self-serve/unrepresented path. |
| **Agent CRM** | Follow Up Boss, kvCORE, others | The **lead/contact** | Agents (lead nurture, pipeline) | Pre-transaction lead funnel; weak on collaborative deal execution; nothing for the buyer side. |
| **Client portals / collaboration** | Nekst, Trackxi, Realtor.com Collaborative Search, FuseBase, SuiteDash, The Clubhouse | Varies (client, portal, or agent-to-agent) | Mostly agent→client one-way portals | One-directional ("agent shares with client"); not a shared workspace where a *buyer can drive*; and no support for the unrepresented buyer who has no agent at all. |

Key product facts gathered:
- **Dotloop** centers a "loop" where you "add any party" (lender, title, inspector, attorney) — a real shared workspace, but agent-initiated and compliance-oriented. Teams tier adds shared visibility, branded dashboards, admin controls ([Dotloop](https://www.dotloop.com/), [Dotloop premium](https://www.dotloop.com/premium/)).
- **SkySlope** is the compliance/audit-readiness leader but is deliberately *closed* — the broker sees files, other users do not ([SkySlope vs Dotloop, KDS](https://www.kdsdevelopment.net/articles/skyslope-vs-dotloop-transaction-management-compared)).
- **DocuSign Rooms** = per-deal "room" where each party sees the docs that apply to them ([HousingWire 2026 roundup](https://www.housingwire.com/articles/real-estate-transaction-management-software/)).
- **Follow Up Boss** = visual pipeline from "initial contact to closing," per-user CRM at ~$69/user/mo ([Follow Up Boss](https://www.followupboss.com/), [pricing](https://www.followupboss.com/pricing)).
- **Lone Wolf Deal Tracker / ListedKit / Trackxi** = visual pipeline dashboards showing every deal's stage, compliance status, closing date, outstanding tasks "without opening each one" ([Lone Wolf Deal Tracker](https://www.lwolf.com/resources/announcing-deal-tracker-lone-wolf-s-new-visual-pipeline-dashboard-for-real-estate-professionals), [ListedKit pipeline](https://www.listedkit.com/features/pipeline)).
- **Realtor.com Collaborative Search** = agent invites client to a shared, personalized listing experience ([Placester roundup](https://placester.com/real-estate-marketing-academy/4-client-collaboration-apps-for-real-estate)).

### The gap (our wedge)

Every incumbent assumes **the agent is the system of record and the client is a guest**. None serves the **unrepresented buyer at all**, and none lets a **buyer own the deal and optionally invite an agent**. Our existing white space (guided, state-aware, transactional self-serve for unrepresented buyers — see `docs/research/market-research.md` §5) becomes the *foundation layer*; the repositioning adds a collaboration layer on top so the **same deal object** can be: solo-buyer (today), buyer+agent (represented), or agent-led across many clients. The differentiator is **one deal model that works whether or not an agent is present, with the buyer as a first-class owner.**

### Positioning without alienating either side

The clear guidance from positioning practice ([April Dunford on multi-segment positioning](https://aprildunford.substack.com/p/a-guide-to-positioning-with-multiple), [Product Marketing Alliance](https://www.productmarketingalliance.com/messaging-for-multi-product-companies/), [Segment8](https://blog.segment8.com/posts/messaging-persona-specific/)): **one unified core positioning, persona-specific hooks that ladder up to it — not parallel tracks.** The cautionary tale (RemotePass: a homepage speaking to two audiences at once felt vague to both) maps directly onto our risk of diluting the self-serve hero. See §6 for the concrete recommendation.

---

## 2. Multi-user architecture (the big shift) — research

This is the heart of the brief: moving from **one `user_data` row per user** to **shared "deals" with memberships and roles**, enforced by RLS, with invitations and (optional) realtime — while today's local/guest users keep working unchanged.

### 2.1 The data-model shift

The canonical Supabase multi-tenant pattern is a **membership join table + a security-definer helper function** ([makerkit RLS best practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices), [LockIn deep dive](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2), [issuecapture multi-tenant from day one](https://dev.to/issuecapture/row-level-security-in-supabase-multi-tenant-saas-from-day-one-4lon)). For us the "tenant" is a **deal**.

```
                ┌────────────────────────────┐
auth.users ───< │ deal_members               │ >─── deals
                │  (user_id, deal_id, role,   │       (id, name, created_by,
                │   status, invited_email)    │        property_ref, created_at)
                └────────────────────────────┘
                              │
            deal-scoped state rows, FK deal_id ──► deals.id
            (progress, tracker, offer, showings, offer_status,
             budget, state_code, plus future: messages, documents)
```

Target tables:

- **`deals`** — `id uuid pk`, `name text`, `created_by uuid (auth.users)`, `property_ref jsonb` (address/listing id), `archived bool`, `created_at`, `updated_at`. One row per home-buying deal.
- **`deal_members`** — `id uuid pk`, `deal_id uuid fk`, `user_id uuid fk (nullable until accept)`, `role text` (enum), `status text` (`pending`/`active`/`revoked`), `invited_email text`, `invited_by uuid`, `created_at`. Unique on `(deal_id, user_id)` and `(deal_id, invited_email)`.
- **Roles (enum):** `owner_buyer` (the buyer who created the deal — full control), `co_buyer` (spouse/partner — full edit), `agent` (licensed agent — edit + console), `attorney` (edit on legal/contract sections), `viewer` (read-only). Roles drive both RLS and UI affordances.
- **Per-deal state.** The current single `SyncData` blob becomes **deal-scoped**. Two viable shapes:
  - **(A) One `deal_data` row per deal** mirroring today's `user_data` (a `jsonb` per facet, `deal_id` PK). Smallest change — `SyncData` becomes the row payload, keyed by deal instead of user. Fast to ship, but coarse for realtime/conflict.
  - **(B) Normalized per-facet tables** (`deal_progress`, `deal_tracker`, `deal_offer`, `deal_showings`, `deal_documents`, `deal_messages`). More work, but enables fine-grained RLS (e.g. attorney sees contract docs only), per-row realtime, and per-row conflict resolution.
  - **Recommendation:** ship **(A) first** (drop-in reuse of the `SyncData` merge logic, deal-scoped) and **migrate hot/collaborative facets (messages, documents, tracker) to (B)** when realtime and granular roles demand it. This keeps Wave 1 small and de-risked.

### 2.2 Row Level Security for shared access

The performance-critical pattern (from Supabase's own guidance, [makerkit](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices), [RLS deep dive](https://dev.to/kanta13jp1/supabase-rls-deep-dive-multi-tenant-access-control-11ig)):

1. **A `SECURITY DEFINER`, `STABLE` membership helper** that bypasses RLS on `deal_members` itself (avoids recursion and lets the planner cache it):

   ```sql
   create or replace function public.is_deal_member(d uuid)
   returns boolean
   language sql security definer stable
   as $$
     select exists (
       select 1 from public.deal_members m
       where m.deal_id = d
         and m.user_id = (select auth.uid())
         and m.status = 'active'
     );
   $$;
   -- variant: has_deal_role(d uuid, roles text[]) for write/role gates
   ```

2. **Policies call the helper, wrapped in `select`** so `auth.uid()` runs once per statement (initPlan caching), and **scope `TO authenticated`** so anon never executes them:

   ```sql
   alter table public.deal_data enable row level security;

   create policy "members read" on public.deal_data
     for select to authenticated
     using ( (select public.is_deal_member(deal_id)) );

   create policy "editors write" on public.deal_data
     for update to authenticated
     using ( (select public.has_deal_role(deal_id, array['owner_buyer','co_buyer','agent','attorney'])) )
     with check ( (select public.has_deal_role(deal_id, array['owner_buyer','co_buyer','agent','attorney'])) );
   ```

3. **Index every column used in policies** — `deal_members(user_id, deal_id, status)`, `deal_data(deal_id)`. Indexing the membership lookup gives 100x+ on large tables.
4. **`deal_members` self-policy:** a user may read rows where `user_id = auth.uid()`; owners/agents may read all rows for their deals (via the helper). Writes to membership go through an **Edge Function / `SECURITY DEFINER` RPC**, never raw client inserts, so invite/accept logic and role checks are server-enforced.

Sources: [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security), [RLS performance & best practices](https://github.com/orgs/supabase/discussions/14576), [the `(select auth.uid())` performance trap](https://vibeappscanner.com/supabase-row-level-security).

### 2.3 Invitations (email invite → pending membership → accept)

Supabase has **no built-in team-invite system** — `auth.admin.inviteUserByEmail` is an admin-only "invite to the whole app," not multi-tenant, and the team explicitly leaves tenant invites to the app ([Supabase discussion #6055](https://github.com/orgs/supabase/discussions/6055), [inviteUserByEmail ref](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [Edge Function invite pattern](https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions)). Recommended flow:

1. Owner/agent calls an **`invite_member` RPC/Edge Function** with `deal_id`, `email`, `role`. Function verifies caller's role, then inserts a `deal_members` row with `status='pending'`, `invited_email`, a signed/expiring **invite token**.
2. Send an email (Supabase built-in SMTP for UAT; custom SMTP for production) with an accept link `/<…>/invite/accept?token=…`.
3. On click: if the email has no account, route through sign-up; once authenticated, an **`accept_invite` RPC** matches `invited_email` (case-insensitively — Supabase had a case-sensitivity bug, normalize emails) to `auth.uid()`, sets `user_id`, flips `status='active'`. Tokens expire (e.g. 7 days).
4. Pending invites are visible to the inviter; revoke = `status='revoked'`.

### 2.4 Realtime vs the current localStorage-first model

Today: no realtime; debounced push of a whole blob. For a shared workspace we want changes to appear for the other party. Supabase Realtime fits cleanly because **it reuses RLS** — "real-time events are broadcast to a client only if that client could read the row via a normal query" ([Realtime authorization](https://supabase.com/docs/guides/realtime/authorization), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Broadcast/Presence auth](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization)). Plan:

- **Phase 1 (coexist):** keep local-first + debounced push, but **per active deal**. On opening a deal, subscribe to Postgres Changes for that `deal_id`; on an event, re-fetch/merge that deal. Cheap, no UI rewrite, "good enough" collaboration.
- **Phase 2 (true collab):** use **private channels** (disable public access) with **Broadcast + Presence** (RLS on `realtime.messages`) for live cursors/typing/"agent is viewing," and Postgres Changes for the authoritative state. Reserve for the chat/messaging and live-document features.
- **Conflict resolution:** the existing `mergeSyncData` union/last-write-wins logic (`src/lib/sync/merge.ts`) transfers directly to per-deal merges; per-facet `updatedAt` already exists on offer/showings/offer-status. For genuinely concurrent edits to the same field (two people editing the offer), last-write-wins with a "changed by X" indicator is acceptable for v1; CRDTs are over-engineering here.

### 2.5 Coexistence / migration path (local & guest stay first-class)

Non-negotiable per leadership: today's local-only users keep working; cloud is an **optional layer**. This matches local-first norms — "syncing is optional rather than a requirement" ([Locize offline-first](https://www.locize.com/blog/offline-first-apps/), [LogRocket offline-first 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)).

- **Guest mode = an implicit local "deal #1."** All current `hod:*:v1` stores remain the local representation of the user's own deal. No account, no cloud: behaves exactly as today.
- **Sign in (existing flow):** today's `mergeSyncData` runs, but now seeds **the user's owned deal** (a `deals` row with a single `owner_buyer` membership) instead of a flat `user_data` row. The existing `user_data` table is migrated/kept as the back-compat single-deal store, or read once and folded into deal #1.
- **Feature-gating stays:** if Supabase env vars are absent, deals/sharing UI is hidden and the app is local-only (mirrors `isCloudSyncEnabled()`). Sharing, invites, agent console, and realtime are all **gated** on the cloud backend being enabled.
- **Multi-deal even when solo:** the deal model lets a single buyer track more than one property/offer — a latent feature unlock, not just collaboration.

---

## 3. Agent console (multi-client) — research

Pattern is well-established by incumbents ([Lone Wolf Deal Tracker](https://www.lwolf.com/resources/announcing-deal-tracker-lone-wolf-s-new-visual-pipeline-dashboard-for-real-estate-professionals), [ListedKit pipeline](https://www.listedkit.com/features/pipeline), [Trackxi TC features](https://trackxi.com/real-estate-transaction-coordinator-software-must-have-features/), [Dotloop brokers](https://www.dotloop.com/brokers/)): a **visual pipeline dashboard** showing every deal's stage, closing date, outstanding tasks, and what's behind schedule — "without opening each one."

We can **reuse our existing per-home dashboard concept across clients**:

- The console is a list/board of the agent's `deal_members(role='agent', status='active')` deals.
- Per deal card: client name, current journey stage (we already compute progress), nearest tracker deadline (we already compute deadline status: overdue/due-today/soon), offer status, and a "next action."
- Group/sort by stage or by soonest deadline (our `lib/deadlines.ts` status is the input). A Kanban-by-stage view maps onto our 14 canonical stages.
- Drill-in opens the **same shared deal workspace** the buyer sees (role-scoped) — no separate UI to build, just a different entry point and an aggregation layer on top of per-deal computations we already have.

This is largely **buildable now in UI terms** but **gated** on the deals/membership backend existing.

---

## 4. Compliance & guardrails (per audience)

The repositioning adds licensed agents and shared financial data, which changes the compliance surface. Our existing UPL/"not legal advice"/trust-first guardrails (PRD §7) stay; new ones layer on.

### 4.1 Agent licensing & fiduciary duties
A buyer's agent owes fiduciary duties (loyalty, confidentiality, disclosure, care, obedience, accounting); an **unrepresented** buyer is owed none unless a representation agreement is signed, and agents "cannot provide advice/counsel to an unrepresented person." **Dual agency** requires informed written consent and is **illegal in some states** (e.g. Florida prohibits disclosed/non-disclosed dual agency) ([NAR Agency](https://www.nar.realtor/agency), [CA Civ §2079.16](https://codes.findlaw.com/ca/civil-code/civ-sect-2079-16/), [NY RPP §443](https://law.justia.com/codes/new-york/rpp/article-12-a/443/), [FL §475.278](https://m.flsenate.gov/Statutes/475.278), [KMS on fiduciary](https://kmscompass.com/real-estate-agency-relationships-defined)).
**Implication:** the platform must capture the **agency relationship per deal** (represented vs unrepresented; which party the agent represents) and must **not blur it** — an agent collaborating in a buyer's workspace doesn't create representation; the buyer remains unrepresented unless they execute an agreement. Surface the relationship state explicitly on the deal.

### 4.2 Unauthorized Practice of Law (UPL)
UPL = giving legal advice/drafting documents without a license; agents may fill factual blanks in attorney-approved forms but not interpret or draft ([NAR on UPL](https://www.nar.realtor/magazine/real-estate-news/law-and-ethics/what-constitutes-the-unauthorized-practice-of-law), [NY DOS LI04](https://dos.ny.gov/legal-memorandum-li04-real-estate-brokers-and-salespersons-and-unauthorized-practice-law), [Tyler Law on unrepresented buyers post-settlement](https://www.tylerlawllp.com/blog-posts/unrepresented-buyers-in-real-estate-what-agents-need-to-know-in-a-post-settlement-world)).
**Implication:** our existing posture (guidance + official-form references, never generated legal documents — `ADR-008`) **holds and is reinforced**. The platform itself must not present agent-entered notes as legal advice.

### 4.3 Fair Housing (in a collaborative context)
Steering = influencing choices based on protected characteristics; FHA applies to platforms, algorithms, and ad/listing delivery, including steering to neighborhoods ([HUD/Cooley on steering scope](https://finsights.cooley.com/hud-clarifies-scope-of-fair-housing-acts-steering-prohibition-for-real-estate-professionals/), [NAR Steer Clear](https://www.nar.realtor/fair-housing-corner/steer-clear-of-steering), [HUD AI guidance](https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/)).
**Implication:** any **agent→buyer listing sharing, recommendations, or future algorithmic suggestions** must avoid protected-class signals and neighborhood steering. Keep recommendations criteria-based (price/beds/state) and audit any future ranking.

### 4.4 Data privacy & consent (buyer financial data shared with an agent)
GLBA governs NPI (income, SSN, assets) for settlement-service providers; consumers must be given notice and, for non-affiliated sharing, opt-out/consent ([FTC GLBA guide](https://www.ftc.gov/business-guidance/resources/how-comply-privacy-consumer-financial-information-rule-gramm-leach-bliley-act), [Reg S-P](https://www.sec.gov/rules/final/34-42974.htm)). State privacy laws increasingly apply too ([Orrick on GLBA exemptions narrowing](https://www.orrick.com/en/Insights/2025/07/Where-is-the-GLBA-Entity-Level-Exemption-Two-More-State-Privacy-Laws)).
**Implication:** sharing a buyer's budget/financials into a deal with an agent requires **explicit, per-deal, revocable consent**, a clear privacy notice, and **field-level scoping** (the buyer chooses whether budget/financials are visible to the agent vs viewer/attorney). RLS should be able to hide sensitive facets from non-financial roles. Revoking a member must cut off access immediately.

### 4.5 RESPA (only if we ever do referrals/payments)
RESPA §8 bars kickbacks/referral fees/"things of value" for referring settlement-service business; penalties up to 3x the payment ([CFPB §1024.14](https://www.consumerfinance.gov/rules-policy/regulations/1024/14/), [Forvis Mazars](https://www.forvismazars.us/forsights/2025/01/respa-section-8-key-considerations-best-practices)).
**Implication:** **monetization guardrail** — paid agent leads, pay-to-be-featured in the pro directory, or per-closing referral fees are **RESPA-sensitive** and need legal review. Neutral subscription/SaaS pricing (charging agents for software, not for referrals) is the safest model. Flag any referral-revenue idea as **gated on legal review**.

### Guardrails-by-audience summary

| Guardrail | Unrepresented buyer | Represented buyer | Agent |
|---|---|---|---|
| **Self-serve guidance / scripts** | Full (core hero) — they have no pro | Lighter; defer to their agent on advice | Agent provides advice within license |
| **"Not legal/financial advice" disclaimer** | Prominent everywhere | Present; their attorney/agent governs | Present; agent must not let tool stand in for advice |
| **UPL posture (no generated legal docs)** | Strict (no agent to backstop) | Strict | Strict (agent fills facts only, can't draft via us) |
| **Agency relationship capture** | Mark "unrepresented" on deal | Capture who agent represents; no dual-agency by accident | Must declare representation; respect state dual-agency rules |
| **Financial-data sharing** | N/A (no agent) until they invite one | Explicit per-deal consent + field scoping before agent sees budget | Sees only consented fields; access cut on revoke |
| **Fair Housing** | Applies to any listing features | Applies | Applies to agent's shared recs — no steering |
| **RESPA** | Only if referrals/payments added (legal review) | Same | Same — neutral SaaS pricing avoids it |

**Net:** some self-serve guardrails *relax* for represented users (a licensed pro is in the loop), but the **unrepresented path keeps every guardrail** — and new consent/privacy/agency guardrails are *added* for the shared context.

---

## 5. Monetization options (inform the deferred decision — do not commit)

Benchmarks: Follow Up Boss ~$69/user/mo; Dotloop ~$32/mo individual, teams ~$149+, brokerage custom; SkySlope ~$39/user/mo agent, brokerage from ~$340/mo ([Follow Up Boss pricing](https://www.followupboss.com/pricing), [Dotloop pricing](https://www.dotloop.com/products/plans-pricing/), [SkySlope/Dotloop comparison](https://www.paperlesspipeline.com/blog/skyslope-vs-dotloop-vs-paperless-pipeline)). Pricing-model tradeoffs ([per-seat vs usage](https://helloadvisr.com/foundation/per-seat-vs-usage-based-pricing-which-is-right-for-saas/), [flat vs usage vs seat](https://rethinklab.co/blog/b2b-saas-pricing-models-flat-fee-vs-usage-vs-per-seat), [softwarepricing.com on when each breaks](https://softwarepricing.com/blog/saas-pricing-models/), [Stripe freemium](https://stripe.com/resources/more/freemium-pricing-explained), [Stripe subscriptions overview](https://docs.stripe.com/billing/subscriptions/overview)).

| Option | What | Pros | Cons | Technical implication | Compliance flag |
|---|---|---|---|---|---|
| **B2B agent seats (per-seat subscription)** | Agents pay $/seat/mo; buyers free | Predictable MRR, simple to explain/invoice, matches industry norm | Over-licensing; value skewed to power users; doesn't monetize buyers | **Stripe Billing subscriptions**; map seat → agent account; gate console behind active sub | Neutral SaaS (RESPA-safe) |
| **Per-deal / per-transaction fee** | Charge per deal opened or per closing | Aligns price with value; grows ~2x faster than pure seat models | Revenue unpredictable; "fee per closing" edges toward RESPA if tied to settlement services | **Stripe usage-based / one-time** per deal; metering | **RESPA-sensitive if tied to closing/referrals → legal review** |
| **Freemium buyers + paid agent tier** | Buyers free (self-serve hero intact), agents pay | Preserves the no-friction buyer promise; classic B2B2C; large top of funnel | Needs large base + strong upgrade path; free tier carries cost | **Stripe subscriptions** for agent tier; entitlement flags per account; free buyers need no payment infra | Neutral; keep buyer data private by default |
| **Team / brokerage plans** | Volume/seat bundles, admin, branded dashboards | Higher ACV; expansion revenue; matches Dotloop/SkySlope enterprise tiers | Longer sales cycle; admin/roles complexity | Org layer above deals; **Stripe per-seat with quantity**; admin RBAC | Neutral SaaS |
| **Hybrid (base seat + usage)** | Agent base sub + per-active-deal usage | Highest median growth in benchmarks; aligns cost to activity | Most complex to build/bill/explain | **Stripe Billing + metered usage**; the heaviest integration | Same flags as per-deal |

**Researcher's read (not a decision):** **Freemium buyers + paid agent seats** best protects the self-serve hero and is the cleanest RESPA-wise (charging agents for software, not referrals), with **team/brokerage** as the natural expansion tier. Anything tied to closings/referrals is the risky path and must clear legal review. Technically, **Stripe Billing subscriptions + per-account entitlement flags** covers seats/freemium/team; only per-deal/hybrid needs metered usage. **All monetization stories are gated on the payment decision.**

---

## 6. Proposed positioning (equal footing, hero intact)

**One core positioning, persona hooks that ladder up** (per §1 best practice):

> **Core:** *HomeOffer Direct is the home-buying workspace that keeps your whole deal — offer, deadlines, documents, and the people helping you — organized in one place, whether you're buying on your own, with an agent, or managing many buyers as one.*

- **Unrepresented buyer hook (the existing hero — unchanged):** "Buy confidently without a buyer's agent and capture the commission savings." The self-serve guided journey remains the landing hero; collaboration is presented as *optional* ("invite your attorney, co-buyer — or an agent if you choose one").
- **Represented buyer hook:** "Stay on top of your purchase and collaborate with your agent in one shared space."
- **Agent hook:** "Run every client's transaction from one console — your buyers do the legwork in a shared workspace, you see every deal's status at a glance."

Mechanism to avoid the RemotePass trap: keep the **default/anonymous landing = the buyer self-serve hero**, and route agents via a distinct "For agents" entry rather than splitting the main hero. Equal footing is delivered through **role selection at sign-up + dedicated agent surfaces**, not by diluting the homepage.

---

## 7. Target architecture (ADR sketch for the multi-user ADR)

**Title:** ADR-012 — Multi-user deals: shared deal model, memberships & roles, RLS, invites, realtime (coexisting with local/guest mode).

**Decision (sketch):**
- Introduce **`deals`** + **`deal_members`** (with role + status) as the new core objects; reframe today's per-user `SyncData` as **deal-scoped** state (`deal_data` row per deal first; normalize hot facets later).
- Enforce access with **RLS via a `SECURITY DEFINER STABLE` membership helper** (`is_deal_member` / `has_deal_role`), policies wrapped in `select`, scoped `TO authenticated`, with indexes on all membership/scoping columns.
- **Invitations** via `SECURITY DEFINER` RPCs / Edge Functions (`invite_member`, `accept_invite`) writing `pending`→`active` memberships with expiring tokens and normalized emails; no raw client membership writes.
- **Realtime** in two phases: per-deal Postgres Changes re-fetch first (reuses RLS), then private channels + Broadcast/Presence for live collaboration on chat/docs.
- **Coexistence:** local/guest mode is unchanged (implicit local deal #1); cloud deals, sharing, invites, console, and realtime are all **feature-gated** on Supabase being configured (extends `isCloudSyncEnabled()`); existing `mergeSyncData` reused for per-deal merge.
- **Field-level scoping** for financial data so RLS/role can hide budget from non-financial members; revocation cuts access immediately.

**Architecture sketch — data model + RLS + invite/realtime flow** is in §2 (diagram, SQL, flow steps).

**Consequences:** larger backend surface (tables, RPCs, Edge Functions, realtime) and new compliance obligations (consent, agency capture, Fair Housing on shared recs); but auth, local-first, and the `SyncData` merge seam are reused, and the self-serve product is preserved as deal #1.

---

## 8. Backlog: epics, waves, and stories

Sequencing per leadership: **multi-user foundation first** (auth exists; deals/roles/invites next) → **shared-workspace features** → **agent console**, with positioning/compliance threaded throughout. Tags: **[now]** buildable now · **[gated:cloud]** needs the deals/cloud backend enabled · **[gated:legal]** needs legal review · **[gated:pay]** needs the monetization decision.

### EPIC A — Repositioning & positioning (Wave 0, parallel)
- **A1. Equal-footing positioning & messaging system [now]**
  - AC: one core positioning statement + three persona hooks documented; homepage keeps the unrepresented-buyer self-serve hero as default.
  - AC: a distinct "For agents" entry point exists without splitting the main hero.
  - AC: no persona's copy contradicts the others (single source of truth).
- **A2. Role selection at onboarding [now] / [gated:cloud for persistence]**
  - AC: new users pick a role (buyer / represented buyer / agent); choice tailors first-run UI.
  - AC: guest/local users can still proceed with no role and no account.
  - AC: role persists to the account when cloud is enabled.
- **A3. Repositioning PRD + guardrails-by-audience doc [now]**
  - AC: PRD reflects three equal audiences and both collaboration surfaces.
  - AC: per-audience guardrail table (this brief §4) is incorporated.

### EPIC B — Multi-user foundation: deals, memberships, roles, RLS (Wave 1)
- **B1. `deals` + `deal_members` schema & role enum [gated:cloud]**
  - AC: tables + role/status enums + indexes created via migration; idempotent.
  - AC: `created_by` auto-gets an `owner_buyer` active membership on deal create.
  - AC: unique constraints prevent duplicate memberships/invites per deal.
- **B2. RLS membership helpers + policies [gated:cloud]**
  - AC: `is_deal_member` / `has_deal_role` are `SECURITY DEFINER STABLE` and bypass `deal_members` RLS safely (no recursion).
  - AC: select/insert/update/delete policies wrap helpers in `select`, scoped `TO authenticated`; verified a non-member cannot read/write a deal.
  - AC: indexes confirmed on all policy-referenced columns.
- **B3. Deal-scoped state storage (`deal_data`) + reuse `SyncData` merge [gated:cloud]**
  - AC: per-deal `deal_data` row stores the existing `SyncData` facets keyed by `deal_id`.
  - AC: `mergeSyncData` is reused for per-deal merge with no regression to single-user tests.
  - AC: reads/writes go through the deal, not the legacy `user_data` row.
- **B4. Coexistence & migration: guest deal #1 → owned cloud deal [gated:cloud]**
  - AC: with cloud disabled, app behaves exactly as today (local-only, no deals UI).
  - AC: on first sign-in, local data seeds a single owned deal without loss (merge), folding legacy `user_data` if present.
  - AC: feature flag hides all sharing/deal UI when Supabase is unconfigured.
- **B5. Deal list / switcher (incl. multi-deal for solo buyers) [gated:cloud]**
  - AC: a signed-in user sees and switches between their deals.
  - AC: a solo buyer can create a second deal (e.g. a second property).
  - AC: archived deals are hidden by default.

### EPIC C — Invitations & membership management (Wave 2)
- **C1. Invite member RPC/Edge Function (email + role) [gated:cloud]**
  - AC: only owner/agent roles can invite; inserts `pending` membership with expiring token + normalized email.
  - AC: duplicate/active-member invites are rejected gracefully.
  - AC: invite email sends with an accept link.
- **C2. Accept-invite flow (sign-up if needed) [gated:cloud]**
  - AC: clicking the link routes a new email through sign-up, then accepts.
  - AC: `accept_invite` matches invited email (case-insensitive) to `auth.uid()`, flips `active`.
  - AC: expired/used tokens are rejected with a clear message.
- **C3. Membership management UI (roles, pending, revoke) [gated:cloud]**
  - AC: deal members list shows role + status (pending/active).
  - AC: owner can change a member's role and revoke access; revoke cuts access immediately (RLS verified).
  - AC: a member can leave a deal.
- **C4. Agency relationship + consent capture [gated:cloud] / [gated:legal]**
  - AC: each deal records represented vs unrepresented and which party an agent represents.
  - AC: inviting an agent prompts explicit, revocable consent before financial data is shared; no dual-agency-by-accident.
  - AC: consent state and privacy notice are auditable per deal.

### EPIC D — Shared deal workspace (Wave 3)
- **D1. Field-level scoping of sensitive (financial/budget) data [gated:cloud] / [gated:legal]**
  - AC: buyer controls whether budget/financials are visible to agent vs viewer/attorney.
  - AC: RLS/role hides scoped fields from unauthorized members.
  - AC: revoking consent or membership removes access immediately.
- **D2. Per-deal realtime (Phase 1: Postgres Changes re-fetch) [gated:cloud]**
  - AC: opening a deal subscribes to changes for that `deal_id` only (RLS-filtered).
  - AC: a change by one member appears for another without manual refresh.
  - AC: conflict handled via existing per-facet last-write-wins + "changed by X" indicator.
- **D3. Activity feed / shared notes per deal [gated:cloud]**
  - AC: members see a chronological feed of key changes (offer updated, deadline added, doc checked).
  - AC: notes are attributable to a member.
  - AC: feed respects field-level scoping (no leaking hidden facets).
- **D4. In-deal messaging (Phase 2 realtime: private channels) [gated:cloud]**
  - AC: members message within a deal; delivery uses private channels with RLS on `realtime.messages`.
  - AC: presence shows who's currently viewing the deal.
  - AC: non-members cannot subscribe (verified).
- **D5. Shared document checklist & references (no generated legal docs) [gated:cloud] / [gated:legal]**
  - AC: members share/track document statuses per deal (reuse tracker checklist).
  - AC: platform stores references/uploads but generates no legal documents (UPL guardrail preserved).
  - AC: attorney role can be scoped to contract/legal docs only.

### EPIC E — Agent multi-client console (Wave 4)
- **E1. Console pipeline view across the agent's deals [gated:cloud]**
  - AC: agent sees all deals where they are an active member, with per-deal stage, nearest deadline, offer status.
  - AC: deals can be grouped/sorted by stage or soonest deadline (reuses `lib/deadlines.ts` status).
  - AC: drill-in opens the same shared workspace, role-scoped.
- **E2. Per-client next-action & at-risk surfacing [gated:cloud]**
  - AC: each deal card shows a computed "next action" and flags overdue/at-risk deadlines.
  - AC: console highlights deals behind schedule "without opening each one."
  - AC: counts/summary (active deals, closings this month) shown.
- **E3. Console performance & scale [gated:cloud]**
  - AC: pipeline loads efficiently for an agent with many deals (indexed membership query, no N+1).
  - AC: RLS verified — agent sees only their member deals.
  - AC: realtime updates reflect on the console list.

### EPIC F — Monetization (Wave 5, decision-gated)
- **F1. Billing foundation: Stripe + per-account entitlements [gated:pay]**
  - AC: entitlement flags gate agent/console/team features per account.
  - AC: Stripe Billing subscription scaffolding behind a feature flag (no charge until decided).
  - AC: free buyer experience requires no payment path.
- **F2. Agent seat / freemium tier [gated:pay]**
  - AC: agent tier unlocks console + sharing limits per the chosen model.
  - AC: buyers remain free (self-serve hero intact).
  - AC: upgrade/downgrade adjusts entitlements.
- **F3. Team / brokerage plan + admin [gated:pay]**
  - AC: org layer above deals with seat quantity and admin RBAC.
  - AC: per-seat billing with quantity via Stripe.
  - AC: admin can manage members/branding.
- **F4. (Investigate-only) per-deal/referral revenue — RESPA review [gated:legal] / [gated:pay]**
  - AC: documented RESPA analysis before any per-closing/referral fee is built.
  - AC: no referral-revenue feature ships without legal sign-off.

---

## 9. Source list

**Market & competitive:** [Dotloop](https://www.dotloop.com/) · [Dotloop Premium](https://www.dotloop.com/premium/) · [Dotloop brokers](https://www.dotloop.com/brokers/) · [SkySlope vs Dotloop (KDS)](https://www.kdsdevelopment.net/articles/skyslope-vs-dotloop-transaction-management-compared) · [SkySlope/Dotloop/Paperless](https://www.paperlesspipeline.com/blog/skyslope-vs-dotloop-vs-paperless-pipeline) · [HousingWire 2026 TMS roundup](https://www.housingwire.com/articles/real-estate-transaction-management-software/) · [Follow Up Boss](https://www.followupboss.com/) · [Follow Up Boss pricing](https://www.followupboss.com/pricing) · [Placester collaboration apps](https://placester.com/real-estate-marketing-academy/4-client-collaboration-apps-for-real-estate) · [The Clubhouse](https://theclubhouse.co/) · [Nekst](https://www.nekst.com/) · [Lone Wolf Deal Tracker](https://www.lwolf.com/resources/announcing-deal-tracker-lone-wolf-s-new-visual-pipeline-dashboard-for-real-estate-professionals) · [ListedKit pipeline](https://www.listedkit.com/features/pipeline) · [Trackxi](https://trackxi.com/real-estate-transaction-coordinator-software-must-have-features/)

**Positioning:** [April Dunford multi-segment](https://aprildunford.substack.com/p/a-guide-to-positioning-with-multiple) · [Product Marketing Alliance](https://www.productmarketingalliance.com/messaging-for-multi-product-companies/) · [Segment8 persona messaging](https://blog.segment8.com/posts/messaging-persona-specific/)

**Multi-user architecture:** [makerkit RLS best practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) · [LockIn multi-tenant RLS](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2) · [multi-tenant from day one](https://dev.to/issuecapture/row-level-security-in-supabase-multi-tenant-saas-from-day-one-4lon) · [RLS deep dive](https://dev.to/kanta13jp1/supabase-rls-deep-dive-multi-tenant-access-control-11ig) · [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) · [RLS performance discussion](https://github.com/orgs/supabase/discussions/14576) · [(select auth.uid()) trap](https://vibeappscanner.com/supabase-row-level-security) · [invite implementation #6055](https://github.com/orgs/supabase/discussions/6055) · [inviteUserByEmail ref](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) · [Edge Function invites](https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions) · [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization) · [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) · [Broadcast/Presence auth](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization) · [Locize offline-first](https://www.locize.com/blog/offline-first-apps/) · [LogRocket offline-first 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

**Compliance:** [NAR Agency](https://www.nar.realtor/agency) · [CA Civ §2079.16](https://codes.findlaw.com/ca/civil-code/civ-sect-2079-16/) · [NY RPP §443](https://law.justia.com/codes/new-york/rpp/article-12-a/443/) · [FL §475.278](https://m.flsenate.gov/Statutes/475.278) · [NAR UPL](https://www.nar.realtor/magazine/real-estate-news/law-and-ethics/what-constitutes-the-unauthorized-practice-of-law) · [NY DOS LI04](https://dos.ny.gov/legal-memorandum-li04-real-estate-brokers-and-salespersons-and-unauthorized-practice-law) · [Tyler Law unrepresented buyers](https://www.tylerlawllp.com/blog-posts/unrepresented-buyers-in-real-estate-what-agents-need-to-know-in-a-post-settlement-world) · [HUD steering scope (Cooley)](https://finsights.cooley.com/hud-clarifies-scope-of-fair-housing-acts-steering-prohibition-for-real-estate-professionals/) · [NAR Steer Clear](https://www.nar.realtor/fair-housing-corner/steer-clear-of-steering) · [HUD AI guidance](https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/) · [FTC GLBA guide](https://www.ftc.gov/business-guidance/resources/how-comply-privacy-consumer-financial-information-rule-gramm-leach-bliley-act) · [SEC Reg S-P](https://www.sec.gov/rules/final/34-42974.htm) · [Orrick GLBA exemptions](https://www.orrick.com/en/Insights/2025/07/Where-is-the-GLBA-Entity-Level-Exemption-Two-More-State-Privacy-Laws) · [CFPB RESPA §1024.14](https://www.consumerfinance.gov/rules-policy/regulations/1024/14/) · [Forvis Mazars RESPA §8](https://www.forvismazars.us/forsights/2025/01/respa-section-8-key-considerations-best-practices)

**Monetization:** [per-seat vs usage](https://helloadvisr.com/foundation/per-seat-vs-usage-based-pricing-which-is-right-for-saas/) · [flat vs usage vs seat](https://rethinklab.co/blog/b2b-saas-pricing-models-flat-fee-vs-usage-vs-per-seat) · [when each breaks](https://softwarepricing.com/blog/saas-pricing-models/) · [Stripe freemium](https://stripe.com/resources/more/freemium-pricing-explained) · [Stripe subscriptions overview](https://docs.stripe.com/billing/subscriptions/overview) · [Dotloop pricing](https://www.dotloop.com/products/plans-pricing/)
