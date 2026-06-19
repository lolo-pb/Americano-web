create table if not exists public.custom_signup_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = lower(btrim(code)) and code <> ''),
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.custom_link_visits (
  id uuid primary key default gen_random_uuid(),
  custom_signup_link_id uuid not null references public.custom_signup_links (id) on delete cascade,
  visitor_token text not null check (visitor_token <> ''),
  first_visited_at timestamptz not null default timezone('utc', now()),
  unique (custom_signup_link_id, visitor_token)
);

alter table public.teams
add column if not exists custom_signup_link_id uuid references public.custom_signup_links (id) on delete set null;

alter table public.registrations
add column if not exists custom_signup_link_id uuid references public.custom_signup_links (id) on delete set null;

create index if not exists teams_custom_signup_link_id_idx
  on public.teams (custom_signup_link_id);

create index if not exists registrations_custom_signup_link_id_idx
  on public.registrations (custom_signup_link_id);

create index if not exists custom_link_visits_custom_signup_link_id_idx
  on public.custom_link_visits (custom_signup_link_id);

create or replace function public.capture_custom_signup_link_visit(p_code text, p_visitor_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  normalized_visitor_token text;
  resolved_custom_signup_link_id uuid;
begin
  normalized_code := nullif(lower(trim(coalesce(p_code, ''))), '');
  normalized_visitor_token := nullif(trim(coalesce(p_visitor_token, '')), '');

  if normalized_code is null or normalized_visitor_token is null then
    return null;
  end if;

  select id
  into resolved_custom_signup_link_id
  from public.custom_signup_links
  where code = normalized_code
    and is_active = true
  limit 1;

  if resolved_custom_signup_link_id is null then
    return null;
  end if;

  insert into public.custom_link_visits (custom_signup_link_id, visitor_token)
  values (resolved_custom_signup_link_id, normalized_visitor_token)
  on conflict (custom_signup_link_id, visitor_token) do nothing;

  return normalized_code;
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
  referral_code text;
  resolved_custom_signup_link_id uuid;
begin
  player_one := nullif(trim(coalesce(new.raw_user_meta_data ->> 'player_one_name', '')), '');
  player_two := nullif(trim(coalesce(new.raw_user_meta_data ->> 'player_two_name', '')), '');
  generated_slug := public.generate_team_slug(new.raw_user_meta_data, new.email);
  referral_code := nullif(lower(trim(coalesce(new.raw_user_meta_data ->> 'custom_signup_code', ''))), '');

  if referral_code is not null then
    select id
    into resolved_custom_signup_link_id
    from public.custom_signup_links
    where code = referral_code
      and is_active = true
    limit 1;
  end if;

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
    approval_status,
    custom_signup_link_id
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
    'pending',
    resolved_custom_signup_link_id
  )
  on conflict (id) do nothing;

  select id
  into active_tournament_id
  from public.tournaments
  where is_active = true
  order by created_at desc
  limit 1;

  if active_tournament_id is not null then
    insert into public.registrations (tournament_id, team_id, custom_signup_link_id)
    values (active_tournament_id, new.id, resolved_custom_signup_link_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

alter table public.custom_signup_links enable row level security;
alter table public.custom_link_visits enable row level security;

drop trigger if exists custom_signup_links_set_updated_at on public.custom_signup_links;
create trigger custom_signup_links_set_updated_at
  before update on public.custom_signup_links
  for each row execute procedure public.set_updated_at();

drop policy if exists "admins manage custom signup links" on public.custom_signup_links;
create policy "admins manage custom signup links"
  on public.custom_signup_links
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage custom link visits" on public.custom_link_visits;
create policy "admins manage custom link visits"
  on public.custom_link_visits
  for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.get_admin_custom_signup_link_stats()
returns table (
  id uuid,
  code text,
  label text,
  is_active boolean,
  created_at timestamptz,
  unique_access_count bigint,
  signup_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    custom_signup_links.id,
    custom_signup_links.code,
    custom_signup_links.label,
    custom_signup_links.is_active,
    custom_signup_links.created_at,
    coalesce(custom_link_visit_totals.unique_access_count, 0::bigint) as unique_access_count,
    coalesce(team_signup_totals.signup_count, 0::bigint) as signup_count
  from public.custom_signup_links
  left join (
    select
      custom_link_visits.custom_signup_link_id,
      count(*)::bigint as unique_access_count
    from public.custom_link_visits
    group by custom_link_visits.custom_signup_link_id
  ) as custom_link_visit_totals
    on custom_link_visit_totals.custom_signup_link_id = custom_signup_links.id
  left join (
    select
      teams.custom_signup_link_id,
      count(*)::bigint as signup_count
    from public.teams
    where teams.custom_signup_link_id is not null
      and teams.role = 'client'
    group by teams.custom_signup_link_id
  ) as team_signup_totals
    on team_signup_totals.custom_signup_link_id = custom_signup_links.id
  order by custom_signup_links.created_at desc;
end;
$$;

grant execute on function public.capture_custom_signup_link_visit(text, text) to anon, authenticated;
grant execute on function public.get_admin_custom_signup_link_stats() to authenticated;
