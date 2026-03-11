import {
  getAllSkillSummaries,
  getLatticeLoadoutSummary,
  getSkillById,
} from "../systems/skills/SkillRegistry.js";
import {
  getClassAbilitiesFor,
  getClassAbilityById,
} from "../systems/class/ClassAbilityRegistry.js";
import {
  getRaceAbilitiesFor,
  getRaceAbilityById,
} from "../systems/race/RaceAbilityRegistry.js";
import { getTalentMigrationLane } from "../systems/skills/TalentMigrationAudit.js";

const BASE_CREATION_LEVEL = 1;

export const CREATION_SKILL_SELECTION_LIMITS = Object.freeze({
  requiredActiveSkillCount: 3,
  requiredPassiveSkillCount: 6,
});

const LOADOUT_TEMPLATES = Object.freeze([
  {
    id: "class_core",
    name: "Class Core",
    description:
      "Prioritize signature class techniques and stable passives before branching out.",
    activeProfile: {
      preferSources: ["class", "race", "general"],
      preferFamilies: ["martial", "magic", "bloodline"],
      preferRuntimeRoles: ["standard", "stance", "reaction"],
      preferKeywords: [
        "slash",
        "strike",
        "bolt",
        "shot",
        "guard",
        "focus",
        "smite",
        "blast",
      ],
    },
    passiveProfile: {
      preferSources: ["class", "race", "general"],
      preferFamilies: ["martial", "magic", "bloodline", "universal"],
      preferKeywords: [
        "mastery",
        "discipline",
        "vigor",
        "focus",
        "guard",
        "training",
        "resolve",
        "instinct",
      ],
    },
  },
  {
    id: "bloodline_edge",
    name: "Bloodline Edge",
    description:
      "Lean into racial identity and reactive play, then fill gaps with class fundamentals.",
    activeProfile: {
      preferSources: ["race", "class", "general"],
      preferFamilies: ["bloodline", "martial", "magic"],
      preferRuntimeRoles: ["reaction", "stance", "standard"],
      preferKeywords: [
        "blood",
        "claw",
        "fang",
        "ancestral",
        "veil",
        "step",
        "instinct",
        "howl",
      ],
    },
    passiveProfile: {
      preferSources: ["race", "class", "general"],
      preferFamilies: ["bloodline", "universal", "martial"],
      preferKeywords: [
        "ancestral",
        "blood",
        "hide",
        "resistance",
        "adapt",
        "feral",
        "instinct",
      ],
    },
  },
  {
    id: "utility_matrix",
    name: "Utility Matrix",
    description:
      "Favor versatile tools, control pieces, and utility passives for a safer opening route.",
    activeProfile: {
      preferSources: ["general", "class", "race"],
      preferFamilies: ["universal", "magic", "profession"],
      preferRuntimeRoles: ["reaction", "channel", "standard"],
      preferKeywords: [
        "mark",
        "ward",
        "scan",
        "trap",
        "support",
        "heal",
        "step",
        "bind",
      ],
    },
    passiveProfile: {
      preferSources: ["general", "class", "race"],
      preferFamilies: ["universal", "profession", "magic", "cultivation"],
      preferKeywords: [
        "craft",
        "harvest",
        "awareness",
        "meditation",
        "efficiency",
        "ritual",
        "utility",
        "control",
      ],
    },
  },
]);

function normalizeId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIdArray(values) {
  if (!Array.isArray(values)) return [];
  const ids = [];
  values.forEach((value) => {
    if (typeof value === "string") {
      const normalized = normalizeId(value);
      if (normalized) ids.push(normalized);
      return;
    }
    if (value && typeof value === "object") {
      const normalized = normalizeId(value.id);
      if (normalized) ids.push(normalized);
    }
  });
  return ids;
}

function normalizeLower(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : fallback;
}

