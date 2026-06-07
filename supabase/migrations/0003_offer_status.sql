-- Migration 0003 — sync the per-home offer-status pipeline (issue #39).
-- Safe to run on an existing project (idempotent).
--
-- Until you run this, the app still works: offer-status syncs locally per-device
-- and begins syncing to the cloud once this column exists.

alter table public.user_data add column if not exists offer_status jsonb not null default '{}'::jsonb;
