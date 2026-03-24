create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  save_name text not null default 'Auto Save',
  game_state jsonb not null default '{}'::jsonb,
  state_hash text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_game_saves_user_updated
  on public.game_saves (user_id, updated_at desc);

drop trigger if exists trg_game_saves_updated_at on public.game_saves;
create trigger trg_game_saves_updated_at
before update on public.game_saves
for each row execute function public.set_updated_at();

alter table public.game_saves enable row level security;

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own"
on public.game_saves for select
using (auth.uid() = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own"
on public.game_saves for insert
with check (auth.uid() = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own"
on public.game_saves for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "game_saves_delete_own" on public.game_saves;
create policy "game_saves_delete_own"
on public.game_saves for delete
using (auth.uid() = user_id);

create table if not exists public.sync_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Traveler',
  migration_version integer not null default 0,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_sync_profiles_updated_at on public.sync_profiles;
create trigger trg_sync_profiles_updated_at
before update on public.sync_profiles
for each row execute function public.set_updated_at();

alter table public.sync_profiles enable row level security;

drop policy if exists "sync_profiles_select_own" on public.sync_profiles;
create policy "sync_profiles_select_own"
on public.sync_profiles for select
using (auth.uid() = owner_id);

drop policy if exists "sync_profiles_insert_own" on public.sync_profiles;
create policy "sync_profiles_insert_own"
on public.sync_profiles for insert
with check (auth.uid() = owner_id);

drop policy if exists "sync_profiles_update_own" on public.sync_profiles;
create policy "sync_profiles_update_own"
on public.sync_profiles for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "sync_profiles_delete_own" on public.sync_profiles;
create policy "sync_profiles_delete_own"
on public.sync_profiles for delete
using (auth.uid() = owner_id);

create table if not exists public.sync_runs (
  key text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  state jsonb not null default '{}'::jsonb,
  save_slot_id uuid references public.game_saves(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (owner_id, run_id)
);

create index if not exists idx_sync_runs_owner_run
  on public.sync_runs (owner_id, run_id);

drop trigger if exists trg_sync_runs_updated_at on public.sync_runs;
create trigger trg_sync_runs_updated_at
before update on public.sync_runs
for each row execute function public.set_updated_at();

alter table public.sync_runs enable row level security;

drop policy if exists "sync_runs_select_own" on public.sync_runs;
create policy "sync_runs_select_own"
on public.sync_runs for select
using (auth.uid() = owner_id);

drop policy if exists "sync_runs_insert_own" on public.sync_runs;
create policy "sync_runs_insert_own"
on public.sync_runs for insert
with check (auth.uid() = owner_id);

drop policy if exists "sync_runs_update_own" on public.sync_runs;
create policy "sync_runs_update_own"
on public.sync_runs for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "sync_runs_delete_own" on public.sync_runs;
create policy "sync_runs_delete_own"
on public.sync_runs for delete
using (auth.uid() = owner_id);

create table if not exists public.run_events (
  key text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  commit_id text not null,
  client_seq bigint,
  accepted boolean not null default false,
  error_code text,
  message text,
  state_hash text,
  seq bigint,
  tick bigint,
  event_type text not null default 'TRIGGER',
  trigger_type text,
  commit jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (owner_id, run_id, commit_id)
);

create index if not exists idx_run_events_owner_run_seq
  on public.run_events (owner_id, run_id, client_seq asc);

alter table public.run_events enable row level security;

drop policy if exists "run_events_select_own" on public.run_events;
create policy "run_events_select_own"
on public.run_events for select
using (auth.uid() = owner_id);

drop policy if exists "run_events_insert_own" on public.run_events;
create policy "run_events_insert_own"
on public.run_events for insert
with check (auth.uid() = owner_id);

drop policy if exists "run_events_update_own" on public.run_events;
create policy "run_events_update_own"
on public.run_events for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "run_events_delete_own" on public.run_events;
create policy "run_events_delete_own"
on public.run_events for delete
using (auth.uid() = owner_id);

create table if not exists public.narrate_runs (
  key text primary key,
  thread_id text not null,
  run_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'exploration',
  status text not null default 'running',
  done boolean not null default false,
  ok boolean,
  narrative text,
  mood text,
  suggestions jsonb,
  provider text,
  fallback_used boolean,
  output_hash text,
  error_code text,
  message text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null
);

create index if not exists idx_narrate_runs_owner_key
  on public.narrate_runs (owner_id, key);

create index if not exists idx_narrate_runs_expires_at
  on public.narrate_runs (expires_at);

drop trigger if exists trg_narrate_runs_updated_at on public.narrate_runs;
create trigger trg_narrate_runs_updated_at
before update on public.narrate_runs
for each row execute function public.set_updated_at();

alter table public.narrate_runs enable row level security;

drop policy if exists "narrate_runs_select_own" on public.narrate_runs;
create policy "narrate_runs_select_own"
on public.narrate_runs for select
using (auth.uid() = owner_id);

drop policy if exists "narrate_runs_insert_own" on public.narrate_runs;
create policy "narrate_runs_insert_own"
on public.narrate_runs for insert
with check (auth.uid() = owner_id);

drop policy if exists "narrate_runs_update_own" on public.narrate_runs;
create policy "narrate_runs_update_own"
on public.narrate_runs for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "narrate_runs_delete_own" on public.narrate_runs;
create policy "narrate_runs_delete_own"
on public.narrate_runs for delete
using (auth.uid() = owner_id);
