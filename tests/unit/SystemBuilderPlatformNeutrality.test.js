import { describe, it, expect } from '@jest/globals';
import { SystemBuilder } from '../../packages/game-core/src/systems/archetype/SystemBuilder.js';

describe('SystemBuilder Platform Neutrality', () => {
  describe('Player ID Generation', () => {
    it('generates deterministic IDs when provided with RNG context', () => {
      // Mock deterministic RNG
      const mockRng = {
        range: (min, max) => min + 42, // Always returns min + 42
      };
      
      const context = { rng: mockRng };
      
      const builder1 = new SystemBuilder({}, context);
      const builder2 = new SystemBuilder({}, context);
      
      // Both should generate the same ID with same RNG
      expect(builder1.playerProfile.id).toBe(builder2.playerProfile.id);
      expect(builder1.playerProfile.id).toBe('player_100042');
    });

    it('generates different IDs with different RNG seeds', () => {
      const mockRng1 = {
        range: (min, max) => min + 100,
      };
      
      const mockRng2 = {
        range: (min, max) => min + 200,
      };
      
      const builder1 = new SystemBuilder({}, { rng: mockRng1 });
      const builder2 = new SystemBuilder({}, { rng: mockRng2 });
      
      expect(builder1.playerProfile.id).toBe('player_100100');
      expect(builder2.playerProfile.id).toBe('player_100200');
      expect(builder1.playerProfile.id).not.toBe(builder2.playerProfile.id);
    });

    it('falls back to non-deterministic generation without context', () => {
      const builder1 = new SystemBuilder({});
      const builder2 = new SystemBuilder({});
      
      // Both should have IDs
      expect(builder1.playerProfile.id).toMatch(/^player_\d+$/);
      expect(builder2.playerProfile.id).toMatch(/^player_\d+$/);
      
      // They will likely be different (non-deterministic)
      // but we won't test for that since Math.random() could theoretically return the same value
    });

    it('respects provided player ID', () => {
      const customId = 'custom_player_123';
      const builder = new SystemBuilder({ id: customId });
      
      expect(builder.playerProfile.id).toBe(customId);
    });

    it('does not use Date.now() for ID generation', () => {
      // Verify the ID format - if it used Date.now(), it would be a 13-digit number
      const builder = new SystemBuilder({});
      
      // With our implementation, it should be a 6-digit number (100000-999999)
      const idMatch = builder.playerProfile.id.match(/^player_(\d+)$/);
      expect(idMatch).not.toBeNull();
      
      const number = parseInt(idMatch[1], 10);
      expect(number).toBeGreaterThanOrEqual(100000);
      expect(number).toBeLessThanOrEqual(999999);
      
      // Date.now() would produce numbers > 1 trillion
      expect(number).toBeLessThan(1000000);
    });
  });
});
