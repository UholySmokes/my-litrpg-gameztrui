// =================================================================
// USE CHARACTER CREATION REWORKED HOOK
// Enhanced character creation with expanded skill pools
// - All compatible skills shown (class + race + general), select 3 active
// - All compatible passive skills shown, select 6
// - Talents are auto-assigned after creation based on class
// - Persistent selections across rerolls
// =================================================================

import { useState, useCallback } from "react";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { PROFESSIONS } from "../systems/profession/ProfessionRegistry.js";
import { ARCHETYPE_SYSTEMS } from "../systems/archetype/ArchetypeSystemRegistry.js";
import { getAllSkills } from "../systems/skills/SkillRegistry.js";
import {
  assignTalentsForClass,
  getTalentById,
} from "../systems/skills/TalentDefinitions.js";

import {
  CANONICAL_ATTRIBUTES,
  createAttributeBaseline,
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../constants/attributes.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { xpForNextLevel } from "../core/xpCurve.js";

const INITIAL_FREE_POINTS = 15;
const BASE_ATTRIBUTE_VALUE = 5;
const BASE_ATTRIBUTE_TOTAL = CANONICAL_ATTRIBUTES.length * BASE_ATTRIBUTE_VALUE;
const INITIAL_REROLLS = 3;
const MAX_ACTIVE_SKILLS = 3;
const MAX_PASSIVE_SKILLS = 6;
const BASE_CREATION_LEVEL = 1;

function normalizeEntityRef(value, fallback) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const id = typeof value.id === "string" && value.id ? value.id : null;
    const name = typeof value.name === "string" && value.name ? value.name : id;
    if (id) return { id, name };
    if (name) return name;
  }
  if (typeof value === "string" && value) return value;
  return fallback;
}

