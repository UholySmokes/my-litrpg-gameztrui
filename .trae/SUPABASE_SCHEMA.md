# Supabase Database Schema (Legacy)

> This project now uses Azure SQL for cloud saves. See `AZURE_SQL_SCHEMA.md`.

This document describes the database schema required for the LitRPG game persistence system.

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the following SQL to create the `game_saves` table:

## Table: game_saves

```sql
-- Create the game_saves table
CREATE TABLE IF NOT EXISTS game_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_name TEXT NOT NULL DEFAULT 'Auto Save',
  game_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);

-- Create an index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_game_saves_updated_at ON game_saves(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own saves
CREATE POLICY "Users can view their own saves"
  ON game_saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own saves
CREATE POLICY "Users can insert their own saves"
  ON game_saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own saves
CREATE POLICY "Users can update their own saves"
  ON game_saves
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own saves
CREATE POLICY "Users can delete their own saves"
  ON game_saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_game_saves_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Environment Variables

After creating your Supabase project, add these to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings under "API".

---

## Item/Affix Schema (variable attributes)

Use JSONB for rolled stats and affix metadata; enforce ownership with RLS (no client-trusted writes).

```sql
CREATE TABLE IF NOT EXISTS items_base (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS affixes_prefix (
  id text PRIMARY KEY,
  text text NOT NULL,
  tags text[] DEFAULT '{}',
  weight int DEFAULT 1,
  data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS affixes_suffix (
  id text PRIMARY KEY,
  text text NOT NULL,
  tags text[] DEFAULT '{}',
  weight int DEFAULT 1,
  data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS items_instance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_id text NOT NULL REFERENCES items_base(id),
  prefix_id text REFERENCES affixes_prefix(id),
  suffix_id text REFERENCES affixes_suffix(id),
  rolled_stats jsonb DEFAULT '{}'::jsonb,
  quantity int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_items_instance_user ON items_instance(user_id);
CREATE INDEX IF NOT EXISTS idx_items_instance_base ON items_instance(base_id);

CREATE TABLE IF NOT EXISTS inventory (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES items_instance(id) ON DELETE CASCADE,
  slot text DEFAULT NULL,
  PRIMARY KEY (user_id, instance_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

ALTER TABLE items_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"item instances are owned\" ON items_instance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"inventory entries are owned\" ON inventory
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## Schema Details

### Columns

- **id** (UUID): Primary key, auto-generated
- **user_id** (UUID): Foreign key to `auth.users.id`, identifies the owner of the save
- **save_name** (TEXT): User-friendly name for the save (e.g., "Auto Save", "Before Boss Fight")
- **game_state** (JSONB): The complete game state object stored as JSON
- **created_at** (TIMESTAMP): When the save was first created
- **updated_at** (TIMESTAMP): When the save was last updated (auto-updated on changes)

### Row Level Security (RLS)

All policies ensure that users can only access their own saves. This prevents users from viewing, modifying, or deleting other users' game saves.

### Indexes

- Index on `user_id` for fast queries when loading a user's saves
- Index on `updated_at` for efficient sorting by most recent saves

## Usage

The `supabaseService.js` file provides functions to interact with this table:
- `saveGameState()` - Create a new save
- `updateGameState()` - Update an existing save
- `loadGameState()` - Load a specific save
- `listSaves()` - Get all saves for a user
- `deleteSave()` - Delete a save
