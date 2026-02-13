import { z } from 'zod';

// Action Schemas
const UseItemActionSchema = z.object({
  type: z.literal('use_item'),
  itemId: z.string(),
  itemName: z.string().optional(),
});

const MoveActionSchema = z.object({
  type: z.literal('move'),
  targetLocation: z.string(),
});

const RestActionSchema = z.object({
  type: z.literal('rest'),
});

const AttackActionSchema = z.object({
  type: z.literal('attack'),
  enemyIds: z.array(z.string()).optional(),
  enemyIndex: z.number().optional(),
  skillId: z.string().nullable().optional(),
});

const LookActionSchema = z.object({
  type: z.literal('look'),
});

const InventoryActionSchema = z.object({
  type: z.literal('inventory'),
});

const StatusActionSchema = z.object({
  type: z.literal('status'),
});

const NarrativeActionSchema = z.object({
  type: z.literal('narrative'),
});

const EssenceIdSchema = z.enum([
  "fire",
  "water",
  "earth",
  "air",
  "lightning",
  "shadow",
  "light",
  "life",
  "creation",
  "destruction",
  "space",
  "time",
]);

const MagicSenseActionSchema = z.object({
  type: z.literal("magic_sense"),
  essence: EssenceIdSchema.nullable().optional(),
});

const MagicAttuneActionSchema = z.object({
  type: z.literal("magic_attune"),
  stance: z.enum(["open", "focused", "guarded"]),
  essence: EssenceIdSchema.nullable().optional(),
});

const MagicDrawActionSchema = z.object({
  type: z.literal("magic_draw"),
  essence: EssenceIdSchema,
  amount: z.number().nullable().optional(),
});

const MagicRefineActionSchema = z.object({
  type: z.literal("magic_refine"),
  essence: EssenceIdSchema,
  method: z.string().nullable().optional(),
  amount: z.number(),
});

