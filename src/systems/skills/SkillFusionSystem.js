const toNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const getSkillType = (skill) => {
  if (!skill || typeof skill !== "object") return "active";
  if (skill.type) return skill.type;
  if (skill.category) return skill.category;
  return skill.isPassive ? "passive" : "active";
};

const normalizeTags = (tags) =>
  Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];

const hashString = (input) => {
  const text = String(input || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const createFusionId = (skillA, skillB, existingIds = new Set()) => {
  const base = `fusion_${hashString(`${skillA?.id || ""}_${skillB?.id || ""}`)}`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
};

export const canFuseSkills = (skillA, skillB) => {
  if (!skillA || !skillB) return false;
  if (skillA.id === skillB.id) return false;
  if (skillA.canFuse === false || skillB.canFuse === false) return false;
  const typeA = getSkillType(skillA);
  const typeB = getSkillType(skillB);
  return typeA === typeB;
};

export const fuseSkills = (skillA, skillB, { existingIds } = {}) => {
  if (!canFuseSkills(skillA, skillB)) return null;
  const type = getSkillType(skillA);
  const tags = Array.from(
    new Set([...normalizeTags(skillA.tags), ...normalizeTags(skillB.tags)]),
  );
  const id = createFusionId(skillA, skillB, existingIds);
  const baseMana = toNumber(skillA.manaCost, 0) + toNumber(skillB.manaCost, 0);
  const baseCooldown = Math.max(
    toNumber(skillA.cooldown, 0),
    toNumber(skillB.cooldown, 0),
  );
  const level = Math.max(toNumber(skillA.level, 1), toNumber(skillB.level, 1)) + 1;

  return {
    id,
    name: `${skillA.name || "Skill"} + ${skillB.name || "Skill"}`,
    type,
    class: "fusion",
    description: `${skillA.description || ""} ${skillB.description || ""}`.trim(),
    level,
    manaCost: Math.max(1, Math.round(baseMana * 0.75)),
    cooldown: Math.max(0, baseCooldown + 1),
    canFuse: false,
    canEvolve: true,
    canUpgrade: true,
    fusionSources: [skillA.id, skillB.id],
    tags,
  };
};
