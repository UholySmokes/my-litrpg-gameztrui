import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export function loadJson(path) {
  return require(path);
}

export function talentFactory(id, registry = null) {
  const data = (registry || loadJson('./talent.registry.json')).talents || [];
  return data.find(t => t.id === id) || null;
}

export function itemAffixFactory() {
  return loadJson('./itemAffixes.json');
}

export function buildTalentRuleBreaker(entry) {
  const actions = entry.actions || {};
  const rb = {};
  if (actions.mana_cost === 'bypass') rb.bypassCost = true;
  if (actions.cooldown === 'bypass') rb.bypassCooldown = true;
  if (typeof actions.cooldown_multiplier === 'number') rb.cooldownMultiplier = actions.cooldown_multiplier;
  if (typeof actions.mana_cost_multiplier === 'number') rb.costMultiplier = actions.mana_cost_multiplier;
  if (actions.crit === 'guaranteed') rb.overrideCrit = 'guaranteed';
  if (typeof actions.crit_multiplier === 'number') rb.critMultiplierOverride = actions.crit_multiplier;
  if (actions.drop_chance === 'override') rb.ignoreDropRates = true;
  if (typeof actions.drop_quality === 'string') rb.overrideDropQuality = actions.drop_quality;
  return rb;
}
