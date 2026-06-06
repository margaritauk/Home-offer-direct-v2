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

## Notes

- **Email delivery:** Supabase's built-in email works for low volume (fine for
  UAT). For production scale, add custom SMTP under **Authentication → Emails**.
- **Security:** the anon key is meant to be public; data is protected by RLS, so
  a user can only ever read or write their own row.
- **Data merge:** on first sign-in, whatever is already saved on the device
  (progress + tracker) is merged into the new account, then kept in sync.
