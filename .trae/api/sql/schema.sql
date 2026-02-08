-- ============================================================================
-- Voidverse Azure SQL Schema (Durable Saves + Run Storage)
-- Target DB: sqlfree (or equivalent)
--
-- This script is idempotent: it only creates objects that don't already exist.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Durable save slots (used by /api/saves)
-- ----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.game_saves', N'U') IS NULL
BEGIN
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
END;

-- ----------------------------------------------------------------------------
-- Run storage (seed + event log + snapshots) for deterministic replays
-- ----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.game_runs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.game_runs (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    user_id NVARCHAR(128) NOT NULL,
    run_name NVARCHAR(200) NOT NULL DEFAULT 'Run',
    seed BIGINT NULL,
    status NVARCHAR(32) NOT NULL DEFAULT 'active', -- active|completed|abandoned
    meta NVARCHAR(MAX) NULL, -- JSON: client/app versions, tags, etc.
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_game_runs_meta_json CHECK (meta IS NULL OR ISJSON(meta) = 1)
  );

  CREATE INDEX IX_game_runs_user_id ON dbo.game_runs(user_id);
  CREATE INDEX IX_game_runs_updated_at ON dbo.game_runs(updated_at DESC);
END;

IF OBJECT_ID(N'dbo.game_run_events', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.game_run_events (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    run_id UNIQUEIDENTIFIER NOT NULL,
    seq BIGINT NOT NULL,                -- per-run monotonic sequence
    tick INT NULL,                      -- sim tick/turn index
    event_type NVARCHAR(128) NOT NULL,  -- e.g. 'COMBAT_HIT', 'QUEST_COMPLETE'
    payload NVARCHAR(MAX) NOT NULL,     -- JSON payload
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_game_run_events_run_id FOREIGN KEY (run_id)
      REFERENCES dbo.game_runs(id) ON DELETE CASCADE,
    CONSTRAINT UQ_game_run_events_run_seq UNIQUE (run_id, seq),
    CONSTRAINT CK_game_run_events_payload_json CHECK (ISJSON(payload) = 1)
  );

  CREATE INDEX IX_game_run_events_run_id ON dbo.game_run_events(run_id, seq);
  CREATE INDEX IX_game_run_events_event_type ON dbo.game_run_events(event_type);
END;

IF OBJECT_ID(N'dbo.game_run_snapshots', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.game_run_snapshots (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    run_id UNIQUEIDENTIFIER NOT NULL,
    tick INT NOT NULL,                  -- snapshot tick/turn index
    game_state NVARCHAR(MAX) NOT NULL,  -- JSON snapshot
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_game_run_snapshots_run_id FOREIGN KEY (run_id)
      REFERENCES dbo.game_runs(id) ON DELETE CASCADE,
    CONSTRAINT UQ_game_run_snapshots_run_tick UNIQUE (run_id, tick),
    CONSTRAINT CK_game_run_snapshots_state_json CHECK (ISJSON(game_state) = 1)
  );

  CREATE INDEX IX_game_run_snapshots_run_id ON dbo.game_run_snapshots(run_id, tick DESC);
END;

-- ----------------------------------------------------------------------------
-- Minimal user profile record (optional; helps attach display names/settings)
-- ----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.game_user_profiles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.game_user_profiles (
    user_id NVARCHAR(128) NOT NULL PRIMARY KEY,
    display_name NVARCHAR(200) NULL,
    settings NVARCHAR(MAX) NULL, -- JSON
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_game_user_profiles_settings_json CHECK (settings IS NULL OR ISJSON(settings) = 1)
  );
END;

-- ----------------------------------------------------------------------------
-- Static content bundles (registries exported to DB for runtime consumption)
-- ----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.game_static_bundles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.game_static_bundles (
    bundle_key NVARCHAR(100) NOT NULL PRIMARY KEY,
    payload NVARCHAR(MAX) NOT NULL, -- JSON
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_game_static_bundles_payload_json CHECK (ISJSON(payload) = 1)
  );
END;
