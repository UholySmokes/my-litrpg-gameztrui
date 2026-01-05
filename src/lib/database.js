// =================================================================
// Supabase/Postgres schema helpers (SQL strings)
// =================================================================

export const SQL_CREATE_ITEMS = `
CREATE TABLE IF NOT EXISTS items_base (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb
);
`;

export const SQL_CREATE_AFFIXES = `
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
`;

export const SQL_CREATE_ITEM_INSTANCES = `
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
`;

export const SQL_CREATE_INVENTORY = `
CREATE TABLE IF NOT EXISTS inventory (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES items_instance(id) ON DELETE CASCADE,
  slot text DEFAULT NULL,
  PRIMARY KEY (user_id, instance_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
`;

export const SQL_RLS = `
ALTER TABLE items_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item instances are owned" ON items_instance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inventory entries are owned" ON inventory
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;
