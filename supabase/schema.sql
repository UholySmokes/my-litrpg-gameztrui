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
  id uuid primary key,
  user_id text not null,
  save_name text not null default 'Auto Save',
  game_state jsonb not null default '{}'::jsonb,
  state_hash text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_game_saves_user_id
  on public.game_saves (user_id);

create index if not exists idx_game_saves_user_updated_at
  on public.game_saves (user_id, updated_at desc);

drop trigger if exists trg_game_saves_updated_at on public.game_saves;
create trigger trg_game_saves_updated_at
before update on public.game_saves
for each row
execute function public.set_updated_at();

create table if not exists public.sync_profiles (
  owner_id text primary key,
  display_name text not null default 'Traveler',
  migration_version integer not null default 0 check (migration_version >= 0),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_sync_profiles_updated_at on public.sync_profiles;
create trigger trg_sync_profiles_updated_at
before update on public.sync_profiles
for each row
execute function public.set_updated_at();

create table if not exists public.sync_runs (
  owner_id text not null,
  run_id text not null,
  state jsonb not null default '{}'::jsonb,
  save_slot_id text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (owner_id, run_id)
);

create index if not exists idx_sync_runs_owner_updated_at
  on public.sync_runs (owner_id, updated_at desc);

drop trigger if exists trg_sync_runs_updated_at on public.sync_runs;
create trigger trg_sync_runs_updated_at
before update on public.sync_runs
for each row
execute function public.set_updated_at();

create table if not exists public.run_events (
  owner_id text not null,
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
  primary key (owner_id, run_id, commit_id)
);

create index if not exists idx_run_events_owner_run_client_seq
  on public.run_events (owner_id, run_id, client_seq);

create index if not exists idx_run_events_owner_run_created_at
  on public.run_events (owner_id, run_id, created_at desc);
