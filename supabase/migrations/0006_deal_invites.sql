-- Migration 0006 — invitations, membership management, agency/consent capture,
-- and field-level financial scoping (Wave 8, issues #74–#77). Depends on
-- 0004_deals.sql and 0005_deal_data.sql.
--
-- Safe to run on an existing project (idempotent). Supabase → SQL Editor → Run.
--
-- This is ADDITIVE and feature-gated. None of it touches `user_data`, so the
-- single-user / guest / local-first behavior is completely unchanged. It only
-- matters for signed-in users once the deal layer activates.
--
-- Contents:
--   #74 — deal_invites table + RLS, invite_to_deal() + claim_deal_invites() RPCs
--   #75 — set_deal_member_role() + revoke_deal_member() RPCs with last-owner guard
--   #76 — deal_agency table (agency relationship + dated financial consent)
--   #77 — deal_financials split table + RLS so non-consented members can't read
--         the buyer's budget / financing details (default-deny).

-- ===========================================================================
-- #74 — deal_invites
-- ===========================================================================

create table if not exists public.deal_invites (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  email text not null,
  role text not null check (role in ('co_buyer','agent','attorney','viewer')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','claimed','revoked')),
  expires_at timestamptz not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists deal_invites_deal_id_idx on public.deal_invites (deal_id);
create index if not exists deal_invites_email_idx on public.deal_invites (lower(email));
create index if not exists deal_invites_status_idx on public.deal_invites (status);

-- ---------------------------------------------------------------------------
-- RLS — owners manage invites for their deal; an invitee can see invites that
-- match their own email (so the app can surface "pending invitations" to them).
-- All writes go through SECURITY DEFINER RPCs, so there are intentionally NO
-- insert/update policies for the `authenticated` role (default-deny).
-- ---------------------------------------------------------------------------

alter table public.deal_invites enable row level security;

drop policy if exists "deal_invites owner select" on public.deal_invites;
create policy "deal_invites owner select" on public.deal_invites
  for select to authenticated
  using ( (select public.has_deal_role(deal_id, 'owner_buyer')) );

-- An invitee sees invites addressed to their (verified) email address.
drop policy if exists "deal_invites invitee select" on public.deal_invites;
create policy "deal_invites invitee select" on public.deal_invites
  for select to authenticated
  using (
    lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

-- ---------------------------------------------------------------------------
-- invite_to_deal — owner-only. Normalizes the email, validates the role,
-- generates an expiring token, inserts a pending invite. Returns the new id.
-- ---------------------------------------------------------------------------

create or replace function public.invite_to_deal(
  p_deal uuid,
  p_email text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_id uuid;
begin
  -- Owner-only.
  if not public.has_deal_role(p_deal, 'owner_buyer') then
    raise exception 'only the deal owner can invite members';
  end if;

  -- Normalize: trim + lowercase.
  v_email := lower(trim(p_email));
  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'a valid email is required';
  end if;

  -- Role must be in the allowed NON-owner set.
  if p_role not in ('co_buyer','agent','attorney','viewer') then
    raise exception 'invalid role: %', p_role;
  end if;

  insert into public.deal_invites (deal_id, email, role, token, status, expires_at, created_by)
  values (
    p_deal,
    v_email,
    p_role,
    encode(gen_random_bytes(24), 'hex'),
    'pending',
    now() + interval '14 days',
    (select auth.uid())
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- claim_deal_invites — for the caller's verified email, activate every pending,
-- non-expired invite: insert an active deal_members row (conflict = no-op so a
-- re-claim is safe) and mark the invite claimed. Returns count claimed.
-- ---------------------------------------------------------------------------

create or replace function public.claim_deal_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid uuid;
  v_count integer := 0;
  r record;
begin
  v_uid := (select auth.uid());
  v_email := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  if v_uid is null or v_email = '' then
    return 0;
  end if;

  for r in
    select id, deal_id, role
    from public.deal_invites
    where status = 'pending'
      and expires_at > now()
      and lower(email) = v_email
    for update
  loop
    insert into public.deal_members (deal_id, user_id, role, status)
    values (r.deal_id, v_uid, r.role, 'active')
    on conflict (deal_id, user_id) do nothing;

    update public.deal_invites set status = 'claimed' where id = r.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ===========================================================================
-- #75 — manage members & roles (owner-only RPCs with LAST-OWNER protection)
-- ===========================================================================

-- Set a member's role. Owner-only. Cannot downgrade the only active owner_buyer.
create or replace function public.set_deal_member_role(
  p_deal uuid,
  p_user uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count integer;
  v_target_role text;
begin
  if not public.has_deal_role(p_deal, 'owner_buyer') then
    raise exception 'only the deal owner can change roles';
  end if;

  if p_role not in ('owner_buyer','co_buyer','agent','attorney','viewer') then
    raise exception 'invalid role: %', p_role;
  end if;

  select role into v_target_role
  from public.deal_members
  where deal_id = p_deal and user_id = p_user;
  if v_target_role is null then
    raise exception 'member not found';
  end if;

  -- Last-owner protection: if the target is the only active owner_buyer and the
  -- new role is not owner_buyer, refuse.
  if v_target_role = 'owner_buyer' and p_role <> 'owner_buyer' then
    select count(*) into v_owner_count
    from public.deal_members
    where deal_id = p_deal and role = 'owner_buyer' and status = 'active';
    if v_owner_count <= 1 then
      raise exception 'cannot downgrade the only owner of a deal';
    end if;
  end if;

  update public.deal_members
  set role = p_role
  where deal_id = p_deal and user_id = p_user;
end;
$$;

-- Revoke a member (set status revoked → RLS cuts off access). Owner-only.
-- Cannot revoke the only active owner_buyer.
create or replace function public.revoke_deal_member(
  p_deal uuid,
  p_user uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count integer;
  v_target_role text;
begin
  if not public.has_deal_role(p_deal, 'owner_buyer') then
    raise exception 'only the deal owner can revoke members';
  end if;

  select role into v_target_role
  from public.deal_members
  where deal_id = p_deal and user_id = p_user;
  if v_target_role is null then
    raise exception 'member not found';
  end if;

  if v_target_role = 'owner_buyer' then
    select count(*) into v_owner_count
    from public.deal_members
    where deal_id = p_deal and role = 'owner_buyer' and status = 'active';
    if v_owner_count <= 1 then
      raise exception 'cannot revoke the only owner of a deal';
    end if;
  end if;

  update public.deal_members
  set status = 'revoked'
  where deal_id = p_deal and user_id = p_user;
end;
$$;

-- ===========================================================================
-- #76 — agency relationship + dated financial consent (per deal)
-- ===========================================================================

create table if not exists public.deal_agency (
  deal_id uuid primary key references public.deals (id) on delete cascade,
  agency_relationship text not null default 'unknown'
    check (agency_relationship in ('represents_buyer','listing_side','unrepresented','unknown')),
  financial_consent boolean not null default false,
  consent_captured_at timestamptz,
  agency_captured_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists deal_agency_touch on public.deal_agency;
create trigger deal_agency_touch
  before update on public.deal_agency
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — any member may read the agency/consent record (members need to know the
-- relationship + whether financials are shared). Only the OWNER may write it
-- (the buyer controls representation + their own consent). Default-deny writes.
-- ---------------------------------------------------------------------------

alter table public.deal_agency enable row level security;

drop policy if exists "deal_agency member select" on public.deal_agency;
create policy "deal_agency member select" on public.deal_agency
  for select to authenticated
  using ( (select public.is_deal_member(deal_id)) );

drop policy if exists "deal_agency owner insert" on public.deal_agency;
create policy "deal_agency owner insert" on public.deal_agency
  for insert to authenticated
  with check ( (select public.has_deal_role(deal_id, 'owner_buyer')) );

drop policy if exists "deal_agency owner update" on public.deal_agency;
create policy "deal_agency owner update" on public.deal_agency
  for update to authenticated
  using ( (select public.has_deal_role(deal_id, 'owner_buyer')) )
  with check ( (select public.has_deal_role(deal_id, 'owner_buyer')) );

-- ===========================================================================
-- #77 — field-level scoping for financial data (split table + RLS, default-deny)
-- ===========================================================================
--
-- The buyer's budget and offer financing details are split OUT of deal_data
-- into their own table so RLS can hide them from non-consented members at the
-- row level — the data never leaves the DB to someone who shouldn't see it.
--
-- Visibility rule (matches the canSeeFinancials() helper in the app):
--   the requesting member may read deal_financials IF
--     they are the active owner_buyer (always sees their own data), OR
--     financial_consent is true on deal_agency AND their role is editor-ish
--     (co_buyer / agent / attorney — NOT viewer).
--   Default-deny: no consent → nobody but the owner can read.

create table if not exists public.deal_financials (
  deal_id uuid primary key references public.deals (id) on delete cascade,
  budget jsonb,                 -- the buyer's budget facet
  financing jsonb,              -- offer financing details (down payment, loan, etc.)
  updated_at timestamptz not null default now()
);

drop trigger if exists deal_financials_touch on public.deal_financials;
create trigger deal_financials_touch
  before update on public.deal_financials
  for each row execute function public.touch_updated_at();

-- SECURITY DEFINER STABLE helper mirrors canSeeFinancials() — bypasses RLS on
-- deal_agency/deal_members so the policy can't recurse, and the planner caches
-- it per statement.
create or replace function public.can_see_deal_financials(deal uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    -- Owner always sees their own data.
    public.has_deal_role(deal, 'owner_buyer')
    or (
      -- Otherwise: explicit consent AND an editor-ish (non-viewer) role.
      coalesce((select a.financial_consent from public.deal_agency a where a.deal_id = deal), false)
      and exists (
        select 1 from public.deal_members m
        where m.deal_id = deal
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role in ('co_buyer','agent','attorney')
      )
    );
$$;

alter table public.deal_financials enable row level security;

-- Read is gated by the consent+role helper (default-deny).
drop policy if exists "deal_financials scoped select" on public.deal_financials;
create policy "deal_financials scoped select" on public.deal_financials
  for select to authenticated
  using ( (select public.can_see_deal_financials(deal_id)) );

-- Only the owner writes their financials (the buyer owns their budget data).
drop policy if exists "deal_financials owner insert" on public.deal_financials;
create policy "deal_financials owner insert" on public.deal_financials
  for insert to authenticated
  with check ( (select public.has_deal_role(deal_id, 'owner_buyer')) );

drop policy if exists "deal_financials owner update" on public.deal_financials;
create policy "deal_financials owner update" on public.deal_financials
  for update to authenticated
  using ( (select public.has_deal_role(deal_id, 'owner_buyer')) )
  with check ( (select public.has_deal_role(deal_id, 'owner_buyer')) );
