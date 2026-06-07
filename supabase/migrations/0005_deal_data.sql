-- Migration 0005 — per-deal app state (issue #68). Depends on 0004_deals.sql.
--
-- Safe to run on an existing project (idempotent). Supabase → SQL Editor → Run.
--
-- `deal_data` mirrors the existing `user_data` shape (the app's SyncData), but
-- keyed by `deal_id` instead of `user_id`, so every member of a deal sees the
-- same journey / tracker / offer / showings / offer-status / budget. RLS lets
-- deal members read, and editors (owner/co-buyer/agent/attorney) write.
--
-- This is ADDITIVE: `user_data` is untouched, so single-user sync is unchanged.

create table if not exists public.deal_data (
  deal_id uuid primary key references public.deals (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,   -- completed task map
  state_code text,                               -- selected state (e.g. "CA")
  tracker jsonb not null default '{}'::jsonb,     -- dates, offsets, doc statuses
  offer jsonb,                                    -- offer worksheet (nullable)
  showings jsonb not null default '{}'::jsonb,    -- tracked showings by listing id
  offer_status jsonb not null default '{}'::jsonb,-- per-home offer pipeline
  budget jsonb,                                   -- reserved for the budget facet
  updated_at timestamptz not null default now()
);

-- Reuse the shared updated_at trigger from schema.sql (created with user_data).
drop trigger if exists deal_data_touch on public.deal_data;
create trigger deal_data_touch
  before update on public.deal_data
  for each row execute function public.touch_updated_at();

-- Helpful for the RLS membership join.
create index if not exists deal_data_deal_id_idx on public.deal_data (deal_id);

-- ---------------------------------------------------------------------------
-- RLS — deal members read; editors write.
-- ---------------------------------------------------------------------------

alter table public.deal_data enable row level security;

drop policy if exists "deal_data member select" on public.deal_data;
create policy "deal_data member select" on public.deal_data
  for select to authenticated
  using ( (select public.is_deal_member(deal_id)) );

drop policy if exists "deal_data editor insert" on public.deal_data;
create policy "deal_data editor insert" on public.deal_data
  for insert to authenticated
  with check (
    (select public.has_deal_role(deal_id, 'owner_buyer'))
    or (select public.has_deal_role(deal_id, 'co_buyer'))
    or (select public.has_deal_role(deal_id, 'agent'))
    or (select public.has_deal_role(deal_id, 'attorney'))
  );

drop policy if exists "deal_data editor update" on public.deal_data;
create policy "deal_data editor update" on public.deal_data
  for update to authenticated
  using (
    (select public.has_deal_role(deal_id, 'owner_buyer'))
    or (select public.has_deal_role(deal_id, 'co_buyer'))
    or (select public.has_deal_role(deal_id, 'agent'))
    or (select public.has_deal_role(deal_id, 'attorney'))
  )
  with check (
    (select public.has_deal_role(deal_id, 'owner_buyer'))
    or (select public.has_deal_role(deal_id, 'co_buyer'))
    or (select public.has_deal_role(deal_id, 'agent'))
    or (select public.has_deal_role(deal_id, 'attorney'))
  );
