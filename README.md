# Americano Web

Americano Web is a mobile-first tennis tournament app built with `Next.js`, `Supabase`, and `Vercel` in mind. It includes:

- Public landing, signup, bracket, and team profile pages
- Team login and private status page
- Admin dashboard for team approvals and bracket publishing
- Supabase SQL schema with auth-triggered team creation and row-level security
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
NEXT_PUBLIC_PAYMENT_EMAIL=mili.lera.2006
```

3. Run the app:

```bash
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Run the SQL migrations in `supabase/migrations`, or use `npx supabase db push`.
3. Promote one team row to admin by setting `role = 'admin'` in `public.teams`.
4. Make sure your active tournament row is present and `is_active = true`.

## Notes

- Without Supabase env vars, the app runs in demo mode with seeded mock content.
- Signup stores user metadata in Supabase Auth and relies on the SQL trigger to create the corresponding team and registration row.
- Bracket assignment is manual in v1: admin assigns approved teams by position and publishes the bracket when ready.
