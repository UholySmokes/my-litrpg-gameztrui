import { z } from 'zod';
import type { ParsedAction, GameState, ValidationResult } from './actions.js';
import type { WorldLocationState, WorldState, PlayerState } from './state.js';

// Export Zod schemas
export declare const ParsedActionSchema: z.ZodType<ParsedAction>;
export declare const GameStateSchema: z.ZodType<GameState>;
export declare const WorldLocationStateSchema: z.ZodType<WorldLocationState>;
export declare const WorldStateSchema: z.ZodType<WorldState>;
export declare const PlayerStateSchema: z.ZodType<PlayerState>;

// Individual action schemas
export declare const UseItemActionSchema: z.ZodObject<any>;
export declare const MoveActionSchema: z.ZodObject<any>;
export declare const RestActionSchema: z.ZodObject<any>;
export declare const AttackActionSchema: z.ZodObject<any>;
export declare const LookActionSchema: z.ZodObject<any>;
export declare const InventoryActionSchema: z.ZodObject<any>;
export declare const StatusActionSchema: z.ZodObject<any>;
export declare const NarrativeActionSchema: z.ZodObject<any>;
export declare const MagicPurgeActionSchema: z.ZodObject<any>;
export declare const QuestsStateSchema: z.ZodObject<any>;

// Validation functions
export declare function validateAction(action: unknown): ValidationResult;
export declare function validateGameState(state: unknown): ValidationResult;
