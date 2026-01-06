import { PRIORITY, resolveBypasses, applyCostOverride, applyCooldownOverride, applyCritOverride, applyCritMultiplier, applyDropOverrides, systemDescribeTalent, evaluateTalent, checkBypass, computeSystemStrain, getWorldReaction } from '../src/lib/logic/TalentManager.sys.mjs';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log('=== TALENT MANAGER VERIFICATION ===');

const talents = ['mana_cost_zero', 'infinite_mana_regen', 'critical_guarantee', 'critical_multiplier', 'cooldown_removal', 'hundred_percent_drop', 'drop_quality'];

const bypasses = resolveBypasses(talents);

console.log('Bypasses:', bypasses);

const cost = applyCostOverride(50, bypasses);
console.log('Cost Override:', cost);
assert(cost === 0, 'Cost should be 0');

const cd = applyCooldownOverride(30, bypasses);
console.log('Cooldown Override:', cd);
assert(cd === 0, 'Cooldown should be 0');

const critChance = applyCritOverride(0.1, bypasses);
console.log('Crit Chance Override:', critChance);
assert(critChance === 1, 'Crit chance should be 1');

const critMult = applyCritMultiplier(1.5, bypasses);
console.log('Crit Multiplier Override:', critMult);
assert(critMult === 10, 'Crit multiplier should be 10');

const drop = applyDropOverrides({ chance: 0.05, quality: 'common' }, bypasses);
console.log('Drop Override:', drop);
assert(drop.chance === 1, 'Drop chance should be 1');
assert(drop.quality === 'legendary', 'Drop quality should be legendary');

for (const id of talents) {
  const desc = systemDescribeTalent(id);
  const evalRes = evaluateTalent(id);
  console.log('Description:', desc);
  console.log('Eval:', evalRes);
  assert(typeof desc === 'string' && desc.includes('INITIATED'), 'Description format invalid');
  assert(evalRes.type === 'RULE_BREAKER', 'Eval should be RULE_BREAKER for mapped talents');
}

// Test 6: Administrative Bypass Checks
console.log('\n[Test 6] Administrative Bypass Checks');
console.log('Bypass mana_cost (infinite_mana_regen):', checkBypass('infinite_mana_regen', 'mana_cost'));
assert(checkBypass('infinite_mana_regen', 'mana_cost') === true, 'infinite_mana_regen should bypass mana cost');
console.log('Bypass cooldown (cooldown_removal):', checkBypass('cooldown_removal', 'cooldown'));
assert(checkBypass('cooldown_removal', 'cooldown') === true, 'cooldown_removal should bypass cooldown');

// Test 7: System Strain and World Reaction
console.log('\n[Test 7] System Strain & World Reaction');
const strain = computeSystemStrain(['infinite_mana_regen', 'cooldown_removal', 'hundred_percent_drop', 'drop_quality', 'critical_guarantee']);
console.log('Strain:', strain);
const reaction = getWorldReaction(strain);
console.log('Reaction:', reaction);
assert(reaction.monsterAggroMultiplier >= 1, 'Aggro multiplier should be at least 1');

console.log('ALL TESTS PASSED. TalentManager operational.');
