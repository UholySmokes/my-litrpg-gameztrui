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

-- ── Bulk Generation ─────────────────────────────────────

create table if not exists public.bulk_gen_runs (
  run_id text primary key,
  owner_id text not null default '',
  status text not null default 'running',
  pause_reason text not null default '',
  credit_guard_mode text not null default 'hard-stop',
  max_tasks integer not null default 0,
  completed_tasks integer not null default 0,
  failed_tasks integer not null default 0,
  pending_tasks integer not null default 0,
  max_estimated_eur numeric not null default 0,
  estimated_spend_eur numeric not null default 0,
  credit_stop_threshold_eur numeric not null default 0,
  expires_at timestamptz not null default timezone('utc'::text, now()),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_bulk_gen_runs_status
  on public.bulk_gen_runs (status);

drop trigger if exists trg_bulk_gen_runs_updated_at on public.bulk_gen_runs;
create trigger trg_bulk_gen_runs_updated_at
  before update on public.bulk_gen_runs
  for each row
  execute function public.set_updated_at();

create table if not exists public.bulk_gen_tasks (
  task_id text primary key,
  run_id text not null,
  kind text not null default '',
  zone_id text not null default '',
  status text not null default 'pending',
  claimed_by text not null default '',
  estimate_eur numeric not null default 0,
  attempt_count integer not null default 0,
  last_error text not null default '',
  payload jsonb not null default '{}'::jsonb,
  defer_until timestamptz,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_bulk_gen_tasks_run_status
  on public.bulk_gen_tasks (run_id, status);

create index if not exists idx_bulk_gen_tasks_run_id
  on public.bulk_gen_tasks (run_id);

drop trigger if exists trg_bulk_gen_tasks_updated_at on public.bulk_gen_tasks;
create trigger trg_bulk_gen_tasks_updated_at
  before update on public.bulk_gen_tasks
  for each row
  execute function public.set_updated_at();

create table if not exists public.bulk_gen_outputs (
  output_id text primary key,
  run_id text not null,
  task_id text not null,
  output_type text not null default '',
  zone_id text not null default '',
  title text not null default '',
  body text not null default '',
  model text not null default '',
  asset_type text not null default '',
  variant_index integer not null default 0,
  quality_score numeric not null default 0,
  is_winner boolean not null default false,
  gcs_uri text not null default '',
  supabase_storage_path text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_bulk_gen_outputs_run_id
  on public.bulk_gen_outputs (run_id);

create index if not exists idx_bulk_gen_outputs_task_id
  on public.bulk_gen_outputs (task_id);

create table if not exists public.bulk_gen_styles (
  zone_id text primary key,
  visual_style_prompt text not null default '',
  negative_prompt text not null default '',
  palette jsonb not null default '[]'::jsonb,
  lighting text not null default '',
  composition_rules jsonb not null default '[]'::jsonb,
  reference_assets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_bulk_gen_styles_updated_at on public.bulk_gen_styles;
create trigger trg_bulk_gen_styles_updated_at
  before update on public.bulk_gen_styles
  for each row
  execute function public.set_updated_at();

create table if not exists public.bulk_gen_spend_events (
  event_id text primary key,
  run_id text not null default '',
  source text not null default '',
  action text not null default '',
  estimated_cost_eur numeric not null default 0,
  remaining_credit_estimate_eur numeric not null default 0,
  note text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_bulk_gen_spend_events_run_id
  on public.bulk_gen_spend_events (run_id);
