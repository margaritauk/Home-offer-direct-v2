-- Migration 0009 — reminders (S1-R1). See ADR-014. Depends on 0004_deals.sql.
--
-- Safe to run on an existing project (idempotent). Supabase → SQL Editor → Run.
--
-- Two ADDITIVE tables backing the reminders feature, both RLS-scoped to deal
-- membership via the existing `is_deal_member` helper (the same model as
-- 0005_deal_data.sql). With no reminders configured this is dormant: the in-app
-- banner runs purely client-side off the pure deriver, and background Web Push is
-- default-off behind PUSH_ENABLED + VAPID keys.
--
--   * push_subscriptions — a member's Web Push endpoint(s) for a deal, written by
--     the browser when the user makes the explicit value-first "enable push"
--     gesture. Background push only.
--   * reminder_state — the cron's idempotency ledger: one row per fired reminder
--     keyed on (deal_id, milestone_id, fired-at bucket) so an overlapping cron run
--     never double-fires (the dedupeKey from lib/reminders/schedule.ts).

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,        -- client public key (Web Push encryption)
  auth text not null,          -- client auth secret (Web Push encryption)
  created_at timestamptz not null default now(),
  unique (deal_id, user_id, endpoint)
);

create index if not exists push_subscriptions_deal_id_idx
  on public.push_subscriptions (deal_id);

alter table public.push_subscriptions enable row level security;

-- A member may read/insert/delete their OWN subscriptions on a deal they belong
-- to. (No one else can read another member's push endpoint.)
drop policy if exists "push_subs member select own" on public.push_subscriptions;
create policy "push_subs member select own" on public.push_subscriptions
  for select to authenticated
  using ( user_id = (select auth.uid()) and (select public.is_deal_member(deal_id)) );

drop policy if exists "push_subs member insert own" on public.push_subscriptions;
create policy "push_subs member insert own" on public.push_subscriptions
  for insert to authenticated
  with check ( user_id = (select auth.uid()) and (select public.is_deal_member(deal_id)) );

drop policy if exists "push_subs member delete own" on public.push_subscriptions;
create policy "push_subs member delete own" on public.push_subscriptions
  for delete to authenticated
  using ( user_id = (select auth.uid()) and (select public.is_deal_member(deal_id)) );

-- ---------------------------------------------------------------------------
-- reminder_state — the cron idempotency ledger.
-- ---------------------------------------------------------------------------

create table if not exists public.reminder_state (
  deal_id uuid not null references public.deals (id) on delete cascade,
  milestone_id text not null,
  -- The fire-date bucket (YYYY-MM-DD); part of the dedupeKey so a given reminder
  -- fires at most once.
  fired_at_bucket date not null,
  channel text not null default 'in_app',
  fired_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  last_seen_date date,
  primary key (deal_id, milestone_id, channel, fired_at_bucket)
);

create index if not exists reminder_state_deal_id_idx
  on public.reminder_state (deal_id);

alter table public.reminder_state enable row level security;

-- Deal members read their own deal's reminder ledger. Writes come from the cron
-- via the service role (which bypasses RLS), never from the client, so no
-- insert/update policy is granted to `authenticated`.
drop policy if exists "reminder_state member select" on public.reminder_state;
create policy "reminder_state member select" on public.reminder_state
  for select to authenticated
  using ( (select public.is_deal_member(deal_id)) );
