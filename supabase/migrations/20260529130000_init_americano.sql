create extension if not exists "pgcrypto";

create type public.user_role as enum ('client', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.payment_status as enum ('pending', 'confirmed', 'rejected');
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

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text not null,
  phone text,
  avatar_url text,
  category text,
  bio text,
  role public.user_role not null default 'client',
  approval_status public.approval_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tournament_id, player_id)
);

create table if not exists public.brackets (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name text not null,
  format text not null,
  status public.bracket_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bracket_entries (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.brackets (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null check (position > 0),
  seed integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bracket_id, player_id),
  unique (bracket_id, position)
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
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.generate_username(raw_email text, raw_meta jsonb, user_id uuid)
returns text
language plpgsql
as $$
declare
  requested text;
  candidate text;
begin
  requested := nullif(trim(coalesce(raw_meta ->> 'username', '')), '');

  candidate := lower(regexp_replace(coalesce(requested, split_part(raw_email, '@', 1)), '[^a-z0-9]+', '-', 'g'));
  candidate := trim(both '-' from candidate);

  if candidate = '' then
    candidate := 'player';
  end if;

  return candidate || '-' || substr(replace(user_id::text, '-', ''), 1, 6);
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
  player_name text;
begin
  player_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  insert into public.profiles (
    id,
    email,
    username,
    display_name,
    phone,
    category,
    role,
    approval_status,
    payment_status
  )
  values (
    new.id,
    new.email,
    public.generate_username(new.email, new.raw_user_meta_data, new.id),
    coalesce(player_name, split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'category', '')), ''),
    'client',
    'pending',
    'pending'
  );

  select id
  into active_tournament_id
  from public.tournaments
  where is_active = true
  order by created_at desc
  limit 1;

  if active_tournament_id is not null then
    insert into public.registrations (tournament_id, player_id)
    values (active_tournament_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists brackets_set_updated_at on public.brackets;
create trigger brackets_set_updated_at
  before update on public.brackets
  for each row execute procedure public.set_updated_at();

alter table public.tournaments enable row level security;
alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.brackets enable row level security;
alter table public.bracket_entries enable row level security;

create policy "tournaments are publicly readable"
  on public.tournaments
  for select
  using (true);

create policy "admins manage tournaments"
  on public.tournaments
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

create policy "users update own profile"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "admins manage profiles"
  on public.profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "users read own registrations"
  on public.registrations
  for select
  using (player_id = auth.uid() or public.is_admin());

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

create or replace view public.public_player_profiles
as
select
  id,
  username,
  display_name,
  avatar_url,
  category,
  approval_status,
  bio
from public.profiles
where approval_status = 'approved';

grant select on public.public_player_profiles to anon, authenticated;

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
  'A weekend Americano-style tennis event with curated brackets, player approvals, and a mobile-first player experience.'
)
on conflict do nothing;