const MagicCompressActionSchema = z.object({
  type: z.literal("magic_compress"),
  essence: EssenceIdSchema,
  method: z.string().nullable().optional(),
  tier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

const MagicShapeActionSchema = z.object({
  type: z.literal("magic_shape"),
  essence: EssenceIdSchema,
  form: z.string(),
  amount: z.number().nullable().optional(),
});

const MagicWeaveActionSchema = z.object({
  type: z.literal("magic_weave"),
  essences: z.array(EssenceIdSchema).min(2),
  pattern: z.string(),
});

const MagicAnchorActionSchema = z.object({
  type: z.literal("magic_anchor"),
  kind: z.enum(["self", "area", "item"]),
  itemId: z.string().nullable().optional(),
});

const MagicReleaseActionSchema = z.object({
  type: z.literal("magic_release"),
});

export const ParsedActionSchema = z.discriminatedUnion('type', [
  UseItemActionSchema,
  MoveActionSchema,
  RestActionSchema,
  AttackActionSchema,
  LookActionSchema,
  InventoryActionSchema,
  StatusActionSchema,
  NarrativeActionSchema,
  MagicSenseActionSchema,
  MagicAttuneActionSchema,
  MagicDrawActionSchema,
  MagicRefineActionSchema,
  MagicCompressActionSchema,
  MagicShapeActionSchema,
  MagicWeaveActionSchema,
  MagicAnchorActionSchema,
  MagicReleaseActionSchema,
]);

// State Schemas
const WorldLocationStateSchema = z.object({
  current: z.string(),
  visited: z.array(z.string()),
  unlockedAreas: z.array(z.string()),
  biome: z.string().optional(),
});

const WorldTimeStateSchema = z.object({
  currentTime: z.number(),
  timeOfDay: z.enum(["dawn", "day", "dusk", "night"]),
  isOutdoors: z.boolean().optional(),
  lastUpdate: z.number().optional(),
});

const WeatherTypeSchema = z.enum(["clear", "rain", "storm", "drought", "fog"]);

const WorldWeatherStateSchema = z
  .object({
    byBiome: z.record(
      z.object({
        type: WeatherTypeSchema,
        intensity: z.number(),
        updatedTurn: z.number(),
      }),
    ),
  })
  .partial();

const AmbientEssenceNodeSchema = z.object({
  density: z.number(),
  purity: z.number(),
  taint: z.number(),
});

const AmbientSnapshotSchema = z.object({
  compositionByEssence: z.record(AmbientEssenceNodeSchema),
  global: z
    .object({
      drawMultByEssence: z.record(z.number()),
      refineYieldMultByEssence: z.record(z.number()),
      stabilityCapDelta: z.number(),
      compressRiskMultByEssence: z.record(z.number()),
      potencyMultByEssence: z.record(z.number()),
    })
    .partial(),
  provenance: z
    .object({
      biome: z.string().nullable().optional(),
      timeOfDay: z.string().nullable().optional(),
      weatherType: z.string().nullable().optional(),
      weatherIntensity: z.number().nullable().optional(),
      anomalyIds: z.array(z.string()).optional(),
      locationId: z.string().nullable().optional(),
    })
    .partial(),
  tags: z.array(z.string()).optional(),
});

const WorldStateSchema = z.object({
  id: z.string(),
  location: WorldLocationStateSchema,
  flags: z.record(z.boolean()),
  vars: z.record(z.unknown()),
  counters: z.record(z.number()),
  factionReputation: z.record(z.number()),
  time: z.union([z.number(), WorldTimeStateSchema]),
  turnCount: z.number(),
  weather: WorldWeatherStateSchema.optional(),
  essence: z
    .object({
      ambient: z.union([z.record(z.number()), AmbientSnapshotSchema]),
      sources: z.array(z.unknown()).optional(),
    })
    .optional(),
});

const PlayerStateSchema = z.object({
  name: z.string(),
  level: z.number(),
  xp: z.object({
    current: z.number(),
    max: z.number(),
  }),
  hp: z.object({
    current: z.number(),
    max: z.number(),
  }),
  mana: z.object({
    current: z.number(),
    max: z.number(),
  }),
  attributes: z.record(z.number()),
  inventory: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
    name: z.string().optional(),
  })),
  equipment: z.record(z.unknown()),
  abilities: z.array(z.object({
    id: z.string(),
  })),
  titles: z.array(z.string()),
  unlockedTitles: z.array(z.string()),
  equippedTitle: z.string().nullable(),
  activeSkills: z.array(z.unknown()),
  passiveSkills: z.array(z.unknown()),
  currency: z.object({
    goldCoins: z.number(),
    soulpoints: z.number(),
  }).optional(),
  gold: z.number().optional(),
  soulpoints: z.number().optional(),
  profession: z.unknown().optional(),
  professions: z.record(z.unknown()).optional(),
  progress: z.record(z.unknown()).optional(),
  magic: z
    .object({
      stability: z
        .object({
          body: z.object({ current: z.number(), max: z.number() }),
          mind: z.object({ current: z.number(), max: z.number() }),
          cognitive: z.object({ current: z.number(), max: z.number() }),
        })
        .optional(),
      affinity: z.record(z.number()).optional(),
      attunement: z.record(z.number()).optional(),
      reserves: z.record(z.number()).optional(),
      charges: z.array(z.unknown()).optional(),
      anchors: z.record(z.unknown()).optional(),
      stance: z.unknown().optional(),
      paradigm: z.unknown().optional(),
      memoryShards: z.array(z.unknown()).optional(),
      prepared: z.unknown().optional(),
      mana: z.object({ current: z.number(), max: z.number() }).optional(),
    })
    .optional(),
  isDead: z.boolean().optional(),
});

const QuestsStateSchema = z.object({
  active: z.array(z.unknown()),
  completed: z.array(z.unknown()),
});

export const GameStateSchema = z.object({
  config: z.record(z.unknown()),
  player: PlayerStateSchema,
  quests: QuestsStateSchema,
  world: WorldStateSchema,
  chatLog: z.array(z.unknown()).optional(),
  narrative: z.unknown().optional(),
  combat: z.unknown().optional(),
});

// Validation Functions
export function validateAction(action) {
  const result = ParsedActionSchema.safeParse(action);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}

export function validateGameState(state) {
  const result = GameStateSchema.safeParse(state);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}

// Export schemas for use in other validation contexts
export {
  UseItemActionSchema,
  MoveActionSchema,
  RestActionSchema,
  AttackActionSchema,
  LookActionSchema,
  InventoryActionSchema,
  StatusActionSchema,
  NarrativeActionSchema,
  MagicSenseActionSchema,
  MagicAttuneActionSchema,
  MagicDrawActionSchema,
  MagicRefineActionSchema,
  MagicCompressActionSchema,
  MagicShapeActionSchema,
  MagicWeaveActionSchema,
  MagicAnchorActionSchema,
  MagicReleaseActionSchema,
  WorldLocationStateSchema,
  WorldStateSchema,
  PlayerStateSchema,
  QuestsStateSchema,
};
