create or replace function public.normalize_slug_part(raw_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from lower(regexp_replace(coalesce(raw_value, ''), '[^a-z0-9]+', '-', 'g')));
$$;

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

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    insert into public.teams (
      id,
      owner_user_id,
      email,
      slug,
      player_one_name,
      player_two_name,
      phone,
      avatar_url,
      category,
      bio,
      role,
      approval_status,
      created_at,
      updated_at
    )
    select
      p.id,
      p.id,
      p.email,
      coalesce(nullif(public.normalize_slug_part(p.username), ''), 'team-' || substr(replace(p.id::text, '-', ''), 1, 6)),
      coalesce(p.display_name, split_part(p.email, '@', 1)),
      '',
      p.phone,
      p.avatar_url,
      p.category,
      p.bio,
      p.role,
      p.approval_status,
      p.created_at,
      p.updated_at
    from public.profiles p
    on conflict (id) do update
      set email = excluded.email,
          phone = excluded.phone,
          avatar_url = excluded.avatar_url,
          category = excluded.category,
          bio = excluded.bio,
          role = excluded.role,
          approval_status = excluded.approval_status,
          updated_at = excluded.updated_at;
  end if;
end
$$;

alter table public.registrations
add column if not exists team_id uuid;

drop policy if exists "users read own registrations" on public.registrations;
drop policy if exists "admins manage registrations" on public.registrations;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrations'
      and column_name = 'player_id'
  ) then
    execute 'update public.registrations set team_id = player_id where team_id is null';
  end if;
end
$$;

alter table public.registrations
drop constraint if exists registrations_team_id_fkey;

alter table public.registrations
add constraint registrations_team_id_fkey
foreign key (team_id) references public.teams (id) on delete cascade;

alter table public.registrations
alter column team_id set not null;

alter table public.registrations
drop constraint if exists registrations_tournament_id_player_id_key;

alter table public.registrations
drop constraint if exists registrations_tournament_id_team_id_key;

alter table public.registrations
add constraint registrations_tournament_id_team_id_key unique (tournament_id, team_id);

alter table public.registrations
drop column if exists player_id;

alter table public.bracket_entries
add column if not exists team_id uuid;

drop policy if exists "published or admin bracket entries are readable" on public.bracket_entries;
drop policy if exists "admins manage bracket entries" on public.bracket_entries;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bracket_entries'
      and column_name = 'player_id'
  ) then
    execute 'update public.bracket_entries set team_id = player_id where team_id is null';
  end if;
end
$$;

alter table public.bracket_entries
drop constraint if exists bracket_entries_team_id_fkey;

alter table public.bracket_entries
add constraint bracket_entries_team_id_fkey
foreign key (team_id) references public.teams (id) on delete cascade;

alter table public.bracket_entries
alter column team_id set not null;

alter table public.bracket_entries
drop constraint if exists bracket_entries_bracket_id_player_id_key;

alter table public.bracket_entries
drop constraint if exists bracket_entries_bracket_id_team_id_key;

alter table public.bracket_entries
add constraint bracket_entries_bracket_id_team_id_key unique (bracket_id, team_id);

alter table public.bracket_entries
drop column if exists player_id;

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
  on conflict (id) do nothing;

  select id
  into active_tournament_id
  from public.tournaments
  where is_active = true
  order by created_at desc
  limit 1;

  if active_tournament_id is not null then
    insert into public.registrations (tournament_id, team_id)
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

alter table public.teams enable row level security;

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

drop policy if exists "users read own team" on public.teams;
create policy "users read own team"
  on public.teams
  for select
  using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "users update own team" on public.teams;
create policy "users update own team"
  on public.teams
  for update
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage teams" on public.teams;
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
