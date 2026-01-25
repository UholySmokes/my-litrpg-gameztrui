const toNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const normalizeTags = (tags) =>
  Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];

const getSkillType = (skill) => {
  if (!skill || typeof skill !== "object") return "active";
  if (skill.type) return skill.type;
  if (skill.category) return skill.category;
  return skill.isPassive ? "passive" : "active";
};

const createEvolutionId = (skill, existingIds = new Set()) => {
  const base = `${skill?.id || "skill"}_evolved`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
};

export const canEvolveSkill = (skill) => {
  if (!skill) return false;
  if (skill.canEvolve === false) return false;
  return true;
};

export const evolveSkill = (skill, { existingIds } = {}) => {
  if (!canEvolveSkill(skill)) return null;
  const tags = Array.from(new Set([...normalizeTags(skill.tags), "evolved"]));
  const id = createEvolutionId(skill, existingIds);
  const level = toNumber(skill.level, 1) + 1;
  const cooldown = Math.max(0, toNumber(skill.cooldown, 0) - 1);
  const manaCost = Math.max(1, Math.round(toNumber(skill.manaCost, 0) * 1.1));
  const evolutionStage = toNumber(skill.evolutionStage, 0) + 1;

  return {
    ...skill,
    id,
    name: `${skill.name || "Skill"} ${evolutionStage + 1}`,
    description: `${skill.description || ""} (Evolved)`.trim(),
    type: getSkillType(skill),
    level,
    manaCost,
    cooldown,
    evolutionStage,
    canEvolve: true,
    canFuse: true,
    tags,
  };
};
