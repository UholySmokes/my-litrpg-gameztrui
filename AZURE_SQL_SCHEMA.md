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
```

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