function humanizeLabel(value, fallback = "Unknown") {
  const normalized = normalizeLower(value);
  if (!normalized) return fallback;
  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSkillSlotType(skill) {
  const slotType = normalizeLower(
    skill?.slotType || skill?.lattice?.slotType || skill?.type,
  );
  return slotType === "passive" ? "passive" : "active";
}

function deriveCreationSource(skill, fallbackSource = "general") {
  const explicitSource = normalizeLower(skill?.source);
  if (explicitSource) {
    return explicitSource === "universal" ? "general" : explicitSource;
  }

  const ownerType = normalizeLower(skill?.ownerType);
  if (ownerType === "universal") return "general";
  if (ownerType === "class" || ownerType === "race" || ownerType === "profession") {
    return ownerType;
  }

  const sourceType = normalizeLower(
    skill?.latticeSourceType || skill?.lattice?.sourceType,
  );
  if (sourceType === "class" || sourceType === "race" || sourceType === "profession") {
    return sourceType;
  }
  if (sourceType === "bloodline") return "race";
  if (sourceType === "universal") return "general";

  return fallbackSource;
}

function enrichSkillForCreation(skill, fallbackSource = "general") {
  if (!skill || typeof skill !== "object") return null;
  const id = normalizeId(skill.id);
  if (!id) return null;

  const slotType = getSkillSlotType(skill);
  const source = deriveCreationSource(skill, fallbackSource);
  const latticeFamily = normalizeLower(
    skill?.latticeFamily || skill?.lattice?.family,
    source === "race" ? "bloodline" : source === "general" ? "universal" : source,
  );
  const latticeSourceType = normalizeLower(
    skill?.latticeSourceType || skill?.lattice?.sourceType,
    source === "general" ? "universal" : source,
  );
  const runtimeRole = normalizeLower(
    skill?.runtimeRole || skill?.lattice?.runtimeRole,
    "standard",
  );

  return {
    ...skill,
    id,
    name: typeof skill.name === "string" && skill.name.trim().length > 0
      ? skill.name
      : humanizeLabel(id, id),
    description:
      typeof skill.description === "string" && skill.description.trim().length > 0
        ? skill.description
        : "No description available.",
    type: slotType,
    slotType,
    source,
    latticeFamily,
    latticeSourceType,
    runtimeRole,
    affinityTags: Array.isArray(skill.affinityTags)
      ? [...skill.affinityTags]
      : Array.isArray(skill?.lattice?.affinityTags)
        ? [...skill.lattice.affinityTags]
        : [],
    creationLabels: {
      family: humanizeLabel(latticeFamily),
      sourceType: humanizeLabel(latticeSourceType),
      runtimeRole: humanizeLabel(runtimeRole),
      slotType: humanizeLabel(slotType),
    },
  };
}

function uniqueSkills(skills = []) {
  const seen = new Set();
  return skills.filter((skill) => {
    const id = normalizeId(skill?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeEntry(entry, fallbackType, skillIndex) {
  if (!entry) return null;
  if (typeof entry === "string") {
    const resolved = skillIndex.get(entry);
    if (!resolved) return null;
    return fallbackType && getSkillSlotType(resolved) !== fallbackType
      ? { ...resolved, type: fallbackType, slotType: fallbackType }
      : resolved;
  }
  if (typeof entry === "object") {
    const id = normalizeId(entry.id);
    if (!id) return null;
    if (fallbackType && !entry.type && !entry.slotType) {
      return { ...entry, id, type: fallbackType, slotType: fallbackType };
    }
    return { ...entry, id };
  }
  return null;
}

function collectSkillEntries(entries, fallbackType, skillIndex, source) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => normalizeEntry(entry, fallbackType, skillIndex))
    .map((entry) => enrichSkillForCreation(entry, source))
    .filter(Boolean);
}

function normalizeAbilityEntries(
  entries = [],
  { source, defaultType = "active", fallbackDescription } = {},
) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((ability) => {
      if (!ability || typeof ability !== "object") return null;
      const id = normalizeId(ability.id);
      if (!id) return null;
      return enrichSkillForCreation(
        {
          ...ability,
          id,
          description:
            ability.description || fallbackDescription || "No description available.",
          type: ability.type || defaultType,
          slotType: ability.slotType || ability.type || defaultType,
          source: ability.source || source || "general",
        },
        source || "general",
      );
    })
    .filter(Boolean);
}

function isSkillUnlockedAtCreation(skill) {
  if (!skill) return false;
  const conditions =
    skill?.unlockConditions &&
    typeof skill.unlockConditions === "object" &&
    !Array.isArray(skill.unlockConditions)
      ? skill.unlockConditions
      : null;
  if (!conditions) return true;
  if (conditions.level && conditions.level > BASE_CREATION_LEVEL) return false;
  if (conditions.quest || conditions.item || conditions.location) return false;
  if (
    Array.isArray(conditions.skillPrerequisites) &&
    conditions.skillPrerequisites.length > 0
  ) {
    return false;
  }
  return true;
}

function isGeneralSkillCompatible(skill, classId, raceId) {
  if (!skill || !isSkillUnlockedAtCreation(skill)) return false;

  if (Array.isArray(skill.allowedClasses) && skill.allowedClasses.length > 0) {
    if (!classId || !skill.allowedClasses.includes(classId)) return false;
  }
  if (Array.isArray(skill.requiredClasses) && skill.requiredClasses.length > 0) {
    if (!classId || !skill.requiredClasses.includes(classId)) return false;
  }
  if (typeof skill.requiredClass === "string" && skill.requiredClass) {
    if (!classId || skill.requiredClass !== classId) return false;
  }

  if (Array.isArray(skill.allowedRaces) && skill.allowedRaces.length > 0) {
    if (!raceId || !skill.allowedRaces.includes(raceId)) return false;
  }
  if (Array.isArray(skill.requiredRaces) && skill.requiredRaces.length > 0) {
    if (!raceId || !skill.requiredRaces.includes(raceId)) return false;
  }
  if (typeof skill.requiredRace === "string" && skill.requiredRace) {
    if (!raceId || skill.requiredRace !== raceId) return false;
  }

  return true;
}

function splitSkillsByType(skills = []) {
  const active = [];
  const passive = [];
  skills.forEach((skill) => {
    if (!skill) return;
    if (getSkillSlotType(skill) === "passive") {
      passive.push(skill);
      return;
    }
    active.push(skill);
  });
  return { active, passive };
}

function buildSkillIndex(skillCatalog = []) {
  return new Map(
    skillCatalog
      .filter((skill) => normalizeId(skill?.id))
      .map((skill) => [skill.id, enrichSkillForCreation(skill)]),
  );
}

function buildKeywordBlob(skill) {
  const template = skill?.template && typeof skill.template === "object" ? skill.template : {};
  return [
    skill?.name,
    skill?.description,
    skill?.latticeFamily,
    skill?.latticeSourceType,
    skill?.runtimeRole,
    ...(Array.isArray(skill?.affinityTags) ? skill.affinityTags : []),
    ...(Array.isArray(skill?.tags) ? skill.tags : []),
    ...(Array.isArray(template?.elements) ? template.elements : []),
    ...(Array.isArray(template?.synergies) ? template.synergies : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreSkillForProfile(skill, profile = {}) {
  const source = deriveCreationSource(skill, "general");
  const family = normalizeLower(skill?.latticeFamily);
  const runtimeRole = normalizeLower(skill?.runtimeRole, "standard");
  const keywordBlob = buildKeywordBlob(skill);

  let score = 0;

  (profile.preferSources || []).forEach((preferred, index, all) => {
    if (source === preferred) {
      score += (all.length - index) * 6;
    }
  });
  (profile.preferFamilies || []).forEach((preferred, index, all) => {
    if (family === preferred) {
      score += (all.length - index) * 4;
    }
  });
  (profile.preferRuntimeRoles || []).forEach((preferred, index, all) => {
    if (runtimeRole === preferred) {
      score += (all.length - index) * 3;
    }
  });
  (profile.preferKeywords || []).forEach((keyword) => {
    if (keywordBlob.includes(keyword)) {
      score += 2;
    }
  });

  if (runtimeRole !== "standard") {
    score += 1;
  }

  return score;
}

function pickSkillsForTemplate(pool = [], limit, profile = {}) {
  return uniqueSkills(pool)
    .map((skill) => ({
      skill,
      score: scoreSkillForProfile(skill, profile),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftName = normalizeLower(left.skill?.name, left.skill?.id || "");
      const rightName = normalizeLower(right.skill?.name, right.skill?.id || "");
      if (leftName !== rightName) return leftName.localeCompare(rightName);
      return (left.skill?.id || "").localeCompare(right.skill?.id || "");
    })
    .slice(0, limit)
    .map((entry) => entry.skill);
}

function createLoadoutPreview(skills = []) {
  return skills
    .slice(0, 2)
    .map((skill) => skill?.name || skill?.id)
    .filter(Boolean)
    .join(", ");
}

function buildRuntimeRoleSuggestions(skills = []) {
  return uniqueSkills(skills)
    .filter((skill) => normalizeLower(skill?.runtimeRole, "standard") !== "standard")
    .map((skill) => ({
      skillId: skill.id,
      name: skill.name,
      runtimeRole: skill.runtimeRole,
      label: `${skill.name}: ${humanizeLabel(skill.runtimeRole)}`,
    }))
    .slice(0, 3);
}

function resolveSkillReference(skillRef) {
  if (!skillRef) return null;
  if (typeof skillRef === "object") {
    return enrichSkillForCreation(skillRef);
  }
  if (typeof skillRef === "string") {
    return enrichSkillForCreation(
      getSkillById(skillRef) ||
        getClassAbilityById(skillRef) ||
        getRaceAbilityById(skillRef),
    );
  }
  return null;
}

export function getCharacterCreationSkillSelectionLimits() {
  return { ...CREATION_SKILL_SELECTION_LIMITS };
}

export function buildCharacterCreationSkillPools(cls, race, { allSkills } = {}) {
  const classId = normalizeId(typeof cls === "string" ? cls : cls?.id);
  if (!classId) {
    return { active: [], passive: [] };
  }

  const raceId = normalizeId(typeof race === "string" ? race : race?.id);
  const skillCatalog = Array.isArray(allSkills)
    ? allSkills
    : getAllSkillSummaries();
  const skillIndex = buildSkillIndex(skillCatalog);

  const classSkillEntries = Array.isArray(cls?.skills)
    ? collectSkillEntries(cls.skills, null, skillIndex, "class")
    : skillCatalog
        .filter((skill) => {
          if (!isSkillUnlockedAtCreation(skill)) return false;
          return normalizeLower(skill?.ownerType) === "class" && normalizeId(skill?.ownerId) === classId;
        })
        .map((skill) => enrichSkillForCreation(skill, "class"))
        .filter(Boolean);

  const classAbilityEntries = normalizeAbilityEntries(
    getClassAbilitiesFor(classId) || [],
    { source: "class", defaultType: "active" },
  );
  const classPools = splitSkillsByType([
    ...classSkillEntries,
    ...classAbilityEntries,
  ]);

  const raceSkillEntries = [];
  if (raceId) {
    const raceTaggedSkills = skillCatalog
      .filter((skill) => {
        if (!isSkillUnlockedAtCreation(skill)) return false;
        if (normalizeLower(skill?.ownerType) === "race" && normalizeId(skill?.ownerId) === raceId) {
          return true;
        }
        if (skill?.race === raceId || skill?.requiredRace === raceId) return true;
        if (Array.isArray(skill?.requiredRaces) && skill.requiredRaces.includes(raceId)) {
          return true;
        }
        if (Array.isArray(skill?.allowedRaces) && skill.allowedRaces.includes(raceId)) {
          return true;
        }
        return false;
      })
      .map((skill) => enrichSkillForCreation(skill, "race"))
      .filter(Boolean);

    raceSkillEntries.push(...raceTaggedSkills);
    raceSkillEntries.push(
      ...collectSkillEntries(race?.skills, null, skillIndex, "race"),
    );
    raceSkillEntries.push(
      ...collectSkillEntries(race?.activeSkills, "active", skillIndex, "race"),
    );
    raceSkillEntries.push(
      ...collectSkillEntries(race?.passiveSkills, "passive", skillIndex, "race"),
    );

    if (race?.passiveAbility) {
      const passiveAbilityId =
        race.passiveAbility.id || `${raceId}_passive_trait`;
      raceSkillEntries.push(
        ...normalizeAbilityEntries(
          [{ ...race.passiveAbility, id: passiveAbilityId }],
          {
            source: "race",
            defaultType: "passive",
            fallbackDescription: "Innate racial trait.",
          },
        ),
      );
    }

    if (race?.activeAbility) {
      const activeAbilityId =
        race.activeAbility.id || `${raceId}_active_trait`;
      raceSkillEntries.push(
        ...normalizeAbilityEntries(
          [{ ...race.activeAbility, id: activeAbilityId }],
          {
            source: "race",
            defaultType: "active",
            fallbackDescription: "Innate racial technique.",
          },
        ),
      );
    }

    raceSkillEntries.push(
      ...normalizeAbilityEntries(getRaceAbilitiesFor(raceId) || [], {
        source: "race",
        defaultType: "active",
      }),
    );
  }

  const racePools = splitSkillsByType(raceSkillEntries);
  const generalPools = splitSkillsByType(
    skillCatalog
      .filter((skill) => {
        const ownerType = normalizeLower(skill?.ownerType);
        return ownerType === "universal" && normalizeId(skill?.ownerId) === "universal";
      })
      .map((skill) => enrichSkillForCreation(skill, "general"))
      .filter((skill) => isGeneralSkillCompatible(skill, classId, raceId)),
  );

  return {
    active: uniqueSkills([
      ...classPools.active,
      ...racePools.active,
      ...generalPools.active,
    ]),
    passive: uniqueSkills([
      ...classPools.passive,
      ...racePools.passive,
      ...generalPools.passive,
    ]),
  };
}

export function listCharacterCreationSkillLoadouts({
  cls = null,
  race = null,
  professionId = null,
  allSkills,
  pools = null,
} = {}) {
  const resolvedPools =
    pools || buildCharacterCreationSkillPools(cls, race, { allSkills });
  if (resolvedPools.active.length === 0 || resolvedPools.passive.length === 0) {
    return [];
  }

  const limits = getCharacterCreationSkillSelectionLimits();

  return LOADOUT_TEMPLATES.map((template) => {
    const activeSkills = pickSkillsForTemplate(
      resolvedPools.active,
      limits.requiredActiveSkillCount,
      template.activeProfile,
    );
    const passiveSkills = pickSkillsForTemplate(
      resolvedPools.passive,
      limits.requiredPassiveSkillCount,
      template.passiveProfile,
    );

    if (
      activeSkills.length !== limits.requiredActiveSkillCount ||
      passiveSkills.length !== limits.requiredPassiveSkillCount
    ) {
      return null;
    }

    const activeSkillIds = activeSkills.map((skill) => skill.id);
    const passiveSkillIds = passiveSkills.map((skill) => skill.id);
    const runtimeRoleSuggestions = buildRuntimeRoleSuggestions([
      ...activeSkills,
      ...passiveSkills,
    ]);
    const professionFocusId = normalizeId(professionId);
    const preview = [
      `Actives: ${createLoadoutPreview(activeSkills)}`,
      `Passives: ${createLoadoutPreview(passiveSkills)}`,
    ].join(". ");

    return {
      id: template.id,
      name: template.name,
      description: `${template.description} ${preview}.`,
      activeSkillIds,
      passiveSkillIds,
      activeSkills,
      passiveSkills,
      professionFocusId,
      runtimeRoleSuggestions,
    };
  }).filter(Boolean);
}

export function resolveCharacterCreationSkillLoadout(loadoutId, context = {}) {
  const normalizedId = normalizeId(loadoutId);
  if (!normalizedId) return null;
  return (
    listCharacterCreationSkillLoadouts(context).find(
      (entry) => entry.id === normalizedId,
    ) || null
  );
}

export function validateCharacterCreationSkillSelections(
  {
    cls = null,
    race = null,
    professionId = null,
    activeSkillIds = [],
    passiveSkillIds = [],
    skillLoadoutId = null,
    allSkills,
  } = {},
  options = {},
) {
  const limits = getCharacterCreationSkillSelectionLimits();
  const requiredActiveSkillCount = Number.isFinite(options.requiredActiveSkillCount)
    ? options.requiredActiveSkillCount
    : limits.requiredActiveSkillCount;
  const requiredPassiveSkillCount = Number.isFinite(options.requiredPassiveSkillCount)
    ? options.requiredPassiveSkillCount
    : limits.requiredPassiveSkillCount;

  const errors = [];
  const pools = buildCharacterCreationSkillPools(cls, race, { allSkills });
  const activeMap = new Map(pools.active.map((skill) => [skill.id, skill]));
  const passiveMap = new Map(pools.passive.map((skill) => [skill.id, skill]));

  const normalizedActiveIds = normalizeIdArray(activeSkillIds);
  const normalizedPassiveIds = normalizeIdArray(passiveSkillIds);

  if (new Set(normalizedActiveIds).size !== normalizedActiveIds.length) {
    errors.push("Active skills must be unique.");
  }
  if (new Set(normalizedPassiveIds).size !== normalizedPassiveIds.length) {
    errors.push("Passive skills must be unique.");
  }

  if (normalizedActiveIds.length !== requiredActiveSkillCount) {
    errors.push(`Must select exactly ${requiredActiveSkillCount} active skills.`);
  }
  if (normalizedPassiveIds.length !== requiredPassiveSkillCount) {
    errors.push(`Must select exactly ${requiredPassiveSkillCount} passive skills.`);
  }

  const resolvedActiveSkills = normalizedActiveIds
    .map((skillId) => {
      const skill = activeMap.get(skillId);
      if (!skill) {
        errors.push(`Unknown or unavailable active skill: "${skillId}".`);
        return null;
      }
      if (getSkillSlotType(skill) !== "active") {
        errors.push(`Skill "${skillId}" cannot be assigned to an active slot.`);
        return null;
      }
      return skill;
    })
    .filter(Boolean);

  const resolvedPassiveSkills = normalizedPassiveIds
    .map((skillId) => {
      const skill = passiveMap.get(skillId);
      if (!skill) {
        errors.push(`Unknown or unavailable passive skill: "${skillId}".`);
        return null;
      }
      if (getSkillSlotType(skill) !== "passive") {
        errors.push(`Skill "${skillId}" cannot be assigned to a passive slot.`);
        return null;
      }
      return skill;
    })
    .filter(Boolean);

  const normalizedLoadoutId = normalizeId(skillLoadoutId);
  const loadout = normalizedLoadoutId
    ? resolveCharacterCreationSkillLoadout(normalizedLoadoutId, {
        cls,
        race,
        professionId,
        allSkills,
        pools,
      })
    : null;

  if (normalizedLoadoutId && !loadout) {
    errors.push(`Unknown skill loadout: "${normalizedLoadoutId}".`);
  }

  return {
    valid: errors.length === 0,
    errors,
    activeSkillIds: normalizedActiveIds,
    passiveSkillIds: normalizedPassiveIds,
    activeSkills: resolvedActiveSkills,
    passiveSkills: resolvedPassiveSkills,
    professionId: normalizeId(professionId),
    pools,
    loadout,
    loadoutSummary: getLatticeLoadoutSummary({
      activeSkills: resolvedActiveSkills,
      passiveSkills: resolvedPassiveSkills,
      professionId,
    }),
  };
}

export function buildCharacterCreationLatticeProfile({
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
  loadout = null,
  talentIds = [],
} = {}) {
  const resolvedActiveSkills = uniqueSkills(
    (Array.isArray(activeSkills) ? activeSkills : [])
      .map((entry) => resolveSkillReference(entry))
      .filter(Boolean),
  );
  const resolvedPassiveSkills = uniqueSkills(
    (Array.isArray(passiveSkills) ? passiveSkills : [])
      .map((entry) => resolveSkillReference(entry))
      .filter(Boolean),
  );
  const normalizedLoadout =
    loadout && typeof loadout === "object"
      ? {
          id: normalizeId(loadout.id),
          name: loadout.name || loadout.id,
          activeSkillIds: normalizeIdArray(loadout.activeSkillIds),
          passiveSkillIds: normalizeIdArray(loadout.passiveSkillIds),
          runtimeRoleSuggestions: Array.isArray(loadout.runtimeRoleSuggestions)
            ? loadout.runtimeRoleSuggestions.map((entry) => ({ ...entry }))
            : [],
        }
      : null;

  return {
    activeSkillIds: resolvedActiveSkills.map((skill) => skill.id),
    passiveSkillIds: resolvedPassiveSkills.map((skill) => skill.id),
    professionFocusId: normalizeId(professionId),
    runtimeRoleHints: buildRuntimeRoleSuggestions([
      ...resolvedActiveSkills,
      ...resolvedPassiveSkills,
    ]),
    loadoutSummary: getLatticeLoadoutSummary({
      activeSkills: resolvedActiveSkills,
      passiveSkills: resolvedPassiveSkills,
      professionId,
    }),
    selectedLoadout:
      normalizedLoadout && normalizedLoadout.id ? normalizedLoadout : null,
    talentMigrationLanes: normalizeIdArray(talentIds).map((talentId) => ({
      id: talentId,
      lane: getTalentMigrationLane(talentId),
    })),
  };
}
