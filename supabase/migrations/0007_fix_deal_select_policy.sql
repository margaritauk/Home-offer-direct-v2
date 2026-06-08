-- Migration 0007 — fix deal creation (RLS chicken-and-egg).
--
-- Symptom: signing in created no row in `deals` (ensureOwnDeal silently failed).
--
-- Cause: the `deals` SELECT policy only allowed members (`is_deal_member(id)`),
-- but at creation time the user isn't a member yet (the owner membership is a
-- separate insert that happens *after* the deal row). So:
--   1) the deal INSERT ... RETURNING couldn't read the new row → the request
--      rolled back → no deal was created; and
--   2) the membership INSERT's WITH CHECK subquery couldn't see the deal either.
--
-- Fix: also let the deal's CREATOR select it (independent of membership). This
-- breaks the cycle: the creator can read the row they just inserted, and the
-- membership WITH CHECK subquery can see the deal. Members still see deals via
-- the membership helper as before.
--
-- Idempotent. Run in Supabase → SQL Editor (after 0004/0005/0006).

drop policy if exists "deals member select" on public.deals;
create policy "deals member select" on public.deals
  for select to authenticated
  using (
    (select public.is_deal_member(id))
    or (select auth.uid()) = created_by
  );
