-- Migration 0004 — multi-user foundation: deals + deal_members + RLS (issue #67).
--
-- Safe to run on an existing project (idempotent). Supabase → SQL Editor → Run.
--
-- This is ADDITIVE: it does not touch the existing `user_data` table, so the
-- single-user / guest / local-first behavior is completely unchanged. The deal
-- layer only matters for signed-in users once the app's deal context activates.
--
-- A "deal" is one shared home purchase. `deal_members` links users to a deal
-- with a role and a status. RLS lets members read their deals and only the
-- owner manage membership / delete the deal. Access checks go through two
-- SECURITY DEFINER STABLE helpers so the deal_members policies never recurse.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  label text not null default 'My home purchase',
  created_at timestamptz not null default now()
);

create table if not exists public.deal_members (
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner_buyer','co_buyer','agent','attorney','viewer')),
  status text not null default 'active' check (status in ('pending','active','revoked')),
  invited_email text,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);

-- Index every column used in membership lookups / policies.
create index if not exists deal_members_user_id_idx on public.deal_members (user_id);
create index if not exists deal_members_deal_id_idx on public.deal_members (deal_id);

-- ---------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER STABLE → bypass deal_members RLS, no
-- recursion; STABLE lets the planner cache them per statement).
-- ---------------------------------------------------------------------------

create or replace function public.is_deal_member(deal uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.deal_members m
    where m.deal_id = deal
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_deal_role(deal uuid, r text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.deal_members m
    where m.deal_id = deal
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = r
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS — deals
-- ---------------------------------------------------------------------------

alter table public.deals enable row level security;

-- A member can see deals they belong to.
drop policy if exists "deals member select" on public.deals;
create policy "deals member select" on public.deals
  for select to authenticated
  using ( (select public.is_deal_member(id)) );

-- A user creates a deal they own (the matching owner membership is inserted by
-- the client immediately after, gated by the deal_members insert policy below).
drop policy if exists "deals owner insert" on public.deals;
create policy "deals owner insert" on public.deals
  for insert to authenticated
  with check ( (select auth.uid()) = created_by );

-- Only the owner_buyer may rename a deal.
drop policy if exists "deals owner update" on public.deals;
create policy "deals owner update" on public.deals
  for update to authenticated
  using ( (select public.has_deal_role(id, 'owner_buyer')) )
  with check ( (select public.has_deal_role(id, 'owner_buyer')) );

-- Only the owner_buyer may delete a deal.
drop policy if exists "deals owner delete" on public.deals;
create policy "deals owner delete" on public.deals
  for delete to authenticated
  using ( (select public.has_deal_role(id, 'owner_buyer')) );

-- ---------------------------------------------------------------------------
-- RLS — deal_members
-- ---------------------------------------------------------------------------

alter table public.deal_members enable row level security;

-- A user can read their own membership rows, and (via the helper) all rows for
-- deals they belong to — so the owner/agent can see the roster.
drop policy if exists "deal_members select" on public.deal_members;
create policy "deal_members select" on public.deal_members
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.is_deal_member(deal_id))
  );

-- A user may insert their OWN owner membership for a deal they created. This is
-- the bootstrap path for ensureOwnDeal(); inviting other members goes through a
-- SECURITY DEFINER RPC / Edge Function in a later wave, not raw client inserts.
drop policy if exists "deal_members self owner insert" on public.deal_members;
create policy "deal_members self owner insert" on public.deal_members
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and role = 'owner_buyer'
    and exists (
      select 1 from public.deals d
      where d.id = deal_id and d.created_by = (select auth.uid())
    )
  );

-- Only the owner_buyer may change membership rows (manage the roster).
drop policy if exists "deal_members owner update" on public.deal_members;
create policy "deal_members owner update" on public.deal_members
  for update to authenticated
  using ( (select public.has_deal_role(deal_id, 'owner_buyer')) )
  with check ( (select public.has_deal_role(deal_id, 'owner_buyer')) );

-- Only the owner_buyer may remove members.
drop policy if exists "deal_members owner delete" on public.deal_members;
create policy "deal_members owner delete" on public.deal_members
  for delete to authenticated
  using ( (select public.has_deal_role(deal_id, 'owner_buyer')) );
