// Mirrors the current in-app state shape (Phase 1 extraction).
// This is intentionally loose until the canonical state split is introduced.

export type WorldLocationState = {
  current: string;
  visited: string[];
  unlockedAreas: string[];
  biome?: string;
};

export type WorldTimeState = {
  currentTime: number;
  timeOfDay: "dawn" | "day" | "dusk" | "night";
  isOutdoors?: boolean;
  lastUpdate?: number;
};

export type WorldWeatherState = {
  byBiome?: Record<
    string,
    {
      type: "clear" | "rain" | "storm" | "drought" | "fog";
      intensity: number;
      updatedTurn: number;
    }
  >;
};

export type AmbientEssenceNode = {
  density: number;
  purity: number;
  taint: number;
};

export type AmbientSnapshot = {
  compositionByEssence: Record<string, AmbientEssenceNode>;
  global?: {
    drawMultByEssence?: Record<string, number>;
    refineYieldMultByEssence?: Record<string, number>;
    stabilityCapDelta?: number;
    compressRiskMultByEssence?: Record<string, number>;
    potencyMultByEssence?: Record<string, number>;
  };
  provenance?: {
    biome?: string | null;
    timeOfDay?: string | null;
    weatherType?: string | null;
    weatherIntensity?: number | null;
    anomalyIds?: string[];
    locationId?: string | null;
  };
  tags?: string[];
};

export type WorldState = {
  id: string;
  location: WorldLocationState;
  flags: Record<string, boolean>;
  vars: Record<string, unknown>;
  counters: Record<string, number>;
  factionReputation: Record<string, number>;
  time: number | WorldTimeState;
  turnCount: number;
  weather?: WorldWeatherState;
  essence?: {
    ambient: Record<string, number> | AmbientSnapshot;
    sources?: unknown[];
  };
};

export type RankedPerk =
  | string
  | {
      id: string;
      rank: number;
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
  magic?: {
    stability?: {
      body: { current: number; max: number };
      mind: { current: number; max: number };
      cognitive: { current: number; max: number };
    };
    affinity?: Record<string, number>;
    attunement?: Record<string, number>;
    reserves?: Record<string, number>;
    reservesTaint?: Record<string, number>;
    charges?: unknown[];
    anchors?: Record<string, unknown>;
    stance?: unknown;
    interference?: { score?: number };
    resonance?: { current?: number; max?: number; state?: string };
    overload?: {
      count?: number;
      lastTurn?: number | null;
      lastEvent?: unknown;
    };
    perks?: RankedPerk[];
    perkProgress?: Record<
      string,
      {
        totalXp?: number;
        lastGainTurn?: number;
      }
    >;
    activeWorkings?: unknown[];
    unlockedPatterns?: { shape?: string[]; weave?: string[] };
    paradigm?: unknown;
    memoryShards?: unknown[];
    prepared?: unknown;
    casting?: unknown;
    mana?: { current: number; max: number };
  };
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

