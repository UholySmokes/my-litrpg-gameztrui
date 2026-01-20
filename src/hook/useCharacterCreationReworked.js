// =================================================================
// USE CHARACTER CREATION REWORKED HOOK
// Enhanced character creation with expanded skill/talent pools
// - 10 active skills shown, select 3
// - 10 passive skills shown, select 6
// - 8 talents shown, select 1
// - Persistent selections across rerolls
// =================================================================

import { useState, useCallback } from "react";
import { getRandomTalents, getSkillsByClass } from "../entities/Player.js";
import { ContentGenerator } from "../systems/generation/ContentGenerator.js";
import { PROFESSIONS } from "../systems/profession/ProfessionRegistry.js";
import { getAllSkills } from "../systems/skills/SkillRegistry.js";
import {
  CANONICAL_ATTRIBUTES,
  createAttributeBaseline,
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../constants/attributes.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { xpForNextLevel } from "../systems/leveling/LevelingSystem.js";

const INITIAL_FREE_POINTS = 15;
const BASE_ATTRIBUTE_VALUE = 5;
const BASE_ATTRIBUTE_TOTAL = CANONICAL_ATTRIBUTES.length * BASE_ATTRIBUTE_VALUE;
const MAX_ACTIVE_SKILLS = 3;
const MAX_PASSIVE_SKILLS = 6;
const ACTIVE_POOL_SIZE = 10;
const PASSIVE_POOL_SIZE = 10;
const TALENT_POOL_SIZE = 8;

// Helper to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to get random subset
function getRandomSubset(array, count) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function useCharacterCreationReworked() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showBootSequence, setShowBootSequence] = useState(true);

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

  // Skill Pools - Available skills to choose from
  const [availableActiveSkills, setAvailableActiveSkills] = useState([]);
  const [availablePassiveSkills, setAvailablePassiveSkills] = useState([]);

  // Selected Skills - Persistent across rerolls
  const [selectedActiveSkills, setSelectedActiveSkills] = useState([]);
  const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);

  // Talent Pool & Selection
  const [currentTalents, setCurrentTalents] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);

  // Step 2: Profession
  const [selectedProfession, setSelectedProfession] = useState(null);

  // Step 3: Attribute Allocation
  const [attributePoints, setAttributePoints] = useState(() =>
    createAttributeBaseline(BASE_ATTRIBUTE_VALUE),
  );

  // Initial content seeded via lazy state initializers to avoid cascading renders

  // Get all available skills for current class
  const getAllClassSkills = useCallback((cls) => {
    if (!cls) return { active: [], passive: [] };

    if (cls.skills) {
      // Generated class structure
      return {
        active: cls.skills.filter((s) => s.type === "active"),
        passive: cls.skills.filter((s) => s.type === "passive"),
      };
    } else {
      // Static class structure
      const skills = getSkillsByClass(cls.id);
      // Also get universal skills
      try {
        const allSkills = getAllSkills();
        const universalActive = allSkills.filter(
          (s) => s.type === "active" && s.class === "universal",
        );
        const universalPassive = allSkills.filter(
          (s) => s.type === "passive" && s.class === "universal",
        );
        return {
          active: [...skills.active, ...universalActive],
          passive: [...skills.passive, ...universalPassive],
        };
      } catch {
        return skills;
      }
    }
  }, []);

  // Generate skill pools for the selected class
  const generateSkillPools = useCallback(
    (cls) => {
      const skills = getAllClassSkills(cls);

      // Get random subset of active skills, keeping any already selected
      const activePool = getRandomSubset(skills.active, ACTIVE_POOL_SIZE);
      // Ensure selected skills are in the pool
      const activeWithSelected = [...activePool];
      selectedActiveSkills.forEach((skill) => {
        if (!activeWithSelected.find((s) => s.id === skill.id)) {
          activeWithSelected.push(skill);
        }
      });
      setAvailableActiveSkills(
        activeWithSelected.slice(
          0,
          Math.max(ACTIVE_POOL_SIZE, activeWithSelected.length),
        ),
      );

      // Get random subset of passive skills, keeping any already selected
      const passivePool = getRandomSubset(skills.passive, PASSIVE_POOL_SIZE);
      const passiveWithSelected = [...passivePool];
      selectedPassiveSkills.forEach((skill) => {
        if (!passiveWithSelected.find((s) => s.id === skill.id)) {
          passiveWithSelected.push(skill);
        }
      });
      setAvailablePassiveSkills(
        passiveWithSelected.slice(
          0,
          Math.max(PASSIVE_POOL_SIZE, passiveWithSelected.length),
        ),
      );
    },
    [getAllClassSkills, selectedActiveSkills, selectedPassiveSkills],
  );

  // Regenerate races
  const regenerateRaces = useCallback(() => {
    const options = ContentGenerator.generateCharacterOptions(5);
    setGeneratedRaces(options.races);
    setSelectedRace(null);
  }, []);

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

  // Calculate remaining points
  const totalAllocated = Object.values(attributePoints).reduce(
    (sum, val) => sum + val,
    0,
  );
  const remainingPoints =
    INITIAL_FREE_POINTS - (totalAllocated - BASE_ATTRIBUTE_TOTAL);

  // Initialize talents
  const initializeTalents = useCallback(() => {
    if (currentTalents.length === 0) {
      setCurrentTalents(getRandomTalents(TALENT_POOL_SIZE));
    }
  }, [currentTalents.length]);

  // Reroll talents - keeps selected talent if it was in the pool
  const rerollTalents = useCallback(() => {
    const newTalents = getRandomTalents(TALENT_POOL_SIZE);
    // If selected talent exists, ensure it's in the new pool
    if (selectedTalent && !newTalents.find((t) => t.id === selectedTalent.id)) {
      newTalents[0] = selectedTalent; // Replace first talent with selected
    }
    setCurrentTalents(shuffleArray(newTalents));
  }, [selectedTalent]);

  // Reroll active skills - keeps selected skills in pool
  const rerollActiveSkills = useCallback(() => {
    if (!selectedClass) return;
    const skills = getAllClassSkills(selectedClass);

    // Get new random pool
    let newPool = getRandomSubset(skills.active, ACTIVE_POOL_SIZE);

    // Ensure all selected skills remain in pool
    selectedActiveSkills.forEach((skill) => {
      if (!newPool.find((s) => s.id === skill.id)) {
        // Replace a non-selected skill with the selected one
        const replaceIdx = newPool.findIndex(
          (s) => !selectedActiveSkills.find((sel) => sel.id === s.id),
        );
        if (replaceIdx >= 0) {
          newPool[replaceIdx] = skill;
        } else {
          newPool.push(skill);
        }
      }
    });

    setAvailableActiveSkills(
      shuffleArray(newPool).slice(
        0,
        Math.max(ACTIVE_POOL_SIZE, newPool.length),
      ),
    );
  }, [selectedClass, getAllClassSkills, selectedActiveSkills]);

  // Reroll passive skills - keeps selected skills in pool
  const rerollPassiveSkills = useCallback(() => {
    if (!selectedClass) return;
    const skills = getAllClassSkills(selectedClass);

    let newPool = getRandomSubset(skills.passive, PASSIVE_POOL_SIZE);

    selectedPassiveSkills.forEach((skill) => {
      if (!newPool.find((s) => s.id === skill.id)) {
        const replaceIdx = newPool.findIndex(
          (s) => !selectedPassiveSkills.find((sel) => sel.id === s.id),
        );
        if (replaceIdx >= 0) {
          newPool[replaceIdx] = skill;
        } else {
          newPool.push(skill);
        }
      }
    });

    setAvailablePassiveSkills(
      shuffleArray(newPool).slice(
        0,
        Math.max(PASSIVE_POOL_SIZE, newPool.length),
      ),
    );
  }, [selectedClass, getAllClassSkills, selectedPassiveSkills]);

  // Handle race selection
  const handleRaceSelect = useCallback((race) => {
    setSelectedRace(race);
  }, []);

  // Handle class selection
  const handleClassSelect = useCallback(
    (cls) => {
      setSelectedClass(cls);
      setSelectedActiveSkills([]);
      setSelectedPassiveSkills([]);
      generateSkillPools(cls);
    },
    [generateSkillPools],
  );

  // Handle profession selection
  const handleProfessionSelect = useCallback((profId) => {
    setSelectedProfession(PROFESSIONS[profId]);
  }, []);

  // Handle talent selection
  const handleTalentSelect = useCallback(
    (talentId) => {
      const talent = currentTalents.find((t) => t.id === talentId);
      setSelectedTalent((prev) => (prev?.id === talentId ? null : talent));
    },
    [currentTalents],
  );

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

  // Validation
  const validateStep1 = useCallback(() => {
    if (!name.trim()) return { valid: false, error: "Name is required" };
    if (!gender) return { valid: false, error: "Gender is required" };
    if (!selectedRace) return { valid: false, error: "Race is required" };
    if (!selectedClass) return { valid: false, error: "Class is required" };
    if (!selectedTalent) return { valid: false, error: "Talent is required" };
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
  }, [
    name,
    gender,
    selectedRace,
    selectedClass,
    selectedTalent,
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  const validateStep2 = useCallback(() => {
    if (!selectedProfession)
      return { valid: false, error: "Profession is required" };
    return { valid: true };
  }, [selectedProfession]);

  const validateStep3 = useCallback(() => {
    if (remainingPoints !== 0) {
      return {
        valid: false,
        error: `Must allocate all ${INITIAL_FREE_POINTS} attribute points`,
      };
    }
    return { valid: true };
  }, [remainingPoints]);

  // Navigation
  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      const validation = validateStep1();
      if (!validation.valid) return validation;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const validation = validateStep2();
      if (!validation.valid) return validation;
      setCurrentStep(3);
    }
    return { valid: true };
  }, [currentStep, validateStep1, validateStep2]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  // Finalize character
  const finalizeCharacter = useCallback(() => {
    const validation = validateStep3();
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
    const selectedTalentId = selectedTalent?.id || null;
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
      race: selectedRace?.name || selectedRace || "Unknown",
      class: selectedClass?.name || selectedClass || "None",
      talent: selectedTalent?.name || selectedTalent || "None",
      talents: selectedTalentId ? [selectedTalentId] : [],
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
    validateStep3,
    attributePoints,
    name,
    gender,
    selectedRace,
    selectedClass,
    selectedTalent,
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
    showBootSequence,
    name,
    gender,
    selectedRace,
    selectedClass,
    selectedTalent,
    currentTalents,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedProfession,
    attributePoints,
    remainingPoints,
    generatedRaces,
    generatedClasses,
    availableActiveSkills,
    availablePassiveSkills,

    // Setters
    setName,
    setGender,

    // Actions
    regenerateRaces,
    regenerateClasses,
    handleRaceSelect,
    handleClassSelect,
    handleTalentSelect,
    handleProfessionSelect,
    rerollTalents,
    rerollActiveSkills,
    rerollPassiveSkills,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    allocateAttributePoint,
    deallocateAttributePoint,
    nextStep,
    previousStep,
    finalizeCharacter,
    skipBootSequence,
    initializeTalents,

    // Helpers
    getAvailableActiveSkills,
    getAvailablePassiveSkills,
    isSkillSelected,

    // Constants
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  };
}
