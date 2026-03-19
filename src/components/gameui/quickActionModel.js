const normalizeText = (value) => String(value || "").trim();

const toTitleCase = (value) => {
  const text = normalizeText(value);
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function getQuickActionSkills(player = {}) {
  const rawSkills = [];

  if (Array.isArray(player.activeSkills)) {
    rawSkills.push(...player.activeSkills);
  }

  if (Array.isArray(player.skills?.active)) {
    rawSkills.push(...player.skills.active);
  }

  if (Array.isArray(player.abilities)) {
    rawSkills.push(
      ...player.abilities.filter((ability) => ability?.type === "active"),
    );
  }

  const seen = new Set();

  return rawSkills
    .map((skill) => {
      if (!skill) return null;
      if (typeof skill === "string") {
        return {
          id: skill,
          name: skill,
          description: "",
        };
      }

      const id =
        normalizeText(skill.id) ||
        normalizeText(skill.skillId) ||
        normalizeText(skill.abilityId);
      if (!id) return null;

      const name = normalizeText(skill.name) || normalizeText(skill.label) || id;
      return {
        ...skill,
        id,
        name,
        description: normalizeText(skill.description),
        manaCost: Number.isFinite(skill.manaCost)
          ? skill.manaCost
          : Number.isFinite(skill.cost?.mana)
            ? skill.cost.mana
            : 0,
      };
    })
    .filter((skill) => {
      if (!skill || seen.has(skill.id)) return false;
      seen.add(skill.id);
      return true;
    })
    .slice(0, 8);
}

export function getQuickActionItems(player = {}) {
  const inventory = Array.isArray(player.inventory) ? player.inventory : [];
  return inventory
    .map((item) => {
      if (!item) return null;
      const id = normalizeText(item.id);
      if (!id) return null;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const effect =
        item.effect && typeof item.effect === "object" ? item.effect : {};
      const usable =
        item.type === "consumable" ||
        Number.isFinite(effect.heal) ||
        Number.isFinite(effect.mana);
      return {
        ...item,
        id,
        name: normalizeText(item.name) || toTitleCase(id),
        quantity,
        description: normalizeText(item.description),
        usable,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export function getPrimaryCombatEnemyIndex(combatState = {}) {
  const enemies = Array.isArray(combatState.enemies) ? combatState.enemies : [];
  const firstLivingIndex = enemies.findIndex(
    (enemy) => Number(enemy?.stats?.hp?.current ?? 0) > 0,
  );
  return firstLivingIndex >= 0 ? firstLivingIndex : 0;
}
