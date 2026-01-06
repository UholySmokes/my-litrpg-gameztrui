import { describe, it, expect } from '@jest/globals';
import talentRegistry from '../src/lib/data/talent.registry.json';
import { getTalentRule } from '../src/lib/logic/TalentManager.sys.mjs';

describe('Talent Registry → Rule Mapping', () => {
  it('maps mana:zero to bypassCost', () => {
    const entry = talentRegistry.talents.find(t => t.id === 'infinity');
    expect(entry).toBeTruthy();
    const rule = getTalentRule('infinity');
    expect(rule.ruleBreaker.bypassCost).toBe(true);
  });

  it('maps cooldown:zero to bypassCooldown', () => {
    const rule = getTalentRule('cooldown_nullifier');
    expect(rule.ruleBreaker.bypassCooldown).toBe(true);
  });

  it('maps crit:guaranteed to overrideCrit', () => {
    const rule = getTalentRule('critical_floor_guarantee');
    expect(rule.ruleBreaker.overrideCrit).toBe('guaranteed');
  });

  it('maps status:immune to statusImmune', () => {
    const rule = getTalentRule('divine');
    expect(rule.ruleBreaker.statusImmune).toBe(true);
  });

  it('maps stat:uncapped to removeStatCap', () => {
    const rule = getTalentRule('limit_breaker');
    expect(rule.ruleBreaker.removeStatCap).toBe(true);
  });

  it('maps rng:controlled to controlRng', () => {
    const rule = getTalentRule('fate');
    expect(rule.ruleBreaker.controlRng).toBe(true);
  });
});
