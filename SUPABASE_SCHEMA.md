# Supabase Backend Setup

The Functions backend now supports Supabase as a persistence target for:

- `/api/saves`
- `/api/saves/reset-legacy`
- `/api/sync/*`

This migration slice keeps the current request/auth layer intact. In other words: Firebase/dev auth still guards the API in this pass, while Supabase can own the save + sync data underneath it.

## 1. Create the tables

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor or through the Supabase CLI.

The schema creates:

- `game_saves`
- `sync_profiles`
- `sync_runs`
- `run_events`

The tables use `text` owner ids so they can store the existing app user ids directly during the migration.

## 2. Configure Functions

Add these values to `functions/.env.local`, your deployment env, or Firebase secret management as appropriate:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Prefer the explicit overrides for this migration stage:

```bash
GAME_SAVES_STORAGE=supabase
SYNC_DB_STORAGE=supabase
```

You can also use the shared switch if you know the remaining Firebase-backed stores in this repo are acceptable in your environment:

```bash
GAME_DB_STORAGE=supabase
```

## 3. Optional table overrides

If you need non-default table names, these env vars are respected:

```bash
GAME_SAVES_COLLECTION=game_saves
SYNC_RUNS_COLLECTION=sync_runs
SYNC_EVENTS_COLLECTION=run_events
SYNC_PROFILES_COLLECTION=sync_profiles
```

## Notes

- This pass does not migrate narrate-run storage, bulk-generation storage, or auth itself to Supabase.
- Because of that, `GAME_DB_STORAGE=supabase` should be treated as an advanced opt-in. The safer default is `GAME_SAVES_STORAGE=supabase` plus `SYNC_DB_STORAGE=supabase`.
- The Functions backend uses the Supabase service-role key, so direct client RLS policies are not required for this server-mediated path.
- If you later move clients to talk to Supabase directly, add RLS before exposing these tables outside the Functions boundary.
