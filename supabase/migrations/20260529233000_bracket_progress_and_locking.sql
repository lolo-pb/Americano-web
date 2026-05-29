alter table public.brackets
add column if not exists setup_locked boolean not null default false;

alter table public.brackets
add column if not exists bracket_size integer not null default 32;

alter table public.bracket_entries
drop constraint if exists bracket_entries_position_check;

alter table public.bracket_entries
add constraint bracket_entries_position_check check (position >= 0);

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

alter table public.bracket_progress enable row level security;

drop trigger if exists bracket_progress_set_updated_at on public.bracket_progress;
create trigger bracket_progress_set_updated_at
  before update on public.bracket_progress
  for each row execute procedure public.set_updated_at();

drop policy if exists "published or admin bracket progress is readable" on public.bracket_progress;
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

drop policy if exists "admins manage bracket progress" on public.bracket_progress;
create policy "admins manage bracket progress"
  on public.bracket_progress
  for all
  using (public.is_admin())
  with check (public.is_admin());
