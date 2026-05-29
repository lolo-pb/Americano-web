create extension if not exists "pgcrypto";

create type public.user_role as enum ('client', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.bracket_status as enum ('draft', 'published');

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  start_date date not null,
  signup_open boolean not null default true,
  brackets_published boolean not null default false,
  is_active boolean not null default false,
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.teams (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique,
  slug text not null unique,
  player_one_name text not null default '',
  player_two_name text not null default '',
  phone text,
  avatar_url text,
  category text,
  bio text,
  role public.user_role not null default 'client',
  approval_status public.approval_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tournament_id, team_id)
);

create table if not exists public.brackets (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name text not null,
  format text not null,
  status public.bracket_status not null default 'draft',
  setup_locked boolean not null default false,
  bracket_size integer not null default 32,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bracket_entries (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.brackets (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  position integer not null check (position >= 0),
  seed integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bracket_id, team_id),
  unique (bracket_id, position)
);

create table if not exists public.bracket_progress (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.brackets (id) on delete cascade,
  round_index integer not null check (round_index >= 0 and round_index < 6),
  slot_index integer not null check (slot_index >= 0 and slot_index < 32),
  team_id uuid references public.teams (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (bracket_id, round_index, slot_index)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams
    where owner_user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.normalize_slug_part(raw_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from lower(regexp_replace(coalesce(raw_value, ''), '[^a-z0-9]+', '-', 'g')));
$$;

create or replace function public.generate_team_slug(raw_meta jsonb, fallback_email text)
returns text
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 2;
begin
  base_slug := concat_ws(
    '-',
    public.normalize_slug_part(raw_meta ->> 'player_one_name'),
    public.normalize_slug_part(raw_meta ->> 'player_two_name')
  );

  if base_slug = '' then
    base_slug := public.normalize_slug_part(split_part(fallback_email, '@', 1));
  end if;

  if base_slug = '' then
    base_slug := 'team';
  end if;

  candidate := base_slug;

  while exists (select 1 from public.teams where slug = candidate) loop
    candidate := base_slug || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_tournament_id uuid;
  created_team_id uuid;
  player_one text;
  player_two text;
  generated_slug text;
begin
  player_one := nullif(trim(coalesce(new.raw_user_meta_data ->> 'player_one_name', '')), '');
  player_two := nullif(trim(coalesce(new.raw_user_meta_data ->> 'player_two_name', '')), '');
  generated_slug := public.generate_team_slug(new.raw_user_meta_data, new.email);

  insert into public.teams (
    id,
    owner_user_id,
    email,
    slug,
    player_one_name,
    player_two_name,
    phone,
    category,
    role,
    approval_status
  )
  values (
    new.id,
    new.id,
    new.email,
    generated_slug,
    coalesce(player_one, split_part(new.email, '@', 1)),
    coalesce(player_two, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'category', '')), ''),
    'client',
    'pending'
  )
  returning id into created_team_id;

  select id
  into active_tournament_id
  from public.tournaments
  where is_active = true
  order by created_at desc
  limit 1;

  if active_tournament_id is not null then
    insert into public.registrations (tournament_id, team_id)
    values (active_tournament_id, created_team_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

drop trigger if exists brackets_set_updated_at on public.brackets;
create trigger brackets_set_updated_at
  before update on public.brackets
  for each row execute procedure public.set_updated_at();

drop trigger if exists bracket_progress_set_updated_at on public.bracket_progress;
create trigger bracket_progress_set_updated_at
  before update on public.bracket_progress
  for each row execute procedure public.set_updated_at();

alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.registrations enable row level security;
alter table public.brackets enable row level security;
alter table public.bracket_entries enable row level security;
alter table public.bracket_progress enable row level security;

create policy "tournaments are publicly readable"
  on public.tournaments
  for select
  using (true);

create policy "admins manage tournaments"
  on public.tournaments
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "users read own team"
  on public.teams
  for select
  using (owner_user_id = auth.uid() or public.is_admin());

create policy "users update own team"
  on public.teams
  for update
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

create policy "admins manage teams"
  on public.teams
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "users read own registrations"
  on public.registrations
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.teams
      where public.teams.id = registrations.team_id
        and public.teams.owner_user_id = auth.uid()
    )
  );

create policy "admins manage registrations"
  on public.registrations
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "published or admin brackets are readable"
  on public.brackets
  for select
  using (status = 'published' or public.is_admin());

create policy "admins manage brackets"
  on public.brackets
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "published or admin bracket entries are readable"
  on public.bracket_entries
  for select
  using (
    exists (
      select 1
      from public.brackets
      where public.brackets.id = bracket_entries.bracket_id
        and (public.brackets.status = 'published' or public.is_admin())
    )
  );

create policy "admins manage bracket entries"
  on public.bracket_entries
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "published or admin bracket progress is readable"
  on public.bracket_progress
  for select
  using (
    exists (
      select 1
      from public.brackets
      where public.brackets.id = bracket_progress.bracket_id
        and (public.brackets.status = 'published' or public.is_admin())
    )
  );

create policy "admins manage bracket progress"
  on public.bracket_progress
  for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace view public.public_approved_teams
as
select
  id,
  slug,
  player_one_name,
  player_two_name,
  avatar_url,
  category,
  approval_status,
  bio
from public.teams
where approval_status = 'approved'
  and role = 'client';

grant select on public.public_approved_teams to anon, authenticated;

insert into public.tournaments (
  name,
  location,
  start_date,
  signup_open,
  brackets_published,
  is_active,
  description
)
values (
  'Americano Open 2026',
  'Buenos Aires Lawn Club',
  '2026-08-14',
  true,
  false,
  true,
  'A weekend Americano-style tennis event with curated doubles brackets, team approvals, and a mobile-first team experience.'
)
on conflict do nothing;
