do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
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

      execute 'alter table public.profiles drop column if exists payment_status';
    end if;
  end if;
end
$$;

drop type if exists public.payment_status;
