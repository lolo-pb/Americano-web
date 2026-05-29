# Americano Web

Americano Web is a mobile-first tennis tournament app built with `Next.js`, `Supabase`, and `Vercel` in mind. It includes:

- Public landing, signup, bracket, and player profile pages
- Player login and personal status page
- Admin dashboard for player approvals and bracket publishing
- Supabase SQL schema with auth-triggered profile creation and row-level security
- Demo mode fallback so the UI can be explored before backend env vars are connected

## Stack

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Supabase Auth + Postgres + RLS`
- `React Hook Form` + `Zod`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYMENT_EMAIL=payments@americanoopen.com
```

3. Run the app:

```bash
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Run the SQL in [supabase/migrations/20260529130000_init_americano.sql](/C:/lolo/dev/Americano-web/supabase/migrations/20260529130000_init_americano.sql).
3. Promote one profile row to admin by setting `role = 'admin'` in `public.profiles`.
4. Make sure your active tournament row is present and `is_active = true`.

## Notes

- Without Supabase env vars, the app runs in demo mode with seeded mock content.
- Signup stores user metadata in Supabase Auth and relies on the SQL trigger to create the corresponding profile and registration row.
- Bracket assignment is manual in v1: admin enters player usernames in order and publishes the bracket when ready.
