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

export const ParsedActionSchema = z.discriminatedUnion('type', [
  UseItemActionSchema,
  MoveActionSchema,
  RestActionSchema,
  AttackActionSchema,
  LookActionSchema,
  InventoryActionSchema,
  StatusActionSchema,
  NarrativeActionSchema,
]);

// State Schemas
const WorldLocationStateSchema = z.object({
  current: z.string(),
  visited: z.array(z.string()),
  unlockedAreas: z.array(z.string()),
});

const WorldStateSchema = z.object({
  id: z.string(),
  location: WorldLocationStateSchema,
  flags: z.record(z.boolean()),
  vars: z.record(z.unknown()),
  counters: z.record(z.number()),
  factionReputation: z.record(z.number()),
  time: z.number(),
  turnCount: z.number(),
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
    reason: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}

export function validateGameState(state) {
  const result = GameStateSchema.safeParse(state);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
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
  WorldLocationStateSchema,
  WorldStateSchema,
  PlayerStateSchema,
  QuestsStateSchema,
};
