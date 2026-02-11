import { describe, it, expect } from '@jest/globals';
import { validateAction, validateGameState } from '@voidverse/game-schemas/validation';

describe('Game Schemas Validation', () => {
  describe('Action Validation', () => {
    it('validates correct attack action', () => {
      const action = {
        type: 'attack',
        enemyIds: ['enemy1'],
        skillId: null,
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('validates correct move action', () => {
      const action = {
        type: 'move',
        targetLocation: 'forest',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('validates correct rest action', () => {
      const action = {
        type: 'rest',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('validates correct use_item action', () => {
      const action = {
        type: 'use_item',
        itemId: 'potion1',
        itemName: 'Health Potion',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid action type', () => {
      const action = {
        type: 'invalid_action',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid input');
    });

    it('rejects action with missing required fields', () => {
      const action = {
        type: 'move',
        // missing targetLocation
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
    });

    it('validates all action types', () => {
      const actionTypes = [
        { type: 'use_item', itemId: 'item1' },
        { type: 'move', targetLocation: 'town' },
        { type: 'rest' },
        { type: 'attack', enemyIds: ['e1'] },
        { type: 'look' },
        { type: 'inventory' },
        { type: 'status' },
        { type: 'narrative' },
        { type: 'magic_sense' },
        { type: 'magic_attune', stance: 'open' },
        { type: 'magic_draw', essence: 'fire', amount: 5 },
        { type: 'magic_refine', essence: 'water', method: 'stream', amount: 6 },
        { type: 'magic_compress', essence: 'fire', method: 'spiral', tier: 2 },
        { type: 'magic_shape', essence: 'air', form: 'jet', amount: 4 },
        { type: 'magic_weave', essences: ['fire', 'air'], pattern: 'vortex' },
        { type: 'magic_anchor', kind: 'self' },
        { type: 'magic_release' },
      ];

      for (const action of actionTypes) {
        const result = validateAction(action);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('State Validation', () => {
    it('validates minimal game state', () => {
      const state = {
        config: {},
        player: {
          name: 'Hero',
          level: 1,
          xp: { current: 0, max: 100 },
          hp: { current: 100, max: 100 },
          mana: { current: 50, max: 50 },
          attributes: {},
          inventory: [],
          equipment: {},
          abilities: [],
          titles: [],
          unlockedTitles: [],
          equippedTitle: null,
          activeSkills: [],
          passiveSkills: [],
        },
        quests: {
          active: [],
          completed: [],
        },
        world: {
          id: 'world1',
          location: {
            current: 'town',
            visited: [],
            unlockedAreas: [],
          },
          flags: {},
          vars: {},
          counters: {},
          factionReputation: {},
          time: 0,
          turnCount: 0,
        },
      };

      const result = validateGameState(state);
      expect(result.valid).toBe(true);
    });

    it('rejects state with missing player', () => {
      const state = {
        config: {},
        quests: { active: [], completed: [] },
        world: {
          id: 'world1',
          location: { current: 'town', visited: [], unlockedAreas: [] },
          flags: {},
          vars: {},
          counters: {},
          factionReputation: {},
          time: 0,
          turnCount: 0,
        },
      };

      const result = validateGameState(state);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('player');
    });

    it('rejects state with invalid player hp', () => {
      const state = {
        config: {},
        player: {
          name: 'Hero',
          level: 1,
          xp: { current: 0, max: 100 },
          hp: { current: 'invalid', max: 100 }, // invalid type
          mana: { current: 50, max: 50 },
          attributes: {},
          inventory: [],
          equipment: {},
          abilities: [],
          titles: [],
          unlockedTitles: [],
          equippedTitle: null,
          activeSkills: [],
          passiveSkills: [],
        },
        quests: { active: [], completed: [] },
        world: {
          id: 'world1',
          location: { current: 'town', visited: [], unlockedAreas: [] },
          flags: {},
          vars: {},
          counters: {},
          factionReputation: {},
          time: 0,
          turnCount: 0,
        },
      };

      const result = validateGameState(state);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('hp.current');
    });
  });
});
