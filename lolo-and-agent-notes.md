# Lolo And Agent Notes

## Project purpose

This project is a web app for managing a tennis tournament with:

- public landing and bracket pages
- player signup and login
- admin approval after payment confirmation
- manual bracket creation and publishing

The current implementation is a strong v1 foundation, with demo-mode fallback when Supabase is not connected yet.

## Stack

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `Supabase` for auth, Postgres, and row-level security
- `react-hook-form` + `zod` for client forms and validation
- `@supabase/ssr` for browser/server auth helpers

## Deployment target

- frontend target: `Vercel`
- backend target: `Supabase`

This is a good pairing for this app because:

- Next.js App Router works very naturally on Vercel
- Supabase handles auth and Postgres cleanly for an admin/client app
- RLS lets us keep privacy and admin-only actions in the database layer

## Current app structure

### App routes

Main route files live in [src/app](/C:/lolo/dev/Americano-web/src/app).

- `/` landing page
- `/sign-up` player registration
- `/login` email/password login
- `/brackets` public published brackets
- `/players/[username]` public player profile
- `/me` logged-in user profile and status page
- `/admin` admin dashboard
- `/admin/players` player approval and payment management
- `/admin/brackets` bracket creation and publishing

### Shared UI

Shared components live in [src/components](/C:/lolo/dev/Americano-web/src/components).

Important pieces:

- `app-header.tsx` shared top navigation
- `demo-mode-banner.tsx` warns when Supabase is not configured
- `status-badge.tsx` reusable status pills
- `bracket-card.tsx` public/admin bracket display
- `auth/` contains signup and login forms

### Data and backend helpers

Shared app logic lives in [src/lib](/C:/lolo/dev/Americano-web/src/lib).

Important files:

- [src/lib/data.ts](/C:/lolo/dev/Americano-web/src/lib/data.ts)
  Central data-access layer. This is the most important file to understand before changing app behavior.
- [src/lib/types.ts](/C:/lolo/dev/Americano-web/src/lib/types.ts)
  Main domain types for profiles, tournaments, and brackets.
- [src/lib/mock-data.ts](/C:/lolo/dev/Americano-web/src/lib/mock-data.ts)
  Demo-mode fallback data.
- [src/lib/env.ts](/C:/lolo/dev/Americano-web/src/lib/env.ts)
  Environment variables and Supabase availability check.
- [src/lib/supabase/server.ts](/C:/lolo/dev/Americano-web/src/lib/supabase/server.ts)
  Server-side Supabase client.
- [src/lib/supabase/browser.ts](/C:/lolo/dev/Americano-web/src/lib/supabase/browser.ts)
  Client-side Supabase client.
- [src/lib/supabase/middleware.ts](/C:/lolo/dev/Americano-web/src/lib/supabase/middleware.ts)
  Session refresh middleware helper.

### Server actions

Server actions live in [src/app/actions.ts](/C:/lolo/dev/Americano-web/src/app/actions.ts).

Current actions:

- update player profile fields
- update player approval/payment status
- save bracket definitions
- publish or unpublish brackets

## Database structure

Supabase SQL lives in [supabase/migrations/20260529130000_init_americano.sql](/C:/lolo/dev/Americano-web/supabase/migrations/20260529130000_init_americano.sql).

Core tables:

- `tournaments`
- `profiles`
- `registrations`
- `brackets`
- `bracket_entries`

Enums:

- `user_role`
- `approval_status`
- `payment_status`
- `bracket_status`

Important backend behavior:

- new auth users trigger `handle_new_user()`
- that function creates a `profiles` row automatically
- it also creates a `registrations` row for the active tournament when one exists
- public player data is exposed through the `public_player_profiles` view

## Auth and permissions

The intended user model is:

- `client`
- `admin`

Important rules:

- players can update their own profile
- players should not see other players’ private contact or payment data
- admins can manage approvals, payments, tournaments, brackets, and entries
- public visitors should only see approved player public info and published brackets

This is enforced mostly at the database level through RLS, which is the right long-term choice for this app.

## Demo mode

If these env vars are missing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

the app falls back to demo mode.

That means:

- public pages still render
- mock tournament data is used
- mock brackets are shown
- the UI is explorable before backend setup

This is useful during early frontend iteration, but we should be careful not to mistake demo-mode behavior for real auth-backed behavior.

## Design direction already established

The current UI is intentionally not default-looking.

Visual decisions already made:

- warm clay / sand background tones
- deep green as the main tournament color
- bold sporty headings
- rounded card-heavy layout
- mobile-first player pages
- more operational desktop-oriented admin pages

If we refine the design later, it would be good to preserve:

- strong contrast between player area and admin area
- mobile readability of brackets and statuses
- clear CTA hierarchy on landing and signup pages

## Things that matter when extending this project

### 1. `src/lib/data.ts` is the behavioral hub

Most route pages depend on that file. If the app starts behaving strangely around auth, brackets, or public/private visibility, check there first.

### 2. Demo mode and real mode should stay aligned

If we add fields or new flows, we should update both:

- real Supabase queries
- demo fallback data

Otherwise local exploration becomes misleading.

### 3. Admin restrictions should stay server-backed

UI hiding alone is not enough. Any important admin action should stay protected by:

- route checks
- server action checks
- database RLS

### 4. Signup depends on the database trigger

The frontend signup form does not manually insert into `profiles`. It relies on Supabase Auth user creation plus the SQL trigger.

If signup appears to work but no profile exists, the first place to debug is the migration / trigger setup.

### 5. Bracket management is intentionally simple in v1

Right now the admin enters usernames in order and saves a bracket. This is good enough for the current phase.

Likely future upgrades:

- drag-and-drop assignment
- seeding rules
- match results and progression
- richer visual bracket tree

### 6. Public profile privacy should stay tight

Right now public player pages should remain basic. We should avoid accidentally leaking:

- email
- phone
- payment state details
- admin-only notes

## Recommended next steps

1. Connect a real Supabase project with `.env.local`.
2. Run the SQL migration in Supabase.
3. Create a first admin by updating one `profiles.role` value to `admin`.
4. Test the real signup flow end to end.
5. Add stronger validation and success/error feedback around admin actions.
6. Decide whether the next feature is:
   - richer bracket UX
   - tournament settings management
   - email/notification workflow

## Notes for future agents

- Read [src/lib/data.ts](/C:/lolo/dev/Americano-web/src/lib/data.ts), [src/app/actions.ts](/C:/lolo/dev/Americano-web/src/app/actions.ts), and the Supabase migration before making structural changes.
- Prefer preserving the current visual direction instead of reverting to generic SaaS styling.
- Keep player pages mobile-first.
- Keep admin pages practical over flashy.
- Do not break demo mode unless replacing it with a better local-development flow.
