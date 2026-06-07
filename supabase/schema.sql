-- HomeOffer Direct — Supabase schema for accounts + cloud sync
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run.
--
-- It stores each signed-in user's synced app data (journey progress, selected
-- state, and tracker dates/documents) in a single row keyed to their account,
-- protected by Row Level Security so users can only ever read/write their own.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Mirrors the shapes the app already stores in localStorage:
  progress jsonb not null default '{}'::jsonb,   -- completed task map
  state_code text,                               -- selected state (e.g. "CA")
  tracker jsonb not null default '{}'::jsonb,     -- dates, offsets, doc statuses
  offer jsonb,                                    -- offer worksheet (nullable)
  showings jsonb not null default '{}'::jsonb,    -- tracked showings by listing id
  updated_at timestamptz not null default now()
);

-- If you created the table before the offer/showings columns existed, also run
-- supabase/migrations/0002_offer_showings.sql (or the lines below) once:
alter table public.user_data add column if not exists offer jsonb;
alter table public.user_data add column if not exists showings jsonb not null default '{}'::jsonb;

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before update on public.user_data
  for each row execute function public.touch_updated_at();

-- Row Level Security: a user may only see and change their own row.
alter table public.user_data enable row level security;

drop policy if exists "own row select" on public.user_data;
create policy "own row select" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "own row insert" on public.user_data;
create policy "own row insert" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row update" on public.user_data;
create policy "own row update" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
