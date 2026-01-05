import affixes from './data/itemAffixes.json';

/**
 * Picks a prefix/suffix (optionally filtered by tags) and returns a name + affix ids.
 */
export function generateAffixedName(baseName, { tags = [], rng = Math.random } = {}) {
  const prefix = pickAffix(affixes.prefixes, tags, rng);
  const suffix = pickAffix(affixes.suffixes, tags, rng);
  const name = `${prefix ? prefix.text + ' ' : ''}${baseName}${suffix ? ' ' + suffix.text : ''}`.trim();
  return {
    name,
    prefixId: prefix?.id || null,
    suffixId: suffix?.id || null
  };
}

function pickAffix(list, tags, rng) {
  if (!list || list.length === 0) return null;
  const filtered = tags.length
    ? list.filter(a => !a.tags || a.tags.some(t => tags.includes(t)))
    : list;
  const pool = filtered.length ? filtered : list;
  const totalWeight = pool.reduce((sum, a) => sum + (a.weight || 1), 0);
  let roll = (rng() * totalWeight);
  for (const a of pool) {
    roll -= (a.weight || 1);
    if (roll <= 0) return a;
  }
  return pool[pool.length - 1];
}
