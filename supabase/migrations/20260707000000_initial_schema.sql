create table if not exists public.user_app_data (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_app_data enable row level security;

drop policy if exists "users can read own app data" on public.user_app_data;
drop policy if exists "users can insert own app data" on public.user_app_data;
drop policy if exists "users can update own app data" on public.user_app_data;
drop policy if exists "users can delete own app data" on public.user_app_data;

create policy "users can read own app data"
on public.user_app_data
for select
to authenticated
using (auth.uid()::text = user_id);

create policy "users can insert own app data"
on public.user_app_data
for insert
to authenticated
with check (auth.uid()::text = user_id);

create policy "users can update own app data"
on public.user_app_data
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "users can delete own app data"
on public.user_app_data
for delete
to authenticated
using (auth.uid()::text = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_app_data_updated_at on public.user_app_data;

create trigger set_user_app_data_updated_at
before update on public.user_app_data
for each row
execute function public.set_updated_at();
