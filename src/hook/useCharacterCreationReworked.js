// =================================================================
// USE CHARACTER CREATION REWORKED HOOK
// Enhanced character creation with expanded skill pools
// - All compatible skills shown (class + race + general), select 3 active
// - All compatible passive skills shown, select 6
// - Talents are auto-assigned after creation based on class
// - Persistent selections across rerolls
// =================================================================

import { useState, useCallback, useMemo } from "react";
import { PROFESSIONS } from "../systems/profession/ProfessionRegistry.js";
import { ARCHETYPE_SYSTEMS } from "../systems/archetype/ArchetypeSystemRegistry.js";
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
import { buildCreationStepSequence } from "../core/characterCreationWizardFlow.js";
import { xpForNextLevel } from "../core/xpCurve.js";
import {
  buildCharacterCreationLatticeProfile,
  buildCharacterCreationSkillPools as buildSharedCharacterCreationSkillPools,
  createCharacterCreationBlueprint,
  createCharacterCreationOutcome,
  getCharacterCreationSkillSelectionLimits,
  getSkillById,
  getCharacterCreationPerkLimits,
  listCharacterCreationAlignments,
  listCharacterCreationPerks,
  listCharacterCreationSkillLoadouts,
  listCharacterCreationStarterTrees,
  resolveCharacterCreationSkillLoadout,
  validateCharacterCreationSkillSelections,
  validateCharacterCreationBlueprint,
} from "@voidverse/game-core";

const INITIAL_FREE_POINTS = 15;
const BASE_ATTRIBUTE_VALUE = 5;
const BASE_ATTRIBUTE_TOTAL = CANONICAL_ATTRIBUTES.length * BASE_ATTRIBUTE_VALUE;
const INITIAL_REROLLS = 3;
const {
  requiredActiveSkillCount: MAX_ACTIVE_SKILLS,
  requiredPassiveSkillCount: MAX_PASSIVE_SKILLS,
} = getCharacterCreationSkillSelectionLimits();
const CREATION_STEPS = Object.freeze({
  IDENTITY: 1,
  RACE: 2,
  CLASS: 3,
  MULTICLASS: 4,
  PROFESSION: 5,
  ARCHETYPE: 6,
  ATTRIBUTES: 7,
  SKILLS: 8,
  PERKS: 9,
  STARTER_TREE: 10,
  ALIGNMENT: 11,
  REVIEW: 12,
});

