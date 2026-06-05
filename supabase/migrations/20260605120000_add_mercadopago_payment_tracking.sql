do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end
$$;

alter table public.teams
add column if not exists payment_status public.payment_status not null default 'pending',
add column if not exists mercadopago_preference_id text,
add column if not exists mercadopago_payment_id text,
add column if not exists payment_amount_ars integer,
add column if not exists payment_paid_at timestamptz;

create or replace function public.protect_team_payment_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('service_role', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
    or new.mercadopago_preference_id is distinct from old.mercadopago_preference_id
    or new.mercadopago_payment_id is distinct from old.mercadopago_payment_id
    or new.payment_amount_ars is distinct from old.payment_amount_ars
    or new.payment_paid_at is distinct from old.payment_paid_at then
    raise exception 'Only Mercado Pago webhooks or admins can modify payment fields.';
  end if;

  return new;
end;
$$;

drop trigger if exists teams_protect_payment_fields on public.teams;
create trigger teams_protect_payment_fields
  before update on public.teams
  for each row execute procedure public.protect_team_payment_fields();

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
    approval_status,
    payment_status
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
