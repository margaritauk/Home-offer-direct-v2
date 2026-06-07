# Accounts + cloud sync — setup guide

This feature lets buyers create an account (email + password) so their journey
progress, selected state, and tracker data **sync across devices**. It's built
on [Supabase](https://supabase.com) (Postgres + auth).

> **It's optional by design.** If the two environment variables below are not
> set, the app runs exactly as before — everything works locally via
> `localStorage` and the account UI is hidden. Cloud sync only turns on once the
> keys are present.

## What you need to do (about 10 minutes)

1. **Create a Supabase project** at https://supabase.com (free tier is fine).
   - Pick a region near your users and set a database password (save it).
2. **Run the schema.** In the dashboard: **SQL Editor → New query**, paste the
   contents of [`supabase/schema.sql`](../../supabase/schema.sql), and **Run**.
   This creates the `user_data` table with Row Level Security.
3. **Confirm email auth is on.** Dashboard: **Authentication → Providers →
   Email** should be enabled (it is by default). For smoother UAT you may toggle
   off "Confirm email" under **Authentication → Sign In / Providers** (re-enable
   for production).
4. **Grab your keys.** Dashboard: **Settings → API** — copy the **Project URL**
   and the **anon / publishable** key.
5. **Set the environment variables:**
   - **Locally:** create `.env.local` (see [`.env.example`](../../.env.example))
     with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **On Vercel:** Project → **Settings → Environment Variables** → add the same
     two for Production (and Preview), then redeploy.

That's it — no secret/service-role key is required (the app uses the public anon
key plus per-user Row Level Security).

## Migrations

When new synced features ship, run any new files in `supabase/migrations/` once
(SQL Editor → paste → Run). They're idempotent and safe on an existing project:

- **`0002_offer_showings.sql`** — adds `offer` and `showings` columns so the
  Offer Builder and showing tracker sync across devices. Until you run it, those
  two sync locally per-device while everything else keeps syncing to the cloud.
- **`0003_offer_status.sql`** — adds the `offer_status` column for the per-home
  offer pipeline.
- **`0004_deals.sql`** — multi-user foundation (epic #59): the `deals` and
  `deal_members` tables, the `is_deal_member` / `has_deal_role` membership
  helpers, and Row Level Security so members can read their deals while only the
  owner manages membership. Purely additive — `user_data` is untouched, so the
  single-user / guest experience is unchanged until you sign in and a deal
  becomes active.
- **`0005_deal_data.sql`** — per-deal app state (`deal_data`), mirroring the
  `user_data` shape but keyed by `deal_id`, so everyone on a deal shares the
  same journey/tracker/offer/showings/offer-status. Requires `0004` first.

> The deal layer is **feature-gated exactly like cloud sync**: with no Supabase
> keys the app is byte-for-byte the single-user, local-first app and no deal UI
> appears. Deals activate only for a signed-in user with Supabase configured.

## Notes

- **Email delivery:** Supabase's built-in email works for low volume (fine for
  UAT). For production scale, add custom SMTP under **Authentication → Emails**.
- **Security:** the anon key is meant to be public; data is protected by RLS, so
  a user can only ever read or write their own row.
- **Data merge:** on first sign-in, whatever is already saved on the device
  (progress + tracker) is merged into the new account, then kept in sync.
