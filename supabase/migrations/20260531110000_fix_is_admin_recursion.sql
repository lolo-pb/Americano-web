create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
begin
  return exists (
    select 1
    from public.teams
    where owner_user_id = auth.uid() and role = 'admin'
  );
end;
$$;
