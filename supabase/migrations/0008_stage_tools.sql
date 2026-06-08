-- Migration 0008 — sync the per-stage interactive tools (epic #64+).
--
-- Adds a generic `stage_tools` jsonb column to both the single-user `user_data`
-- row and the per-deal `deal_data` row. The app stores each tool's blob under a
-- toolId key, so this one column covers every current and future per-stage tool
-- with no further migrations.
--
-- Idempotent + additive. Until you run it, the tools keep working device-local;
-- afterward they sync (per-user, and per-deal when a deal is active).
-- Run in Supabase → SQL Editor (after 0002–0007).

alter table public.user_data add column if not exists stage_tools jsonb not null default '{}'::jsonb;
alter table public.deal_data add column if not exists stage_tools jsonb not null default '{}'::jsonb;