function humanizeSkillId(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

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

function cloneOrigin(origin) {
  if (!origin || typeof origin !== "object" || Array.isArray(origin)) return null;
  return {
    ...origin,
    attributeBonuses:
      origin.attributeBonuses && typeof origin.attributeBonuses === "object"
        ? { ...origin.attributeBonuses }
        : {},
    favoredQuestTags: Array.isArray(origin.favoredQuestTags)
      ? [...origin.favoredQuestTags]
      : [],
  };
}

function getAttributeBonuses(entity, preferredKey = "attributeBonuses") {
  return ensureAttributeShape(
    entity?.[preferredKey] ||
      entity?.statBonuses ||
      entity?.modifiers ||
      entity?.baseStats ||
      {},
    0,
  );
}

export function buildCharacterCreationAttributes({
  attributePoints,
  selectedRace,
  selectedClass,
  selectedOrigin,
} = {}) {
  const baseAttributes = ensureAttributeShape(attributePoints, BASE_ATTRIBUTE_VALUE);
  const raceBonuses = getAttributeBonuses(selectedRace);
  const classBonuses = getAttributeBonuses(selectedClass, "baseStats");
  const originBonuses = getAttributeBonuses(selectedOrigin);

  return CANONICAL_ATTRIBUTES.reduce((acc, key) => {
    acc[key] =
      (baseAttributes[key] ?? BASE_ATTRIBUTE_VALUE) +
      (raceBonuses[key] ?? 0) +
      (classBonuses[key] ?? 0) +
      (originBonuses[key] ?? 0);
    return acc;
  }, createAttributeBaseline(0));
}

export function buildCharacterCreationDerivedState({
  attributePoints,
  selectedRace,
  selectedClass,
  selectedOrigin,
} = {}) {
  const attributes = buildCharacterCreationAttributes({
    attributePoints,
    selectedRace,
    selectedClass,
    selectedOrigin,
  });
  const resourceSystem =
    selectedClass?.resourceSystem || selectedClass?.resource || null;
  const hpMax = calculateMaxHp(attributes);
  const manaMax = calculateMaxMana(attributes);

  return {
    attributes,
    hp: {
      current: hpMax,
      max: hpMax,
    },
    mana: {
      current: manaMax,
      max: manaMax,
    },
    resources: {
      rage: resourceSystem === "rage" ? 100 : 0,
      chi: resourceSystem === "chi" ? 100 : 0,
      focus: resourceSystem === "focus" ? 100 : 0,
      stealth: resourceSystem === "stealth" ? 100 : 0,
      energy: resourceSystem === "energy" ? 100 : 0,
    },
  };
}

export function buildCharacterCreationSkillPools(cls, race, { allSkills } = {}) {
  return buildSharedCharacterCreationSkillPools(cls, race, { allSkills });
}

export function useCharacterCreationReworked({ advancedUnlocked = false } = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [rerollsRemaining, setRerollsRemaining] = useState(INITIAL_REROLLS);

  const STEPS = CREATION_STEPS;
  const stepSequence = useMemo(
    () => buildCreationStepSequence(STEPS, advancedUnlocked).map((entry) => entry.step),
    [STEPS, advancedUnlocked],
  );

  // Step 1: Identity & Origin
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSecondaryClass, setSelectedSecondaryClass] = useState(null);
  const [selectedArchetypeSystem, setSelectedArchetypeSystem] = useState(null);
  const [selectedPerkIds, setSelectedPerkIds] = useState([]);
  const [selectedStarterTreeIds, setSelectedStarterTreeIds] = useState([]);
  const [selectedAlignmentId, setSelectedAlignmentId] = useState(null);
  const [selectedSkillLoadoutId, setSelectedSkillLoadoutId] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState(null);

  const creationPerkLimits = getCharacterCreationPerkLimits();
  const availableCreationPerks = listCharacterCreationPerks();
  const availableCreationAlignments = listCharacterCreationAlignments();
  const availableCreationStarterTrees = listCharacterCreationStarterTrees();
  const availableCreationSkillLoadouts = useMemo(
    () =>
      listCharacterCreationSkillLoadouts({
        cls: selectedClass,
        race: selectedRace,
        professionId: selectedProfession?.id || null,
      }),
    [selectedClass, selectedProfession?.id, selectedRace],
  );

  // Skill Pools - Available skills to choose from
  const [availableActiveSkills, setAvailableActiveSkills] = useState([]);
  const [availablePassiveSkills, setAvailablePassiveSkills] = useState([]);

  // Selected Skills - Persistent across rerolls
  const [selectedActiveSkills, setSelectedActiveSkills] = useState([]);
  const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);

  // Step 3: Attribute Allocation
  const [attributePoints, setAttributePoints] = useState(() =>
    createAttributeBaseline(BASE_ATTRIBUTE_VALUE),
  );

  // Initial content seeded via lazy state initializers to avoid cascading renders

  const buildSkillPools = useCallback((cls, race) => {
    return buildCharacterCreationSkillPools(cls, race);
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

  const resolveSelectedSkillValidation = useCallback(() => {
    return validateCharacterCreationSkillSelections(
      {
        cls: selectedClass,
        race: selectedRace,
        professionId: selectedProfession?.id || null,
        activeSkillIds: selectedActiveSkills.map((skill) => skill.id),
        passiveSkillIds: selectedPassiveSkills.map((skill) => skill.id),
        skillLoadoutId: selectedSkillLoadoutId,
      },
      {
        requiredActiveSkillCount: MAX_ACTIVE_SKILLS,
        requiredPassiveSkillCount: MAX_PASSIVE_SKILLS,
      },
    );
  }, [
    selectedClass,
    selectedRace,
    selectedProfession?.id,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedSkillLoadoutId,
  ]);

  const handleReroll = useCallback(() => {
    if (rerollsRemaining <= 0) return;

    setRerollsRemaining((prev) => Math.max(0, prev - 1));

    setCurrentStep(1);
    setShowBootSequence(false);
    setName("");
    setGender("");
    setSelectedOrigin(null);
    setSelectedRace(null);
    setSelectedClass(null);
    setSelectedSecondaryClass(null);
    setSelectedArchetypeSystem(null);
    setSelectedProfession(null);
    setSelectedPerkIds([]);
    setSelectedStarterTreeIds([]);
    setSelectedAlignmentId(null);
    setSelectedSkillLoadoutId(null);
    setSelectedActiveSkills([]);
    setSelectedPassiveSkills([]);
    setAvailableActiveSkills([]);
    setAvailablePassiveSkills([]);
    setAttributePoints(createAttributeBaseline(BASE_ATTRIBUTE_VALUE));
  }, [rerollsRemaining]);

  const handleOriginSelect = useCallback((origin) => {
    setSelectedOrigin(origin ? cloneOrigin(origin) : null);
  }, []);

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
      setSelectedSkillLoadoutId(null);
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
      setSelectedSecondaryClass((prev) =>
        prev?.id && prev.id === cls?.id ? null : prev,
      );
      setSelectedSkillLoadoutId(null);
      setSelectedActiveSkills([]);
      setSelectedPassiveSkills([]);
      generateSkillPools(cls, selectedRace);
    },
    [generateSkillPools, selectedRace],
  );

  // Handle profession selection
  const handleProfessionSelect = useCallback((profId) => {
    setSelectedProfession(PROFESSIONS[profId]);
    setSelectedSkillLoadoutId(null);
  }, []);

  const handleArchetypeSystemSelect = useCallback((systemId) => {
    const system =
      ARCHETYPE_SYSTEMS.find((entry) => entry.id === systemId) || null;
    setSelectedArchetypeSystem((prev) =>
      prev?.id === system?.id ? null : system,
    );
  }, []);

  const handleSecondaryClassSelect = useCallback((classRef) => {
    setSelectedSecondaryClass(classRef || null);
  }, []);

  const handlePerkToggle = useCallback((perkId) => {
    const normalizedId = typeof perkId === "string" ? perkId.trim() : "";
    if (!normalizedId) return;
    setSelectedPerkIds((prev) => {
      if (prev.includes(normalizedId)) {
        return prev.filter((entry) => entry !== normalizedId);
      }
      if (prev.length >= (creationPerkLimits.maxPicks || 0)) return prev;
      return [...prev, normalizedId];
    });
  }, [creationPerkLimits.maxPicks]);

  const handleStarterTreeSelect = useCallback((treeId) => {
    const normalizedId = typeof treeId === "string" ? treeId.trim() : "";
    if (!normalizedId) return;
    setSelectedStarterTreeIds([normalizedId]);
  }, []);

  const handleAlignmentSelect = useCallback((alignmentId) => {
    const normalizedId = typeof alignmentId === "string" ? alignmentId.trim() : "";
    setSelectedAlignmentId(normalizedId || null);
  }, []);

  const handleSkillLoadoutSelect = useCallback((loadoutId) => {
    const normalizedId = typeof loadoutId === "string" ? loadoutId.trim() : "";
    if (!normalizedId) {
      setSelectedSkillLoadoutId(null);
      return;
    }

    const resolvedLoadout = resolveCharacterCreationSkillLoadout(normalizedId, {
      cls: selectedClass,
      race: selectedRace,
      professionId: selectedProfession?.id || null,
    });

    if (!resolvedLoadout) {
      setSelectedSkillLoadoutId(null);
      return;
    }

    setSelectedSkillLoadoutId(resolvedLoadout.id);
    setSelectedActiveSkills(resolvedLoadout.activeSkills);
    setSelectedPassiveSkills(resolvedLoadout.passiveSkills);
  }, [selectedClass, selectedProfession?.id, selectedRace]);

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
    if (!selectedOrigin) return { valid: false, error: "Origin is required" };
    return { valid: true };
  }, [name, selectedOrigin]);

  const validateRace = useCallback(() => {
    if (!selectedRace) return { valid: false, error: "Race is required" };
    return { valid: true };
  }, [selectedRace]);

  const validateClass = useCallback(() => {
    if (!selectedClass) return { valid: false, error: "Class is required" };
    return { valid: true };
  }, [selectedClass]);

  const validateMulticlass = useCallback(() => {
    return { valid: true };
  }, []);

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
    const selectionValidation = resolveSelectedSkillValidation();
    if (!selectionValidation.valid) {
      return {
        valid: false,
        error: selectionValidation.errors[0],
        errors: selectionValidation.errors,
      };
    }
    return { valid: true, selection: selectionValidation };
  }, [resolveSelectedSkillValidation]);

  const validatePerks = useCallback(() => {
    const min = creationPerkLimits.minPicks || 0;
    const max = creationPerkLimits.maxPicks || Number.MAX_SAFE_INTEGER;
    if (selectedPerkIds.length < min) {
      return { valid: false, error: `Must select at least ${min} perks` };
    }
    if (selectedPerkIds.length > max) {
      return { valid: false, error: `Must select no more than ${max} perks` };
    }
    return { valid: true };
  }, [creationPerkLimits.maxPicks, creationPerkLimits.minPicks, selectedPerkIds.length]);

  const validateStarterTree = useCallback(() => {
    if (availableCreationStarterTrees.length > 0 && selectedStarterTreeIds.length < 1) {
      return { valid: false, error: "Starter tree selection is required" };
    }
    return { valid: true };
  }, [availableCreationStarterTrees.length, selectedStarterTreeIds.length]);

  const validateAlignment = useCallback(() => {
    if (!selectedAlignmentId) return { valid: false, error: "Alignment is required" };
    return { valid: true };
  }, [selectedAlignmentId]);

  const validateReview = useCallback(() => {
    const checks = [
      validateIdentity,
      validateRace,
      validateClass,
      ...(advancedUnlocked ? [validateMulticlass] : []),
      validateProfession,
      validateArchetype,
      validateAttributes,
      validateSkills,
      validatePerks,
      ...(advancedUnlocked ? [validateStarterTree] : []),
      validateAlignment,
    ];
    for (const check of checks) {
      const result = check();
      if (!result.valid) return result;
    }

    const blueprintValidation = validateCharacterCreationBlueprint(
      {
        name,
        gender,
        raceId: selectedRace?.id,
        classId: selectedClass?.id,
        originId: selectedOrigin?.id,
        professionId: selectedProfession?.id,
        archetypeSystemId: selectedArchetypeSystem?.id,
        attributes: buildCharacterCreationAttributes({
          attributePoints,
          selectedRace,
          selectedClass,
          selectedOrigin,
        }),
        activeSkillIds: selectedActiveSkills.map((skill) => skill.id),
        passiveSkillIds: selectedPassiveSkills.map((skill) => skill.id),
        secondaryClassId: advancedUnlocked ? selectedSecondaryClass?.id : null,
        skillLoadoutId: selectedSkillLoadoutId,
        perkIds: selectedPerkIds,
        starterTreeIds: advancedUnlocked ? selectedStarterTreeIds : [],
        alignmentId: selectedAlignmentId,
      },
      {
        requiredActiveSkillCount: MAX_ACTIVE_SKILLS,
        requiredPassiveSkillCount: MAX_PASSIVE_SKILLS,
        minPerks: creationPerkLimits.minPicks,
        maxPerks: creationPerkLimits.maxPicks,
        requiresStarterTree:
          advancedUnlocked && availableCreationStarterTrees.length > 0,
      },
    );
    if (!blueprintValidation.valid) {
      return {
        valid: false,
        error: blueprintValidation.errors[0],
        errors: blueprintValidation.errors,
      };
    }

    return { valid: true };
  }, [
    advancedUnlocked,
    attributePoints,
    gender,
    name,
    selectedActiveSkills,
    selectedAlignmentId,
    validateArchetype,
    validateAttributes,
    validateAlignment,
    validateClass,
    validateIdentity,
    validateMulticlass,
    validatePerks,
    selectedArchetypeSystem,
    selectedClass,
    selectedSecondaryClass,
    selectedOrigin,
    selectedPassiveSkills,
    selectedPerkIds,
    selectedProfession,
    selectedRace,
    selectedSkillLoadoutId,
    selectedStarterTreeIds,
    validateStarterTree,
    validateProfession,
    validateRace,
    validateSkills,
    availableCreationStarterTrees.length,
    creationPerkLimits.maxPicks,
    creationPerkLimits.minPicks,
  ]);

  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case STEPS.IDENTITY:
        return validateIdentity();
      case STEPS.RACE:
        return validateRace();
      case STEPS.CLASS:
        return validateClass();
      case STEPS.MULTICLASS:
        return validateMulticlass();
      case STEPS.PROFESSION:
        return validateProfession();
      case STEPS.ARCHETYPE:
        return validateArchetype();
      case STEPS.ATTRIBUTES:
        return validateAttributes();
      case STEPS.SKILLS:
        return validateSkills();
      case STEPS.PERKS:
        return validatePerks();
      case STEPS.STARTER_TREE:
        return validateStarterTree();
      case STEPS.ALIGNMENT:
        return validateAlignment();
      case STEPS.REVIEW:
      default:
        return validateReview();
    }
  }, [
    STEPS.ARCHETYPE,
    STEPS.ATTRIBUTES,
    STEPS.CLASS,
    STEPS.MULTICLASS,
    STEPS.IDENTITY,
    STEPS.ALIGNMENT,
    STEPS.PERKS,
    STEPS.PROFESSION,
    STEPS.RACE,
    STEPS.REVIEW,
    STEPS.SKILLS,
    STEPS.STARTER_TREE,
    currentStep,
    validateAlignment,
    validateArchetype,
    validateAttributes,
    validateClass,
    validateIdentity,
    validateMulticlass,
    validatePerks,
    validateProfession,
    validateRace,
    validateReview,
    validateSkills,
    validateStarterTree,
  ]);

  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation.valid) return validation;
    setCurrentStep((prev) => {
      const currentIndex = stepSequence.indexOf(prev);
      if (currentIndex < 0) return stepSequence[0] || STEPS.IDENTITY;
      return stepSequence[Math.min(stepSequence.length - 1, currentIndex + 1)];
    });
    return { valid: true };
  }, [STEPS.IDENTITY, stepSequence, validateCurrentStep]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      const currentIndex = stepSequence.indexOf(prev);
      if (currentIndex <= 0) return stepSequence[0] || STEPS.IDENTITY;
      return stepSequence[currentIndex - 1];
    });
  }, [STEPS.IDENTITY, stepSequence]);

  // Finalize character
  const finalizeCharacter = useCallback(() => {
    const validation = validateReview();
    if (!validation.valid) return validation;
    const selectionValidation = resolveSelectedSkillValidation();
    if (!selectionValidation.valid) {
      return {
        valid: false,
        error: selectionValidation.errors[0],
        errors: selectionValidation.errors,
      };
    }

    const derivedState = buildCharacterCreationDerivedState({
      attributePoints,
      selectedRace,
      selectedClass,
      selectedOrigin,
    });

    // Add profession skills at tier 1
    const professionSkills = [];
    if (
      selectedProfession &&
      selectedProfession.tierUnlocks &&
      selectedProfession.tierUnlocks[1]
    ) {
      const tier1Skills = selectedProfession.tierUnlocks[1].skills || [];
      professionSkills.push(
        ...tier1Skills.map((skillId) => {
          const existingSkill = getSkillById(skillId);
          if (existingSkill) return existingSkill;
          return {
            id: skillId,
            name: humanizeSkillId(skillId),
            type: "profession",
            description: `${selectedProfession.name} skill`,
            profession: selectedProfession.id,
          };
        }),
      );
    }

    // Combine all abilities
    const allAbilities = [
      ...selectionValidation.activeSkills,
      ...selectionValidation.passiveSkills,
      ...professionSkills,
    ];

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
    const latticeProfile = buildCharacterCreationLatticeProfile({
      activeSkills: selectionValidation.activeSkills,
      passiveSkills: selectionValidation.passiveSkills,
      professionId,
      loadout: selectionValidation.loadout,
      talentIds: assignedTalentIds,
    });
    const blueprint = createCharacterCreationBlueprint({
      name: name.trim(),
      gender,
      raceId: selectedRace?.id,
      classId: selectedClass?.id,
      secondaryClassId:
        advancedUnlocked ? selectedSecondaryClass?.id || null : null,
      originId: selectedOrigin?.id,
      professionId,
      archetypeSystemId: selectedArchetypeSystem?.id,
      attributes: derivedState.attributes,
      skillLoadoutId: selectedSkillLoadoutId,
      activeSkillIds: selectionValidation.activeSkillIds,
      passiveSkillIds: selectionValidation.passiveSkillIds,
      perkIds: selectedPerkIds,
      starterTreeIds: advancedUnlocked ? selectedStarterTreeIds : [],
      alignmentId: selectedAlignmentId,
    });

    const characterData = {
      name: name.trim(),
      gender: gender || null,
      race: normalizeEntityRef(selectedRace, "Unknown"),
      class: normalizeEntityRef(selectedClass, "None"),
      secondaryClass: advancedUnlocked
        ? normalizeEntityRef(selectedSecondaryClass, "None")
        : null,
      origin: cloneOrigin(selectedOrigin),
      alignment: selectedAlignmentId,
      perks: selectedPerkIds,
      starterTrees: advancedUnlocked ? selectedStarterTreeIds : [],
      skillLoadoutId: selectedSkillLoadoutId,
      characterCreationBlueprint: blueprint,
      latticeProfile,
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
      talentMigrationLanes: latticeProfile.talentMigrationLanes,
      activeSkills: selectionValidation.activeSkills,
      passiveSkills: selectionValidation.passiveSkills,
      profession: professionId
        ? { id: professionId, name: professionName }
        : null,
      professionSkills,
      abilities: allAbilities,
      attributes: {
        ...derivedState.attributes,
        freePoints: 0, // All points allocated during creation
      },
      level: 1,
      xp: {
        current: 0,
        max: xpForNextLevel(1),
      },
      hp: derivedState.hp,
      mana: derivedState.mana,
      resources: derivedState.resources,
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

    const creationOutcome = createCharacterCreationOutcome({
      blueprint,
      derivedState: {
        ...derivedState,
        latticeProfile,
        activeSkills: selectionValidation.activeSkills,
        passiveSkills: selectionValidation.passiveSkills,
      },
      seedData: {
        startingGold,
        startingSoulpoints,
      },
    });

    return { valid: true, characterData, creationOutcome };
  }, [
    advancedUnlocked,
    validateReview,
    attributePoints,
    name,
    gender,
    selectedOrigin,
    selectedRace,
    selectedSecondaryClass,
    selectedClass,
    selectedSkillLoadoutId,
    selectedPerkIds,
    selectedStarterTreeIds,
    selectedAlignmentId,
    selectedArchetypeSystem,
    selectedProfession,
    resolveSelectedSkillValidation,
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
    selectedOrigin,
    selectedRace,
    selectedClass,
    selectedSecondaryClass,
    selectedArchetypeSystem,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedProfession,
    attributePoints,
    remainingPoints,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems: ARCHETYPE_SYSTEMS,
    availableCreationPerks,
    availableCreationStarterTrees,
    availableCreationAlignments,
    availableCreationSkillLoadouts,
    creationPerkLimits,
    rerollsRemaining,

    // Setters
    setName,
    setGender,

    // Actions
    handleOriginSelect,
    handleRaceSelect,
    handleClassSelect,
    handleSecondaryClassSelect,
    handleArchetypeSystemSelect,
    handleProfessionSelect,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    handlePerkToggle,
    handleStarterTreeSelect,
    handleAlignmentSelect,
    handleSkillLoadoutSelect,
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
    stepSequence,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  };
}
