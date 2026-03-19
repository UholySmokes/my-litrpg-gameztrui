import { STAT_PRESETS, allocatePoints } from '../../packages/game-core/src/systems/AutoStatAllocator.js';

const ALL_ATTRS = [
  'strength', 'agility', 'dexterity', 'vitality', 'intelligence',
  'wisdom', 'charisma', 'willpower', 'luck', 'soul',
];

function totalOf(alloc) {
  return Object.values(alloc).reduce((s, v) => s + v, 0);
}

describe('AutoStatAllocator', () => {
  describe('STAT_PRESETS', () => {
    it('has balanced, offensive, defensive, and caster presets', () => {
      expect(STAT_PRESETS).toHaveProperty('balanced');
      expect(STAT_PRESETS).toHaveProperty('offensive');
      expect(STAT_PRESETS).toHaveProperty('defensive');
      expect(STAT_PRESETS).toHaveProperty('caster');
    });

    it.each(Object.keys(STAT_PRESETS))('preset "%s" has name, description, and weights', (key) => {
      const p = STAT_PRESETS[key];
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
      expect(typeof p.weights).toBe('object');
    });
  });

  describe('allocatePoints', () => {
    // --- Total points invariant ---
    it.each([1, 3, 5, 10, 30, 100])('total allocated equals input (%i points, balanced)', (pts) => {
      const alloc = allocatePoints(pts, 'balanced');
      expect(totalOf(alloc)).toBe(pts);
    });

    it.each(Object.keys(STAT_PRESETS))('total allocated equals 3 for preset "%s"', (key) => {
      const alloc = allocatePoints(3, key);
      expect(totalOf(alloc)).toBe(3);
    });

    // --- Balanced preset ---
    it('balanced distributes points across all 10 stats', () => {
      const alloc = allocatePoints(10, 'balanced');
      for (const attr of ALL_ATTRS) {
        expect(alloc[attr]).toBe(1);
      }
    });

    it('balanced with 30 points gives 3 each', () => {
      const alloc = allocatePoints(30, 'balanced');
      for (const attr of ALL_ATTRS) {
        expect(alloc[attr]).toBe(3);
      }
    });

    // --- Offensive preset ---
    it('offensive prioritises strength, agility, dexterity', () => {
      const alloc = allocatePoints(10, 'offensive');
      expect(alloc.strength).toBeGreaterThanOrEqual(alloc.vitality || 0);
      expect(alloc.strength).toBeGreaterThanOrEqual(alloc.luck || 0);
      // zero-weight attrs get nothing
      expect(alloc.wisdom ?? 0).toBe(0);
      expect(alloc.charisma ?? 0).toBe(0);
      expect(alloc.willpower ?? 0).toBe(0);
      expect(alloc.soul ?? 0).toBe(0);
    });

    // --- Defensive preset ---
    it('defensive prioritises vitality, wisdom, willpower', () => {
      const alloc = allocatePoints(10, 'defensive');
      expect(alloc.vitality).toBeGreaterThanOrEqual(alloc.strength || 0);
      expect(alloc.wisdom).toBeGreaterThanOrEqual(alloc.agility || 0);
      expect(alloc.willpower).toBeGreaterThanOrEqual(alloc.agility || 0);
      // zero-weight attrs
      expect(alloc.dexterity ?? 0).toBe(0);
      expect(alloc.intelligence ?? 0).toBe(0);
      expect(alloc.charisma ?? 0).toBe(0);
      expect(alloc.luck ?? 0).toBe(0);
    });

    // --- Caster preset ---
    it('caster prioritises intelligence, wisdom, willpower', () => {
      const alloc = allocatePoints(10, 'caster');
      expect(alloc.intelligence).toBeGreaterThanOrEqual(alloc.agility || 0);
      expect(alloc.wisdom).toBeGreaterThanOrEqual(alloc.agility || 0);
      expect(alloc.willpower).toBeGreaterThanOrEqual(alloc.agility || 0);
      // zero-weight attrs
      expect(alloc.strength ?? 0).toBe(0);
      expect(alloc.dexterity ?? 0).toBe(0);
      expect(alloc.charisma ?? 0).toBe(0);
      expect(alloc.luck ?? 0).toBe(0);
    });

    // --- Edge cases ---
    it('returns empty object for 0 points', () => {
      expect(allocatePoints(0, 'balanced')).toEqual({});
    });

    it('returns empty object for negative points', () => {
      expect(allocatePoints(-5, 'balanced')).toEqual({});
    });

    it('returns empty object for unknown preset string', () => {
      expect(allocatePoints(3, 'nonexistent')).toEqual({});
    });

    it('returns empty object for null weights', () => {
      expect(allocatePoints(3, null)).toEqual({});
    });

    it('handles 1 point correctly', () => {
      const alloc = allocatePoints(1, 'balanced');
      expect(totalOf(alloc)).toBe(1);
    });

    // --- Custom weights ---
    it('accepts a custom weights object', () => {
      const custom = { strength: 2, vitality: 1 };
      const alloc = allocatePoints(9, custom);
      expect(totalOf(alloc)).toBe(9);
      expect(alloc.strength).toBe(6);
      expect(alloc.vitality).toBe(3);
    });

    it('custom weights with all-zero weights returns empty', () => {
      const alloc = allocatePoints(5, { strength: 0, agility: 0 });
      expect(alloc).toEqual({});
    });

    // --- Determinism ---
    it('is deterministic (same inputs → same outputs)', () => {
      const a = allocatePoints(17, 'offensive');
      const b = allocatePoints(17, 'offensive');
      expect(a).toEqual(b);
    });
  });
});
