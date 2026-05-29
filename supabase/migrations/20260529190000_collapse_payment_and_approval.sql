do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'payment_status'
  ) then
    execute $sql$
      update public.profiles
      set approval_status = case
        when payment_status = 'confirmed' then 'approved'::public.approval_status
        when payment_status = 'rejected' then 'rejected'::public.approval_status
        else approval_status
      end
    $sql$;
  end if;
end
$$;

alter table public.profiles
drop column if exists payment_status;

drop type if exists public.payment_status;

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
    approval_status
  )
  values (
    new.id,
    new.email,
    public.generate_username(new.email, new.raw_user_meta_data, new.id),
    coalesce(player_name, split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'category', '')), ''),
    'client',
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
