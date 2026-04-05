// =================================================================
// USE CHARACTER CREATION REWORKED HOOK
// Enhanced character creation with expanded skill pools
// - All compatible skills shown (class + race + general), select 3 active
// - All compatible passive skills shown, select 6
// - Talents are auto-assigned after creation based on class
// - Persistent selections across rerolls
// =================================================================

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getProfessionSummaryById,
  getProfessionSummaries,
} from "../systems/profession/ProfessionContentPack.js";
import {
  assignTalentsForClass,
  getTalentById,
} from "../systems/skills/TalentContentPack.js";

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
  createCharacterCreationBlueprint,
  createCharacterCreationOutcome,
  validateCharacterCreationBlueprint,
} from "@voidverse/game-core/characterCreation/CharacterCreationContract.js";
import {
  buildCharacterCreationLatticeProfile,
  buildCharacterCreationSkillPools as buildSharedCharacterCreationSkillPools,
  getCharacterCreationSkillSelectionLimits,
  resolveCharacterCreationSkillLoadout,
  validateCharacterCreationSkillSelections,
} from "@voidverse/game-core/characterCreation/CharacterCreationSkillSelection.js";
import {
  getCharacterCreationArchetypeSystemById,
  getCharacterCreationArchetypeSystems,
  getCharacterCreationClassesByTier,
  getCharacterCreationRaces,
  getCharacterCreationSkillSummaryById,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";
import {
  getCharacterCreationPerkLimits,
  listCharacterCreationAlignments,
  listCharacterCreationPerks,
  listCharacterCreationSkillLoadouts,
  listCharacterCreationStarterTrees,
} from "@voidverse/game-core/characterCreation/CharacterCreationOptionsRegistry.js";
import { resolveCharacterCreationOptionsBySystem } from "@voidverse/game-core/characterCreation/CharacterCreationSystemInfluence.js";

const INITIAL_FREE_POINTS = 15;
const BASE_ATTRIBUTE_VALUE = 5;
const BASE_ATTRIBUTE_TOTAL = CANONICAL_ATTRIBUTES.length * BASE_ATTRIBUTE_VALUE;
const INITIAL_REROLLS = 3;
const {
  requiredActiveSkillCount: MAX_ACTIVE_SKILLS,
  requiredPassiveSkillCount: MAX_PASSIVE_SKILLS,
} = getCharacterCreationSkillSelectionLimits();
const CREATION_STEPS = Object.freeze({
  NAME: 1,
  ARCHETYPE: 2,
  RACE: 3,
  CLASS: 4,
  MULTICLASS: 5,
  PROFESSION: 6,
  ATTRIBUTES: 7,
  SKILLS: 8,
  PERKS: 9,
  STARTER_TREE: 10,
  ALIGNMENT: 11,
  STARTING_POINT: 12,
  REVIEW: 13,
});

const AVAILABLE_STARTING_POINTS = Object.freeze([
  { id: "city", name: "Meridian Arcology", type: "social", summary: "A neon sanctuary built atop ancient bones — guild offices, scroll shops, and back-alley deals." },
  { id: "ruins", name: "Leyfall Ruins", type: "exploration", summary: "The Spirefall's scar — exposed foundations, broken wards, and relics half-buried in rubble." },
  { id: "wilds", name: "Wildroot Fringe", type: "exploration", summary: "Grove networks and ash-fed growth reclaiming the old roads; beasts and druids both call truce here." },
  { id: "skydocks", name: "Skyforge Skydocks", type: "combat", summary: "Platforms over open air where airship crews brawl and mercenaries compete for contracts." },
  { id: "undercity", name: "Veilward Undercity", type: "combat", summary: "Tunnels and ledger vaults beneath the city — smugglers, thieves, and forgotten things." },
  { id: "coast", name: "Tideward Coast", type: "exploration", summary: "Breakwaters and ward-stones line the shore; sea trade and salvage keep the docks alive." },
  { id: "mountain", name: "Crystal Ridgeworks", type: "exploration", summary: "Frozen crystal veins run through the rock face — miners, hermits, and the occasional frost wyrm." },
  { id: "desert", name: "Glassstep Sands", type: "combat", summary: "Sun-fused glass plains and buried tombs; nomad caravans skirmish with sand constructs." },
  { id: "volcanic", name: "Emberline Caldera", type: "combat", summary: "Magma forges and obsidian spires — only the bold or the desperate settle here." },
  { id: "dreamscape", name: "Mnemonic Dreamscape", type: "exploration", summary: "Psychic mists and memory fragments given form — reality bends at every step." },
]);
const AVAILABLE_ARCHETYPE_SYSTEMS = getCharacterCreationArchetypeSystems().sort((left, right) => {
  const leftPriority = Number(left?.characterCreation?.ordering?.priority || 999);
  const rightPriority = Number(right?.characterCreation?.ordering?.priority || 999);
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  return String(left?.name || left?.id).localeCompare(String(right?.name || right?.id));
});
const AVAILABLE_CREATION_RACES = getCharacterCreationRaces();
const AVAILABLE_CREATION_CLASSES = getCharacterCreationClassesByTier(1);
const AVAILABLE_CREATION_PROFESSIONS = getProfessionSummaries();

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

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneList(values = []) {
  return Array.isArray(values) ? values.map((entry) => cloneValue(entry)) : [];
}

function containsById(list, id) {
  return Array.isArray(list) && list.some((entry) => entry?.id === id);
}

function uniqueById(values = []) {
  const seen = new Set();
  return values.filter((entry) => {
    const id = entry?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildCharacterCreationAttributes({
  attributePoints,
  selectedRace,
  selectedClass,
} = {}) {
  const baseAttributes = ensureAttributeShape(attributePoints, BASE_ATTRIBUTE_VALUE);
  const raceBonuses = getAttributeBonuses(selectedRace);
  const classBonuses = getAttributeBonuses(selectedClass, "baseStats");

  return CANONICAL_ATTRIBUTES.reduce((acc, key) => {
    acc[key] =
      (baseAttributes[key] ?? BASE_ATTRIBUTE_VALUE) +
      (raceBonuses[key] ?? 0) +
      (classBonuses[key] ?? 0);
    return acc;
  }, createAttributeBaseline(0));
}

export function buildCharacterCreationDerivedState({
  attributePoints,
  selectedRace,
  selectedClass,
} = {}) {
  const attributes = buildCharacterCreationAttributes({
    attributePoints,
    selectedRace,
    selectedClass,
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

export function buildCharacterCreationSkillPools(cls, race, options = {}) {
  return buildSharedCharacterCreationSkillPools(cls, race, options);
}

export function useCharacterCreationReworked({ advancedUnlocked = false } = {}) {
  const [currentStep, setCurrentStep] = useState(CREATION_STEPS.NAME);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [rerollsRemaining, setRerollsRemaining] = useState(INITIAL_REROLLS);

  const STEPS = CREATION_STEPS;
  const stepSequence = useMemo(
    () => buildCreationStepSequence(STEPS, advancedUnlocked).map((entry) => entry.step),
    [STEPS, advancedUnlocked],
  );

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSecondaryClass, setSelectedSecondaryClass] = useState(null);
  const [selectedArchetypeSystem, setSelectedArchetypeSystem] = useState(null);
  const [selectedPerkIds, setSelectedPerkIds] = useState([]);
  const [selectedStarterTreeIds, setSelectedStarterTreeIds] = useState([]);
  const [selectedAlignmentId, setSelectedAlignmentId] = useState(null);
  const [selectedSkillLoadoutId, setSelectedSkillLoadoutId] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [selectedStartingPoint, setSelectedStartingPoint] = useState(null);

  const creationPerkLimits = getCharacterCreationPerkLimits();
  const availableCreationAlignments = listCharacterCreationAlignments();
  const [selectedActiveSkills, setSelectedActiveSkills] = useState([]);
  const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);
  const [attributePoints, setAttributePoints] = useState(() =>
    createAttributeBaseline(BASE_ATTRIBUTE_VALUE),
  );

  const systemOptionState = useMemo(
    () =>
      resolveCharacterCreationOptionsBySystem({
        systemId: selectedArchetypeSystem?.id || null,
        races: AVAILABLE_CREATION_RACES,
        classes: AVAILABLE_CREATION_CLASSES,
        professions: AVAILABLE_CREATION_PROFESSIONS,
        perks: listCharacterCreationPerks(),
        starterTrees: listCharacterCreationStarterTrees(),
      }),
    [selectedArchetypeSystem?.id],
  );

  const availableRaces = useMemo(
    () => cloneList(systemOptionState.races?.options || []),
    [systemOptionState.races?.options],
  );
  const availableClasses = useMemo(
    () => cloneList(systemOptionState.classes?.options || []),
    [systemOptionState.classes?.options],
  );
  const availableSecondaryClasses = useMemo(
    () =>
      cloneList(systemOptionState.secondaryClasses?.options || []).filter(
        (entry) => entry?.id !== selectedClass?.id,
      ),
    [selectedClass?.id, systemOptionState.secondaryClasses?.options],
  );
  const availableProfessions = useMemo(
    () => cloneList(systemOptionState.professions?.options || []),
    [systemOptionState.professions?.options],
  );
  const availableCreationPerks = useMemo(
    () => cloneList(systemOptionState.perks?.options || []),
    [systemOptionState.perks?.options],
  );
  const availableCreationStarterTrees = useMemo(
    () => cloneList(systemOptionState.starterTrees?.options || []),
    [systemOptionState.starterTrees?.options],
  );

  const recommendedRaceIds = systemOptionState.races?.recommendedIds || [];
  const recommendedClassIds = systemOptionState.classes?.recommendedIds || [];
  const recommendedProfessionIds =
    systemOptionState.professions?.recommendedIds || [];
  const systemAttributeBias = systemOptionState.attributeBias || {
    primary: [],
    secondary: [],
  };

  const skillPools = useMemo(
    () =>
      buildCharacterCreationSkillPools(selectedClass, selectedRace, {
        professionId: selectedProfession?.id || null,
        systemId: selectedArchetypeSystem?.id || null,
      }),
    [
      selectedArchetypeSystem?.id,
      selectedClass,
      selectedProfession?.id,
      selectedRace,
    ],
  );

  const availableActiveSkills = useMemo(
    () => skillPools.active || [],
    [skillPools.active],
  );
  const availablePassiveSkills = useMemo(
    () => skillPools.passive || [],
    [skillPools.passive],
  );
  const grantedActiveSkills = useMemo(
    () => skillPools.grantedActive || [],
    [skillPools.grantedActive],
  );
  const grantedPassiveSkills = useMemo(
    () => skillPools.grantedPassive || [],
    [skillPools.grantedPassive],
  );
  const blockedSkillIds = useMemo(
    () => skillPools.blockedSkillIds || [],
    [skillPools.blockedSkillIds],
  );
  const slotBonuses = skillPools.slotBonuses || { active: 0, passive: 0 };
  const effectiveMaxActiveSkills = MAX_ACTIVE_SKILLS + (slotBonuses.active || 0);
  const effectiveMaxPassiveSkills =
    MAX_PASSIVE_SKILLS + (slotBonuses.passive || 0);

  const availableCreationSkillLoadouts = useMemo(
    () =>
      listCharacterCreationSkillLoadouts({
        cls: selectedClass,
        race: selectedRace,
        professionId: selectedProfession?.id || null,
        systemId: selectedArchetypeSystem?.id || null,
        pools: skillPools,
      }),
    [
      selectedArchetypeSystem?.id,
      selectedClass,
      selectedProfession?.id,
      selectedRace,
      skillPools,
    ],
  );

  const resolveSelectedSkillValidation = useCallback(() => {
    return validateCharacterCreationSkillSelections(
      {
        cls: selectedClass,
        race: selectedRace,
        professionId: selectedProfession?.id || null,
        systemId: selectedArchetypeSystem?.id || null,
        activeSkillIds: selectedActiveSkills.map((skill) => skill.id),
        passiveSkillIds: selectedPassiveSkills.map((skill) => skill.id),
        skillLoadoutId: selectedSkillLoadoutId,
      },
      {
        requiredActiveSkillCount: effectiveMaxActiveSkills,
        requiredPassiveSkillCount: effectiveMaxPassiveSkills,
      },
    );
  }, [
    effectiveMaxActiveSkills,
    effectiveMaxPassiveSkills,
    selectedArchetypeSystem?.id,
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

    setCurrentStep(CREATION_STEPS.NAME);
    setShowBootSequence(false);
    setName("");
    setGender("");
    setSelectedRace(null);
    setSelectedClass(null);
    setSelectedSecondaryClass(null);
    setSelectedArchetypeSystem(null);
    setSelectedProfession(null);
    setSelectedPerkIds([]);
    setSelectedStarterTreeIds([]);
    setSelectedAlignmentId(null);
    setSelectedSkillLoadoutId(null);
    setSelectedStartingPoint(null);
    setSelectedActiveSkills([]);
    setSelectedPassiveSkills([]);
    setAttributePoints(createAttributeBaseline(BASE_ATTRIBUTE_VALUE));
  }, [rerollsRemaining]);

  const handleStartingPointSelect = useCallback((point) => {
    setSelectedStartingPoint(point || null);
  }, []);

  // Calculate remaining points
  const totalAllocated = Object.values(attributePoints).reduce(
    (sum, val) => sum + val,
    0,
  );
  const remainingPoints =
    INITIAL_FREE_POINTS - (totalAllocated - BASE_ATTRIBUTE_TOTAL);

  const handleRaceSelect = useCallback((race) => {
    setSelectedRace(race || null);
    setSelectedSkillLoadoutId(null);
  }, []);

  const handleClassSelect = useCallback((cls) => {
    setSelectedClass(cls || null);
    setSelectedSecondaryClass((prev) =>
      prev?.id && prev.id === cls?.id ? null : prev,
    );
    setSelectedSkillLoadoutId(null);
  }, []);

  const handleProfessionSelect = useCallback((professionRef) => {
    const profession =
      typeof professionRef === "string"
        ? getProfessionSummaryById(professionRef)
        : professionRef;
    setSelectedProfession(profession || null);
    setSelectedSkillLoadoutId(null);
  }, []);

  const handleArchetypeSystemSelect = useCallback((systemId) => {
    const system = getCharacterCreationArchetypeSystemById(systemId);
    setSelectedArchetypeSystem(system || null);
    setSelectedSkillLoadoutId(null);
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
      systemId: selectedArchetypeSystem?.id || null,
      pools: skillPools,
    });

    if (!resolvedLoadout) {
      setSelectedSkillLoadoutId(null);
      return;
    }

    setSelectedSkillLoadoutId(resolvedLoadout.id);
    setSelectedActiveSkills(resolvedLoadout.activeSkills);
    setSelectedPassiveSkills(resolvedLoadout.passiveSkills);
  }, [
    selectedArchetypeSystem?.id,
    selectedClass,
    selectedProfession?.id,
    selectedRace,
    skillPools,
  ]);

  // Handle active skill selection (toggle, max 3)
  const handleActiveSkillSelect = useCallback((skill) => {
    if (!skill) return;
    setSelectedSkillLoadoutId(null);

    setSelectedActiveSkills((prev) => {
      const exists = prev.find((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      } else {
        if (prev.length >= effectiveMaxActiveSkills) return prev;
        return [...prev, skill];
      }
    });
  }, [effectiveMaxActiveSkills]);

  // Handle passive skill selection (toggle, max 6)
  const handlePassiveSkillToggle = useCallback((skill) => {
    if (!skill) return;
    setSelectedSkillLoadoutId(null);

    setSelectedPassiveSkills((prev) => {
      const exists = prev.find((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      } else {
        if (prev.length >= effectiveMaxPassiveSkills) return prev;
        return [...prev, skill];
      }
    });
  }, [effectiveMaxPassiveSkills]);

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

  useEffect(() => {
    if (selectedRace && !containsById(availableRaces, selectedRace.id)) {
      setSelectedRace(null);
    }
  }, [availableRaces, selectedRace]);

  useEffect(() => {
    if (selectedClass && !containsById(availableClasses, selectedClass.id)) {
      setSelectedClass(null);
    }
  }, [availableClasses, selectedClass]);

  useEffect(() => {
    if (!advancedUnlocked) {
      if (selectedSecondaryClass) setSelectedSecondaryClass(null);
      return;
    }
    if (
      selectedSecondaryClass &&
      !containsById(availableSecondaryClasses, selectedSecondaryClass.id)
    ) {
      setSelectedSecondaryClass(null);
    }
  }, [
    advancedUnlocked,
    availableSecondaryClasses,
    selectedSecondaryClass,
  ]);

  useEffect(() => {
    if (
      selectedProfession &&
      !containsById(availableProfessions, selectedProfession.id)
    ) {
      setSelectedProfession(null);
    }
  }, [availableProfessions, selectedProfession]);

  useEffect(() => {
    const allowedIds = new Set(
      availableCreationPerks.map((entry) => entry?.id).filter(Boolean),
    );
    setSelectedPerkIds((prev) => {
      const next = prev.filter((entry) => allowedIds.has(entry));
      return next.length === prev.length ? prev : next;
    });
  }, [availableCreationPerks]);

  useEffect(() => {
    if (!advancedUnlocked) {
      if (selectedStarterTreeIds.length > 0) setSelectedStarterTreeIds([]);
      return;
    }
    const allowedIds = new Set(
      availableCreationStarterTrees.map((entry) => entry?.id).filter(Boolean),
    );
    setSelectedStarterTreeIds((prev) => {
      const next = prev.filter((entry) => allowedIds.has(entry)).slice(0, 1);
      return next.length === prev.length && next[0] === prev[0] ? prev : next;
    });
  }, [
    advancedUnlocked,
    availableCreationStarterTrees,
    selectedStarterTreeIds.length,
  ]);

  useEffect(() => {
    if (
      selectedAlignmentId &&
      !availableCreationAlignments.some((entry) => entry?.id === selectedAlignmentId)
    ) {
      setSelectedAlignmentId(null);
    }
  }, [availableCreationAlignments, selectedAlignmentId]);

  useEffect(() => {
    if (
      selectedSkillLoadoutId &&
      !availableCreationSkillLoadouts.some(
        (entry) => entry?.id === selectedSkillLoadoutId,
      )
    ) {
      setSelectedSkillLoadoutId(null);
    }
  }, [availableCreationSkillLoadouts, selectedSkillLoadoutId]);

  useEffect(() => {
    const activeIds = new Set(availableActiveSkills.map((entry) => entry?.id).filter(Boolean));
    setSelectedActiveSkills((prev) => {
      const next = uniqueById(prev.filter((entry) => activeIds.has(entry?.id))).slice(
        0,
        effectiveMaxActiveSkills,
      );
      return next.length === prev.length &&
        next.every((entry, index) => entry?.id === prev[index]?.id)
        ? prev
        : next;
    });
  }, [availableActiveSkills, effectiveMaxActiveSkills]);

  useEffect(() => {
    const passiveIds = new Set(
      availablePassiveSkills.map((entry) => entry?.id).filter(Boolean),
    );
    setSelectedPassiveSkills((prev) => {
      const next = uniqueById(prev.filter((entry) => passiveIds.has(entry?.id))).slice(
        0,
        effectiveMaxPassiveSkills,
      );
      return next.length === prev.length &&
        next.every((entry, index) => entry?.id === prev[index]?.id)
        ? prev
        : next;
    });
  }, [availablePassiveSkills, effectiveMaxPassiveSkills]);

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

  const validateNameStep = useCallback(() => {
    if (!name.trim()) return { valid: false, error: "Name is required" };
    return { valid: true };
  }, [name]);

  const validateStartingPoint = useCallback(() => {
    if (!selectedStartingPoint) return { valid: false, error: "Starting point is required" };
    return { valid: true };
  }, [selectedStartingPoint]);

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
      validateNameStep,
      validateArchetype,
      validateRace,
      validateClass,
      ...(advancedUnlocked ? [validateMulticlass] : []),
      validateProfession,
      validateAttributes,
      validateSkills,
      validatePerks,
      ...(advancedUnlocked ? [validateStarterTree] : []),
      validateAlignment,
      validateStartingPoint,
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
        startingZoneId: selectedStartingPoint?.id,
        professionId: selectedProfession?.id,
        archetypeSystemId: selectedArchetypeSystem?.id,
        attributes: buildCharacterCreationAttributes({
          attributePoints,
          selectedRace,
          selectedClass,
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
        requiredActiveSkillCount: effectiveMaxActiveSkills,
        requiredPassiveSkillCount: effectiveMaxPassiveSkills,
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
    effectiveMaxActiveSkills,
    effectiveMaxPassiveSkills,
    gender,
    name,
    selectedActiveSkills,
    selectedAlignmentId,
    validateArchetype,
    validateAttributes,
    validateAlignment,
    validateClass,
    validateStartingPoint,
    validateMulticlass,
    validatePerks,
    selectedArchetypeSystem,
    selectedClass,
    selectedSecondaryClass,
    selectedStartingPoint,
    selectedPassiveSkills,
    selectedPerkIds,
    selectedProfession,
    selectedRace,
    selectedSkillLoadoutId,
    selectedStarterTreeIds,
    validateStarterTree,
    validateNameStep,
    validateProfession,
    validateRace,
    validateSkills,
    availableCreationStarterTrees.length,
    creationPerkLimits.maxPicks,
    creationPerkLimits.minPicks,
  ]);

  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case STEPS.NAME:
        return validateNameStep();
      case STEPS.ARCHETYPE:
        return validateArchetype();
      case STEPS.RACE:
        return validateRace();
      case STEPS.CLASS:
        return validateClass();
      case STEPS.MULTICLASS:
        return validateMulticlass();
      case STEPS.PROFESSION:
        return validateProfession();
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
      case STEPS.STARTING_POINT:
        return validateStartingPoint();
      case STEPS.REVIEW:
      default:
        return validateReview();
    }
  }, [
    STEPS.NAME,
    STEPS.ARCHETYPE,
    STEPS.ATTRIBUTES,
    STEPS.CLASS,
    STEPS.MULTICLASS,
    STEPS.STARTING_POINT,
    STEPS.ALIGNMENT,
    STEPS.PERKS,
    STEPS.PROFESSION,
    STEPS.RACE,
    STEPS.REVIEW,
    STEPS.SKILLS,
    STEPS.STARTER_TREE,
    currentStep,
    validateNameStep,
    validateAlignment,
    validateArchetype,
    validateAttributes,
    validateClass,
    validateStartingPoint,
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
      if (currentIndex < 0) return stepSequence[0] || STEPS.NAME;
      return stepSequence[Math.min(stepSequence.length - 1, currentIndex + 1)];
    });
    return { valid: true };
  }, [STEPS.NAME, stepSequence, validateCurrentStep]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      const currentIndex = stepSequence.indexOf(prev);
      if (currentIndex <= 0) return stepSequence[0] || STEPS.NAME;
      return stepSequence[currentIndex - 1];
    });
  }, [STEPS.NAME, stepSequence]);

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
    });

    // Add profession skills at tier 1
    const professionSkills = [];
    if (
      selectedProfession &&
      (Array.isArray(selectedProfession.tier1Skills) ||
        selectedProfession.tierUnlocks?.[1])
    ) {
      const tier1Skills = Array.isArray(selectedProfession.tier1Skills)
        ? selectedProfession.tier1Skills
        : selectedProfession.tierUnlocks?.[1]?.skills || [];
      professionSkills.push(
        ...tier1Skills.map((skillId) => {
          const existingSkill = getCharacterCreationSkillSummaryById(skillId);
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

    const systemGrantedSkills = {
      active: cloneList(skillPools.grantedActive || []),
      passive: cloneList(skillPools.grantedPassive || []),
    };
    const allAbilities = uniqueById([
      ...selectionValidation.activeSkills,
      ...selectionValidation.passiveSkills,
      ...systemGrantedSkills.active,
      ...systemGrantedSkills.passive,
      ...professionSkills,
    ]);

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
      startingZoneId: selectedStartingPoint?.id,
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
      startingZoneId: selectedStartingPoint?.id || null,
      alignment: selectedAlignmentId,
      perks: selectedPerkIds,
      starterTrees: advancedUnlocked ? selectedStarterTreeIds : [],
      skillLoadoutId: selectedSkillLoadoutId,
      characterCreationBlueprint: blueprint,
      latticeProfile,
      archetypeSystemId: selectedArchetypeSystem?.id || null,
      archetypeSystem: selectedArchetypeSystem
        ? cloneValue(selectedArchetypeSystem)
        : null,
      talent: talentLabel,
      talents: assignedTalentIds,
      talentMigrationLanes: latticeProfile.talentMigrationLanes,
      activeSkills: selectionValidation.activeSkills,
      passiveSkills: selectionValidation.passiveSkills,
      systemGrantedSkills,
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
        systemGrantedSkills,
        blockedSkillIds,
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
    selectedStartingPoint,
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
    skillPools.grantedActive,
    skillPools.grantedPassive,
    blockedSkillIds,
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
    selectedStartingPoint,
    selectedRace,
    selectedClass,
    selectedSecondaryClass,
    selectedArchetypeSystem,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedProfession,
    selectedPerkIds,
    selectedStarterTreeIds,
    selectedAlignmentId,
    selectedSkillLoadoutId,
    attributePoints,
    remainingPoints,
    availableStartingPoints: AVAILABLE_STARTING_POINTS,
    availableRaces,
    availableClasses,
    availableSecondaryClasses,
    availableProfessions,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems: AVAILABLE_ARCHETYPE_SYSTEMS,
    availableCreationPerks,
    availableCreationStarterTrees,
    availableCreationAlignments,
    availableCreationSkillLoadouts,
    recommendedRaceIds,
    recommendedClassIds,
    recommendedProfessionIds,
    grantedActiveSkills,
    grantedPassiveSkills,
    blockedSkillIds,
    systemAttributeBias,
    creationPerkLimits,
    rerollsRemaining,

    // Setters
    setName,
    setGender,

    // Actions
    handleStartingPointSelect,
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
    MAX_ACTIVE_SKILLS: effectiveMaxActiveSkills,
    MAX_PASSIVE_SKILLS: effectiveMaxPassiveSkills,
  };
}
