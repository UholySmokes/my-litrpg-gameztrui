# Azure SQL Schema

This document describes the Azure SQL schema required for cloud saves.

## Database: `sqlfree`

```sql
CREATE TABLE dbo.game_saves (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id NVARCHAR(128) NOT NULL,
  save_name NVARCHAR(200) NOT NULL DEFAULT 'Auto Save',
  game_state NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_game_saves_game_state_json CHECK (ISJSON(game_state) = 1)
);

CREATE INDEX IX_game_saves_user_id ON dbo.game_saves(user_id);
CREATE INDEX IX_game_saves_updated_at ON dbo.game_saves(updated_at DESC);

CREATE TABLE dbo.game_static_bundles (
  bundle_key NVARCHAR(100) NOT NULL PRIMARY KEY,
  payload NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_game_static_bundles_payload_json CHECK (ISJSON(payload) = 1)
);
```

## Run Storage (Seed + Events + Snapshots)

If you want deterministic replay / run history (seed + event log + snapshots),
apply `api/sql/schema.sql` which also creates:

- `dbo.game_runs`
- `dbo.game_run_events`
- `dbo.game_run_snapshots`
- `dbo.game_user_profiles` (optional)

These are used by the additional Functions routes:

- `GET|POST|PUT|DELETE /api/runs`
- `GET|POST /api/runs/{runId}/events`
- `GET|POST /api/runs/{runId}/snapshots`

## Managed Identity Access

Run the following in Azure SQL as the Entra admin to grant the user-assigned
managed identity access:

```sql
CREATE USER [<identity-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<identity-name>];
ALTER ROLE db_datawriter ADD MEMBER [<identity-name>];
```

## Function App Settings

Set these in the Function App configuration:

```
AZURE_SQL_SERVER=voids.database.windows.net
AZURE_SQL_DATABASE=sqlfree
AZURE_SQL_CLIENT_ID=<user-assigned-managed-identity-client-id>
```

## Local Development (Optional)

If you want to use SQL auth locally, set:

```
AZURE_SQL_USER=...
AZURE_SQL_PASSWORD=...
```

Otherwise, set `DEV_USER_ID` in `api/local.settings.json` for local testing and
let the Functions runtime authenticate via managed identity in Azure.

## Seeding Static Content

Static registries (races/classes/items/etc.) are stored in `dbo.game_static_bundles`.
Run the seeder to upsert the `core` bundle:

```bash
npm run seed:static
```

## Local File DB (Dev Only)

If you don't want to run Azure SQL locally, the Functions API can store saves/runs/static bundles
in a local JSON file instead.

Set these in `api/local.settings.json`:

```
GAME_DB_STORAGE=file
# Optional (defaults to api/.data/game-db.json):
GAME_DB_PATH=api/.data/game-db.json
```

Then run `npm run seed:static` so `/api/static-data` can serve the `core` bundle.
