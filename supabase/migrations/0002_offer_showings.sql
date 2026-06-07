-- Migration 0002 — sync the offer worksheet and tracked showings.
-- Safe to run on an existing project (idempotent). Supabase → SQL Editor → Run.
--
-- Until you run this, the app still works: progress / state / tracker keep
-- syncing, and offer/showings sync locally per-device; they begin syncing to
-- the cloud once these columns exist.

alter table public.user_data add column if not exists offer jsonb;
alter table public.user_data add column if not exists showings jsonb not null default '{}'::jsonb;
