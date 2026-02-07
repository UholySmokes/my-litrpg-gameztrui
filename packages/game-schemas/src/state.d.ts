// Mirrors the current in-app state shape (Phase 1 extraction).
// This is intentionally loose until the canonical state split is introduced.

export type WorldLocationState = {
  current: string;
  visited: string[];
  unlockedAreas: string[];
};

export type WorldState = {
  id: string;
  location: WorldLocationState;
  flags: Record<string, boolean>;
  vars: Record<string, unknown>;
  counters: Record<string, number>;
  factionReputation: Record<string, number>;
  time: number;
  turnCount: number;
};

export type PlayerState = {
  name: string;
  level: number;
  xp: { current: number; max: number };
  hp: { current: number; max: number };
  mana: { current: number; max: number };
  attributes: Record<string, number>;
  inventory: Array<{ id: string; quantity: number; name?: string }>;
  equipment: Record<string, unknown>;
  abilities: Array<{ id: string }>;
  titles: string[];
  unlockedTitles: string[];
  equippedTitle: string | null;
  activeSkills: unknown[];
  passiveSkills: unknown[];
  currency?: { goldCoins: number; soulpoints: number };
  gold?: number;
  soulpoints?: number;
  profession?: unknown;
  professions?: Record<string, unknown>;
  progress?: Record<string, unknown>;
  isDead?: boolean;
};

export type GameState = {
  config: Record<string, unknown>;
  player: PlayerState;
  quests: {
    active: unknown[];
    completed: unknown[];
  };
  world: WorldState;
  chatLog?: unknown[];
  narrative?: unknown;
  combat?: unknown;
  /** Content pack version string, e.g. "core@2026.02.07+sha256:..." */
  contentVersion?: string;
  /** State schema migration key */
  stateVersion?: number;
};