function dedupeSkills(skills = []) {
  const seen = new Set();
  return skills.filter((skill) => {
    const id = skill?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeSkillEntry(entry, fallbackType, skillIndex) {
  if (!entry) return null;
  if (typeof entry === "string") {
    const resolved = skillIndex?.get(entry);
    if (!resolved) return null;
    if (fallbackType && resolved.type !== fallbackType) {
      return { ...resolved, type: fallbackType };
    }
    return resolved;
  }
  if (typeof entry === "object") {
    if (!entry.id) return null;
    if (fallbackType && !entry.type) {
      return { ...entry, type: fallbackType };
    }
    return entry;
  }
  return null;
}

function collectSkillEntries(entries, fallbackType, skillIndex) {
  if (!Array.isArray(entries)) return [];
  const results = [];
  for (const entry of entries) {
    const normalized = normalizeSkillEntry(entry, fallbackType, skillIndex);
    if (normalized?.id) {
      results.push(normalized);
    }
  }
  return results;
}

function splitSkillsByType(skills = []) {
  const active = [];
  const passive = [];
  for (const skill of skills) {
    if (!skill) continue;
    if (skill.type === "passive") {
      passive.push(skill);
    } else {
      active.push(skill);
    }
  }
  return { active, passive };
}

function isGeneralSkillCompatible(skill, classId, raceId) {
  if (!skill) return false;
  if (Array.isArray(skill.allowedClasses) && skill.allowedClasses.length) {
    if (!classId || !skill.allowedClasses.includes(classId)) return false;
  }
  if (Array.isArray(skill.requiredClasses) && skill.requiredClasses.length) {
    if (!classId || !skill.requiredClasses.includes(classId)) return false;
  }
  if (typeof skill.requiredClass === "string" && skill.requiredClass) {
    if (!classId || skill.requiredClass !== classId) return false;
  }
  if (Array.isArray(skill.allowedRaces) && skill.allowedRaces.length) {
    if (!raceId || !skill.allowedRaces.includes(raceId)) return false;
  }
  if (Array.isArray(skill.requiredRaces) && skill.requiredRaces.length) {
    if (!raceId || !skill.requiredRaces.includes(raceId)) return false;
  }
  if (typeof skill.requiredRace === "string" && skill.requiredRace) {
    if (!raceId || skill.requiredRace !== raceId) return false;
  }

  const conditions = skill.unlockConditions;
  if (!conditions) return true;
  if (conditions.level && conditions.level > BASE_CREATION_LEVEL) return false;
  if (conditions.quest || conditions.item) return false;
  if (conditions.location) return false;
  if (
    Array.isArray(conditions.skillPrerequisites) &&
    conditions.skillPrerequisites.length > 0
  ) {
    return false;
  }
  return true;
}

export function useCharacterCreationReworked() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [rerollsRemaining, setRerollsRemaining] = useState(INITIAL_REROLLS);

  const STEPS = {
    IDENTITY: 1,
    RACE: 2,
    CLASS: 3,
    PROFESSION: 4,
    ARCHETYPE: 5,
    ATTRIBUTES: 6,
    SKILLS: 7,
    REVIEW: 8,
  };

  // Generated Content State
  const [generatedRaces, setGeneratedRaces] = useState(() => {
    const options = ContentGenerator.generateCharacterOptions(5);
    return options.races;
  });
  const [generatedClasses, setGeneratedClasses] = useState(() => {
    const options = ContentGenerator.generateCharacterOptions(5);
    return options.classes;
  });

  // Step 1: Identity & Origin
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedArchetypeSystem, setSelectedArchetypeSystem] = useState(null);

  // Skill Pools - Available skills to choose from
  const [availableActiveSkills, setAvailableActiveSkills] = useState([]);
  const [availablePassiveSkills, setAvailablePassiveSkills] = useState([]);

  // Selected Skills - Persistent across rerolls
  const [selectedActiveSkills, setSelectedActiveSkills] = useState([]);
  const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);

  // Step 2: Profession
  const [selectedProfession, setSelectedProfession] = useState(null);

  // Step 3: Attribute Allocation
  const [attributePoints, setAttributePoints] = useState(() =>
    createAttributeBaseline(BASE_ATTRIBUTE_VALUE),
  );

  // Initial content seeded via lazy state initializers to avoid cascading renders

  const buildSkillPools = useCallback((cls, race) => {
    if (!cls) return { active: [], passive: [] };

    let allSkills = [];
    try {
      allSkills = getAllSkills();
    } catch {
      allSkills = [];
    }

    const skillIndex = new Map(
      allSkills.filter((skill) => skill?.id).map((skill) => [skill.id, skill]),
    );

    const classEntries = Array.isArray(cls.skills)
      ? collectSkillEntries(cls.skills, null, skillIndex)
      : allSkills.filter((skill) => skill.class === cls.id);
    const classPools = splitSkillsByType(classEntries);

    const raceEntries = [];
    if (race) {
      raceEntries.push(...collectSkillEntries(race.skills, null, skillIndex));
      raceEntries.push(
        ...collectSkillEntries(race.activeSkills, "active", skillIndex),
      );
      raceEntries.push(
        ...collectSkillEntries(race.passiveSkills, "passive", skillIndex),
      );
      if (race.passiveAbility) {
        const passiveTraitId =
          race.passiveAbility.id || `${race.id || "race"}_passive_trait`;
        raceEntries.push({
          ...race.passiveAbility,
          id: passiveTraitId,
          name: race.passiveAbility.name || "Racial Trait",
          description:
            race.passiveAbility.description || "Innate racial trait.",
          type: "passive",
          source: "race",
        });
      }
      if (race.activeAbility) {
        const activeTraitId =
          race.activeAbility.id || `${race.id || "race"}_active_trait`;
        raceEntries.push({
          ...race.activeAbility,
          id: activeTraitId,
          name: race.activeAbility.name || "Racial Technique",
          description:
            race.activeAbility.description || "Innate racial technique.",
          type: "active",
          source: "race",
        });
      }
    }
    const racePools = splitSkillsByType(raceEntries);

    const generalEntries = allSkills.filter(
      (skill) => skill.class === "universal" || skill.class === "general",
    );
    const generalPools = splitSkillsByType(
      generalEntries.filter((skill) =>
        isGeneralSkillCompatible(skill, cls?.id, race?.id),
      ),
    );

    return {
      active: dedupeSkills([
        ...classPools.active,
        ...racePools.active,
        ...generalPools.active,
      ]),
      passive: dedupeSkills([
        ...classPools.passive,
        ...racePools.passive,
        ...generalPools.passive,
      ]),
    };
  }, []);

  // Generate skill pools for the selected class + race
  const generateSkillPools = useCallback(
    (cls, race) => {
      const pools = buildSkillPools(cls, race);
      setAvailableActiveSkills(pools.active);
      setAvailablePassiveSkills(pools.passive);
      setSelectedActiveSkills((prev) =>
        prev.filter((skill) => pools.active.some((s) => s.id === skill.id)),
      );
      setSelectedPassiveSkills((prev) =>
        prev.filter((skill) => pools.passive.some((s) => s.id === skill.id)),
      );
    },
    [buildSkillPools],
  );

  // Regenerate races
  const regenerateRaces = useCallback(() => {
    const options = ContentGenerator.generateCharacterOptions(5);
    setGeneratedRaces(options.races);
    setSelectedRace(null);
    if (selectedClass) {
      generateSkillPools(selectedClass, null);
    }
  }, [generateSkillPools, selectedClass]);

  // Regenerate classes
  const regenerateClasses = useCallback(() => {
    const options = ContentGenerator.generateCharacterOptions(5);
    setGeneratedClasses(options.classes);
    setSelectedClass(null);
    setSelectedActiveSkills([]);
    setSelectedPassiveSkills([]);
    setAvailableActiveSkills([]);
    setAvailablePassiveSkills([]);
  }, []);

  const handleReroll = useCallback(() => {
    if (rerollsRemaining <= 0) return;

    setRerollsRemaining((prev) => Math.max(0, prev - 1));

    const options = ContentGenerator.generateCharacterOptions(5);
    setGeneratedRaces(options.races);
    setGeneratedClasses(options.classes);

    setCurrentStep(1);
    setShowBootSequence(false);
    setName("");
    setGender("");
    setSelectedRace(null);
    setSelectedClass(null);
    setSelectedArchetypeSystem(null);
    setSelectedProfession(null);
    setSelectedActiveSkills([]);
    setSelectedPassiveSkills([]);
    setAvailableActiveSkills([]);
    setAvailablePassiveSkills([]);
    setAttributePoints(createAttributeBaseline(BASE_ATTRIBUTE_VALUE));
  }, [rerollsRemaining]);

  // Calculate remaining points
  const totalAllocated = Object.values(attributePoints).reduce(
    (sum, val) => sum + val,
    0,
  );
  const remainingPoints =
    INITIAL_FREE_POINTS - (totalAllocated - BASE_ATTRIBUTE_TOTAL);

  // Handle race selection
  const handleRaceSelect = useCallback(
    (race) => {
      setSelectedRace(race);
      if (selectedClass) {
        generateSkillPools(selectedClass, race);
      }
    },
    [generateSkillPools, selectedClass],
  );

  // Handle class selection
  const handleClassSelect = useCallback(
    (cls) => {
      setSelectedClass(cls);
      setSelectedActiveSkills([]);
      setSelectedPassiveSkills([]);
      generateSkillPools(cls, selectedRace);
    },
    [generateSkillPools, selectedRace],
  );

  // Handle profession selection
  const handleProfessionSelect = useCallback((profId) => {
    setSelectedProfession(PROFESSIONS[profId]);
  }, []);

  const handleArchetypeSystemSelect = useCallback((systemId) => {
    const system =
      ARCHETYPE_SYSTEMS.find((entry) => entry.id === systemId) || null;
    setSelectedArchetypeSystem((prev) =>
      prev?.id === system?.id ? null : system,
    );
  }, []);

  // Handle active skill selection (toggle, max 3)
  const handleActiveSkillSelect = useCallback((skill) => {
    if (!skill) return;

    setSelectedActiveSkills((prev) => {
      const exists = prev.find((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      } else {
        if (prev.length >= MAX_ACTIVE_SKILLS) return prev;
        return [...prev, skill];
      }
    });
  }, []);

  // Handle passive skill selection (toggle, max 6)
  const handlePassiveSkillToggle = useCallback((skill) => {
    if (!skill) return;

    setSelectedPassiveSkills((prev) => {
      const exists = prev.find((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      } else {
        if (prev.length >= MAX_PASSIVE_SKILLS) return prev;
        return [...prev, skill];
      }
    });
  }, []);

  // Check if skill is selected
  const isSkillSelected = useCallback(
    (skillId, type) => {
      if (type === "active") {
        return !!selectedActiveSkills.find((s) => s.id === skillId);
      }
      return !!selectedPassiveSkills.find((s) => s.id === skillId);
    },
    [selectedActiveSkills, selectedPassiveSkills],
  );

  // Get available skills for display
  const getAvailableActiveSkills = useCallback(() => {
    return availableActiveSkills;
  }, [availableActiveSkills]);

  const getAvailablePassiveSkills = useCallback(() => {
    return availablePassiveSkills;
  }, [availablePassiveSkills]);

  // Handle attribute allocation
  const allocateAttributePoint = useCallback((attribute) => {
    const canonicalKey = toCanonicalAttributeKey(attribute);
    if (!canonicalKey) return;
    setAttributePoints((prev) => {
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      const currentRemaining =
        INITIAL_FREE_POINTS - (currentTotal - BASE_ATTRIBUTE_TOTAL);
      if (currentRemaining <= 0) return prev;
      return {
        ...prev,
        [canonicalKey]: (prev[canonicalKey] ?? BASE_ATTRIBUTE_VALUE) + 1,
      };
    });
  }, []);

  const deallocateAttributePoint = useCallback((attribute) => {
    const canonicalKey = toCanonicalAttributeKey(attribute);
    if (!canonicalKey) return;
    setAttributePoints((prev) => {
      const currentValue = prev[canonicalKey] ?? BASE_ATTRIBUTE_VALUE;
      if (currentValue <= BASE_ATTRIBUTE_VALUE) return prev;
      return { ...prev, [canonicalKey]: currentValue - 1 };
    });
  }, []);

  const validateIdentity = useCallback(() => {
    if (!name.trim()) return { valid: false, error: "Name is required" };
    if (!gender) return { valid: false, error: "Gender is required" };
    return { valid: true };
  }, [name, gender]);

  const validateRace = useCallback(() => {
    if (!selectedRace) return { valid: false, error: "Race is required" };
    return { valid: true };
  }, [selectedRace]);

  const validateClass = useCallback(() => {
    if (!selectedClass) return { valid: false, error: "Class is required" };
    return { valid: true };
  }, [selectedClass]);

  const validateProfession = useCallback(() => {
    if (!selectedProfession)
      return { valid: false, error: "Profession is required" };
    return { valid: true };
  }, [selectedProfession]);

  const validateArchetype = useCallback(() => {
    if (!selectedArchetypeSystem)
      return { valid: false, error: "System selection is required" };
    return { valid: true };
  }, [selectedArchetypeSystem]);

  const validateAttributes = useCallback(() => {
    if (remainingPoints !== 0) {
      return {
        valid: false,
        error: `Must allocate all ${INITIAL_FREE_POINTS} attribute points`,
      };
    }
    return { valid: true };
  }, [remainingPoints]);

  const validateSkills = useCallback(() => {
    if (selectedActiveSkills.length !== MAX_ACTIVE_SKILLS) {
      return {
        valid: false,
        error: `Must select exactly ${MAX_ACTIVE_SKILLS} active skills`,
      };
    }
    if (selectedPassiveSkills.length !== MAX_PASSIVE_SKILLS) {
      return {
        valid: false,
        error: `Must select exactly ${MAX_PASSIVE_SKILLS} passive skills`,
      };
    }
    return { valid: true };
  }, [selectedActiveSkills, selectedPassiveSkills]);

  const validateReview = useCallback(() => {
    const checks = [
      validateIdentity,
      validateRace,
      validateClass,
      validateProfession,
      validateArchetype,
      validateAttributes,
      validateSkills,
    ];
    for (const check of checks) {
      const result = check();
      if (!result.valid) return result;
    }
    return { valid: true };
  }, [
    validateArchetype,
    validateAttributes,
    validateClass,
    validateIdentity,
    validateProfession,
    validateRace,
    validateSkills,
  ]);

  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case STEPS.IDENTITY:
        return validateIdentity();
      case STEPS.RACE:
        return validateRace();
      case STEPS.CLASS:
        return validateClass();
      case STEPS.PROFESSION:
        return validateProfession();
      case STEPS.ARCHETYPE:
        return validateArchetype();
      case STEPS.ATTRIBUTES:
        return validateAttributes();
      case STEPS.SKILLS:
        return validateSkills();
      case STEPS.REVIEW:
      default:
        return validateReview();
    }
  }, [
    STEPS.ARCHETYPE,
    STEPS.ATTRIBUTES,
    STEPS.CLASS,
    STEPS.IDENTITY,
    STEPS.PROFESSION,
    STEPS.RACE,
    STEPS.REVIEW,
    STEPS.SKILLS,
    currentStep,
    validateArchetype,
    validateAttributes,
    validateClass,
    validateIdentity,
    validateProfession,
    validateRace,
    validateReview,
    validateSkills,
  ]);

  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation.valid) return validation;
    setCurrentStep((prev) => Math.min(STEPS.REVIEW, prev + 1));
    return { valid: true };
  }, [STEPS.REVIEW, validateCurrentStep]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(STEPS.IDENTITY, prev - 1));
  }, [STEPS.IDENTITY]);

  // Finalize character
  const finalizeCharacter = useCallback(() => {
    const validation = validateReview();
    if (!validation.valid) return validation;

    // Apply race stat bonuses
    const finalStats = ensureAttributeShape(
      attributePoints,
      BASE_ATTRIBUTE_VALUE,
    );
    const bonuses = selectedRace.modifiers || selectedRace.statBonuses || {};
    for (const [stat, bonus] of Object.entries(bonuses)) {
      const canonicalKey = toCanonicalAttributeKey(stat);
      if (!canonicalKey) continue;
      finalStats[canonicalKey] =
        (finalStats[canonicalKey] ?? BASE_ATTRIBUTE_VALUE) + bonus;
    }

    // Add profession skills at tier 1
    const professionSkills = [];
    if (
      selectedProfession &&
      selectedProfession.tierUnlocks &&
      selectedProfession.tierUnlocks[1]
    ) {
      const tier1Skills = selectedProfession.tierUnlocks[1].skills || [];
      professionSkills.push(
        ...tier1Skills.map((skillId) => ({
          id: skillId,
          name: skillId
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          type: "profession",
          description: `${selectedProfession.name} skill`,
          profession: selectedProfession.id,
        })),
      );
    }

    // Combine all abilities
    const allAbilities = [
      ...selectedActiveSkills,
      ...selectedPassiveSkills,
      ...professionSkills,
    ];

    // Calculate derived stats (HP/Mana)
    const baseHp = calculateMaxHp(finalStats);
    const baseMana = calculateMaxMana(finalStats);

    const professionId = selectedProfession?.id || null;
    const professionName = selectedProfession?.name || null;
    const startingGold = 100;
    const startingSoulpoints = 0;
    const classId =
      typeof selectedClass === "string" ? selectedClass : selectedClass?.id;
    const assignedTalentIds = classId ? assignTalentsForClass(classId) : [];
    const assignedTalentNames = assignedTalentIds
      .map((id) => getTalentById(id)?.name || id)
      .filter(Boolean);
    const talentLabel = assignedTalentNames.length
      ? assignedTalentNames.join(", ")
      : "None";
    const resourceSystem =
      selectedClass?.resourceSystem || selectedClass?.resource || null;
    const initialResources = {
      rage: resourceSystem === "rage" ? 100 : 0,
      chi: resourceSystem === "chi" ? 100 : 0,
      focus: resourceSystem === "focus" ? 100 : 0,
      stealth: resourceSystem === "stealth" ? 100 : 0,
      energy: resourceSystem === "energy" ? 100 : 0,
    };

    const characterData = {
      name: name.trim(),
      gender,
      race: normalizeEntityRef(selectedRace, "Unknown"),
      class: normalizeEntityRef(selectedClass, "None"),
      archetypeSystem: selectedArchetypeSystem
        ? {
            id: selectedArchetypeSystem.id,
            name: selectedArchetypeSystem.name,
            category: selectedArchetypeSystem.category,
            summary: selectedArchetypeSystem.summary,
            description: selectedArchetypeSystem.description,
          }
        : null,
      talent: talentLabel,
      talents: assignedTalentIds,
      activeSkills: selectedActiveSkills,
      passiveSkills: selectedPassiveSkills,
      profession: professionId
        ? { id: professionId, name: professionName }
        : null,
      professionSkills,
      abilities: allAbilities,
      attributes: {
        ...finalStats,
        freePoints: 0, // All points allocated during creation
      },
      level: 1,
      xp: {
        current: 0,
        max: xpForNextLevel(1),
      },
      hp: {
        current: baseHp,
        max: baseHp,
      },
      mana: {
        current: baseMana,
        max: baseMana,
      },
      resources: initialResources,
      gold: startingGold,
      soulpoints: startingSoulpoints,
      currency: {
        goldCoins: startingGold,
        soulpoints: startingSoulpoints,
      },
      professions: professionId
        ? {
            [professionId]: {
              xp: 0,
            },
          }
        : {},
      inventory: [], // Empty starting inventory
      equipment: {}, // Empty starting equipment
    };

    return { valid: true, characterData };
  }, [
    validateReview,
    attributePoints,
    name,
    gender,
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedProfession,
  ]);

  // Skip boot sequence
  const skipBootSequence = useCallback(() => {
    setShowBootSequence(false);
  }, []);

  return {
    // State
    currentStep,
    steps: STEPS,
    showBootSequence,
    name,
    characterName: name,
    gender,
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedProfession,
    attributePoints,
    remainingPoints,
    generatedRaces,
    generatedClasses,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems: ARCHETYPE_SYSTEMS,
    rerollsRemaining,

    // Setters
    setName,
    setGender,

    // Actions
    regenerateRaces,
    regenerateClasses,
    handleRaceSelect,
    handleClassSelect,
    handleArchetypeSystemSelect,
    handleProfessionSelect,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    allocateAttributePoint,
    deallocateAttributePoint,
    nextStep,
    previousStep,
    finalizeCharacter,
    skipBootSequence,

    validateCurrentStep,
    validateReview,

    // Helpers
    getAvailableActiveSkills,
    getAvailablePassiveSkills,
    isSkillSelected,

    // Constants
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  };
}
