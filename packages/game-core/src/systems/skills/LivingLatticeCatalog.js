import catalogData from "../../data/skills/living_lattice_v2.catalog.json" with { type: "json" };

export const SKILL_CATALOG_VERSION = "lattice_v2";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneList(values) {
  return Array.isArray(values) ? values.map((entry) => cloneValue(entry)) : [];
}

function normalizeId(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

const ALL_CATALOG_SKILLS = Array.isArray(catalogData) ? catalogData : [];
const SKILL_INDEX = new Map(
  ALL_CATALOG_SKILLS
    .filter((entry) => normalizeId(entry?.id))
    .map((entry) => [entry.id, entry]),
);

export function getLivingLatticeCatalogSkills() {
  return cloneList(ALL_CATALOG_SKILLS);
}

export function getLivingLatticeCatalogSkillById(skillId) {
  const normalized = normalizeId(skillId);
  if (!normalized) return null;
  return cloneValue(SKILL_INDEX.get(normalized) || null);
}

export function getLivingLatticeCatalogSkillsByOwner(ownerType, ownerId) {
  const normalizedType = normalizeId(ownerType);
  const normalizedOwnerId = normalizeId(ownerId);
  return cloneList(
    ALL_CATALOG_SKILLS.filter(
      (entry) =>
        entry?.ownerType === normalizedType &&
        entry?.ownerId === normalizedOwnerId,
    ),
  );
}

export function getLivingLatticeCatalogSkillsBySelectionBand(selectionBand) {
  const normalized = normalizeId(selectionBand);
  return cloneList(
    ALL_CATALOG_SKILLS.filter((entry) => entry?.selectionBand === normalized),
  );
}
