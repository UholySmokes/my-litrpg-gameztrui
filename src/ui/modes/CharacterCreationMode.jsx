import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useCharacterCreationReworked } from "../../hook/useCharacterCreationReworked.js";
import {
  CANONICAL_ATTRIBUTES,
  createAttributeBaseline,
  ensureAttributeShape,
} from "../../constants/attributes.js";
import WindowManager from "../windowing/WindowManager.jsx";
import NarrativeMemoryPanel from "../panels/NarrativeMemoryPanel.jsx";
import CreationNarrativePanel from "../panels/CreationNarrativePanel.jsx";
import CreationIdentityPanel from "../panels/creation/CreationIdentityPanel.jsx";
import CreationRacePanel from "../panels/creation/CreationRacePanel.jsx";
import CreationClassPanel from "../panels/creation/CreationClassPanel.jsx";
import CreationProfessionPanel from "../panels/creation/CreationProfessionPanel.jsx";
import CreationAttributesPanel from "../panels/creation/CreationAttributesPanel.jsx";
import CreationSkillsPanel from "../panels/creation/CreationSkillsPanel.jsx";
import CreationArchetypeSystemPanel from "../panels/creation/CreationArchetypeSystemPanel.jsx";
import CreationArchetypeRecommendations from "../panels/creation/CreationArchetypeRecommendations.jsx";
import CreationSummaryPanel from "../panels/creation/CreationSummaryPanel.jsx";
import CreationWizardShellPanel from "../panels/creation/CreationWizardShellPanel.jsx";
import { getRaceAbilitiesFor } from "../../systems/race/RaceAbilityRegistry.js";
import { recommendArchetypeSystems } from "../../utils/archetypeRecommendations.js";

let audioContext = null;
const SOUND_PROFILES = {
  click: { freq: 520, duration: 0.05, volume: 0.05, type: "square" },
  theme_change: { freq: 660, duration: 0.08, volume: 0.05, type: "sine" },
};
const CLASS_THEMES = {
  warrior: { primary: "#FF6B6B", secondary: "#C92A2A", accent: "#FFD700" },
  mage: { primary: "#845EF7", secondary: "#5F3DC4", accent: "#E599F7" },
  rogue: { primary: "#20C997", secondary: "#099268", accent: "#8CE99A" },
  monk: { primary: "#51CF66", secondary: "#2B8A3E", accent: "#96F2D7" },
  paladin: { primary: "#FFD700", secondary: "#FAB005", accent: "#FFF3BF" },
  necromancer: { primary: "#9775FA", secondary: "#7048E8", accent: "#B197FC" },
  ranger: { primary: "#15AABF", secondary: "#0C8599", accent: "#66D9E8" },
  berserker: { primary: "#FF8787", secondary: "#FA5252", accent: "#FFA8A8" },
};
const RACE_ASCII = {
  human: `
    ╔═══════════╗
    ║    ███    ║
    ║   ████   ║
    ║  ██████  ║
    ║ ████████ ║
    ║██████████║
    ║██████████║
    ║ ██ ██ ██ ║
    ║ ██ ██ ██ ║
    ╚═══════════╝`,
  elf: `
    ╔═══════════╗
    ║     ▲     ║
    ║    ▲▲▲    ║
    ║   ▲▲▲▲   ║
    ║  ▲▲▲▲▲▲  ║
    ║ ▲▲▲▲▲▲▲▲ ║
    ║▲▲▲▲▲▲▲▲▲▲║
    ║ ██ ██ ██ ║
    ║ ██ ██ ██ ║
    ╚═══════════╝`,
  dwarf: `
    ╔═══════════╗
    ║  ███████  ║
    ║ ████████ ║
    ║██████████║
    ║██████████║
    ║██████████║
    ║██████████║
    ║ ██ ██ ██ ║
    ║ ██ ██ ██ ║
    ╚═══════════╝`,
  orc: `
    ╔═══════════╗
    ║ ████████  ║
    ║██████████║
    ║██████████║
    ║██████████║
    ║██████████║
    ║██████████║
    ║ ██ ██ ██ ║
    ║ ██ ██ ██ ║
    ╚═══════════╝`,
  default: `
    ╔═══════════╗
    ║           ║
    ║    ███    ║
    ║   ████   ║
    ║  ██████  ║
    ║ ████████ ║
    ║██████████║
    ║ ██ ██ ██ ║
    ║ ██ ██ ██ ║
    ╚═══════════╝`,
};

const playSystemSound = (sound) => {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }
  try {
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    const profile = SOUND_PROFILES[sound] || SOUND_PROFILES.click;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = profile.type || "sine";
    osc.frequency.setValueAtTime(profile.freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + profile.duration + 0.02);
  } catch {
    return;
  }
};

export default function CharacterCreationMode({ onComplete }) {
  const {
    currentStep,
    steps,
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    selectedProfession,
    name: characterName,
    gender,
    attributePoints,
    remainingPoints,
    selectedActiveSkills,
    selectedPassiveSkills,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems,
    rerollsRemaining,
    handleRaceSelect,
    handleClassSelect,
    handleArchetypeSystemSelect,
    handleProfessionSelect,
    setName,
    setGender,
    allocateAttributePoint: handleStatIncrement,
    deallocateAttributePoint: handleStatDecrement,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    nextStep,
    previousStep,
    finalizeCharacter,
    validateCurrentStep,
    validateReview,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  } = useCharacterCreationReworked();

  const allocationPoints = useMemo(
    () => ensureAttributeShape(attributePoints, 5),
    [attributePoints],
  );
  const availablePoints = remainingPoints || 0;

  const handleStatChange = useCallback(
    (stat, delta) => {
      if (delta > 0) {
        handleStatIncrement(stat);
      } else {
        handleStatDecrement(stat);
      }
    },
    [handleStatIncrement, handleStatDecrement],
  );

  const [typewriterText, setTypewriterText] = useState(
    "Select a race and class to generate a profile summary.",
  );
  const [syncProgress, setSyncProgress] = useState(0);
  const [wizardError, setWizardError] = useState("");
  const derivedStats = useMemo(() => {
    const resourceSystem =
      selectedClass?.resourceSystem || selectedClass?.resource || null;
    const raceBonusSource =
      selectedRace?.statBonuses || selectedRace?.modifiers || selectedRace?.baseStats;
    const classBonusSource =
      selectedClass?.baseStats || selectedClass?.statBonuses || selectedClass?.modifiers;
    const raceBonuses = ensureAttributeShape(raceBonusSource, 0);
    const classBonuses = ensureAttributeShape(classBonusSource, 0);
    const totals = CANONICAL_ATTRIBUTES.reduce((acc, key) => {
      const playerValue = allocationPoints[key] ?? 5;
      const raceBonus = raceBonuses[key] ?? 0;
      const classBonus = classBonuses[key] ?? 0;
      acc[key] = playerValue + raceBonus + classBonus;
      return acc;
    }, createAttributeBaseline(0));
    const vitalityScore = totals.vitality ?? 0;
    const intellectScore = totals.intelligence ?? 0;
    return {
      ...totals,
      hp: {
        current: 100 + vitalityScore * 5,
        max: 100 + vitalityScore * 5,
      },
      mana: {
        current: 50 + intellectScore * 3,
        max: 50 + intellectScore * 3,
      },
      resources: {
        rage: resourceSystem === "rage" ? 100 : 0,
        chi: resourceSystem === "chi" ? 100 : 0,
        focus: resourceSystem === "focus" ? 100 : 0,
        stealth: resourceSystem === "stealth" ? 100 : 0,
        energy: resourceSystem === "energy" ? 100 : 0,
      },
    };
  }, [allocationPoints, selectedRace, selectedClass]);

  useEffect(() => {
    if (selectedClass?.id && CLASS_THEMES[selectedClass.id]) {
      const theme = CLASS_THEMES[selectedClass.id];
      document.documentElement.style.setProperty("--holo-primary", theme.primary);
      document.documentElement.style.setProperty(
        "--holo-secondary",
        theme.secondary,
      );
      document.documentElement.style.setProperty("--holo-accent", theme.accent);
      playSystemSound("theme_change");
    }
  }, [selectedClass]);

  useEffect(() => {
    const descriptionParts = [];
    if (selectedClass?.description) descriptionParts.push(selectedClass.description);
    if (selectedRace?.description) descriptionParts.push(selectedRace.description);
    const combinedDescription = descriptionParts.join(" ").trim();
    if (combinedDescription.length > 0) {
      setTypewriterText("");
      let index = 0;
      const interval = setInterval(() => {
        if (index < combinedDescription.length) {
          setTypewriterText((prev) => prev + combinedDescription[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    }
    setTypewriterText("Select a race and class to generate a profile summary.");
  }, [selectedClass, selectedRace]);

  const selectionSummary = useMemo(() => {
    const raceName = selectedRace?.name || "Race not selected";
    const raceDescription =
      selectedRace?.description || "Choose a race to view genetic bonuses.";
    const racePassiveAbility = selectedRace?.passiveAbility || null;
    const raceActiveAbility = selectedRace
      ? getRaceAbilitiesFor(selectedRace.id)?.[0] || null
      : null;
    const className = selectedClass?.name || "Class not selected";
    const classDescription =
      selectedClass?.description || "Choose a class to view combat protocols.";
    const talentName = selectedClass
      ? "Auto-assigned after creation"
      : "Talents pending";
    const talentDescription = selectedClass
      ? `Talents will be assigned based on the ${selectedClass.name} class.`
      : "Select a class to determine your talent pool.";
    const systemName =
      selectedArchetypeSystem?.name || "System not selected";
    const systemDescription =
      selectedArchetypeSystem?.summary ||
      selectedArchetypeSystem?.description ||
      "Choose an archetype system to shape progression.";
    const professionName = selectedProfession?.name || "Profession not selected";
    const professionDescription =
      selectedProfession?.description ||
      "Choose a profession to gain tier-1 skills.";
    const professionSkills = Array.isArray(selectedProfession?.tierUnlocks?.[1]?.skills)
      ? selectedProfession.tierUnlocks[1].skills
      : null;
    return {
      raceName,
      raceDescription,
      racePassiveAbility,
      raceActiveAbility,
      className,
      classDescription,
      talentName,
      talentDescription,
      professionName,
      professionDescription,
      professionSkills,
      systemName,
      systemDescription,
      activeSkills: selectedActiveSkills.length > 0 ? selectedActiveSkills : null,
      passiveSkills:
        selectedPassiveSkills.length > 0 ? selectedPassiveSkills : null,
    };
  }, [
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    selectedProfession,
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  useEffect(() => {
    const stepValue = 100 / 8;
    let progress = 0;
    if (characterName && characterName.trim().length > 0) progress += stepValue;
    if (gender) progress += stepValue;
    if (selectedRace) progress += stepValue;
    if (selectedClass) progress += stepValue;
    if (selectedProfession) progress += stepValue;
    if (selectedArchetypeSystem) progress += stepValue;
    if (availablePoints === 0) progress += stepValue;
    if (
      selectedActiveSkills?.length >= MAX_ACTIVE_SKILLS &&
      selectedPassiveSkills?.length >= MAX_PASSIVE_SKILLS
    )
      progress += stepValue;
    setSyncProgress(Math.min(100, progress));
  }, [
    characterName,
    gender,
    selectedRace,
    selectedClass,
    selectedProfession,
    selectedArchetypeSystem,
    availablePoints,
    selectedActiveSkills,
    selectedPassiveSkills,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  ]);

  const canFinalize = useMemo(() => {
    const result = validateReview?.();
    return Boolean(result?.valid);
  }, [validateReview]);

  const handleClick = useCallback((action) => {
    playSystemSound("click");
    action();
  }, []);

  const asciiArt = selectedRace
    ? RACE_ASCII[selectedRace.id] || RACE_ASCII.default
    : RACE_ASCII.default;

  const statusLines = useMemo(
    () => [
      {
        label: `Designation: ${characterName?.trim() ? "set" : "pending"}`,
        active: Boolean(characterName?.trim()),
      },
      { label: `Gender: ${gender || "pending"}`, active: Boolean(gender) },
      {
        label: `Race: ${selectedRace?.name || "pending"}`,
        active: Boolean(selectedRace),
      },
      {
        label: `Class: ${selectedClass?.name || "pending"}`,
        active: Boolean(selectedClass),
      },
      {
        label: `Profession: ${selectedProfession?.name || "pending"}`,
        active: Boolean(selectedProfession),
      },
      {
        label: `System: ${selectedArchetypeSystem?.name || "pending"}`,
        active: Boolean(selectedArchetypeSystem),
      },
      {
        label: "Talents: auto-assigned after creation",
        active: Boolean(selectedClass),
      },
      {
        label: `Attribute points: ${availablePoints === 0 ? "locked" : "open"}`,
        active: availablePoints === 0,
      },
      {
        label: `Skills: ${selectedActiveSkills.length}/${MAX_ACTIVE_SKILLS} active, ${selectedPassiveSkills.length}/${MAX_PASSIVE_SKILLS} passive`,
        active:
          selectedActiveSkills.length >= MAX_ACTIVE_SKILLS &&
          selectedPassiveSkills.length >= MAX_PASSIVE_SKILLS,
      },
    ],
    [
      availablePoints,
      characterName,
      gender,
      selectedActiveSkills.length,
      selectedClass,
      selectedArchetypeSystem,
      selectedPassiveSkills.length,
      selectedRace,
      selectedProfession,
      MAX_ACTIVE_SKILLS,
      MAX_PASSIVE_SKILLS,
    ],
  );

  const creationMemoryEntries = useMemo(() => {
    const entries = [];
    if (selectedRace) {
      entries.push({
        timestamp: "race",
        text: `Race locked: ${selectedRace.name}`,
      });
    }
    if (selectedClass) {
      entries.push({
        timestamp: "class",
        text: `Class protocol: ${selectedClass.name}`,
      });
      entries.push({
        timestamp: "talents",
        text: `Talents queued for auto-assignment (${selectedClass.name}).`,
      });
    }
    if (selectedProfession) {
      entries.push({
        timestamp: "profession",
        text: `Profession chosen: ${selectedProfession.name}`,
      });
    }
    if (selectedArchetypeSystem) {
      entries.push({
        timestamp: "system",
        text: `Archetype system: ${selectedArchetypeSystem.name}`,
      });
    }
    if (selectedActiveSkills.length) {
      entries.push({
        timestamp: "active-skills",
        text: `Active skills: ${selectedActiveSkills
          .map((skill) => skill.name || skill.id)
          .join(", ")}`,
      });
    }
    if (selectedPassiveSkills.length) {
      entries.push({
        timestamp: "passive-skills",
        text: `Passive skills: ${selectedPassiveSkills
          .map((skill) => skill.name || skill.id)
          .join(", ")}`,
      });
    }
    return entries;
  }, [
    selectedActiveSkills,
    selectedClass,
    selectedArchetypeSystem,
    selectedPassiveSkills,
    selectedRace,
    selectedProfession,
  ]);
  const latestEntry =
    creationMemoryEntries.length > 0
      ? creationMemoryEntries[creationMemoryEntries.length - 1]
      : null;
  const narrativeMemoryRef = useRef(null);

  const archetypeRecommendations = useMemo(
    () =>
      recommendArchetypeSystems({
        systems: availableArchetypeSystems,
        race: selectedRace,
        cls: selectedClass,
        profession: selectedProfession,
      }),
    [availableArchetypeSystems, selectedRace, selectedClass, selectedProfession],
  );

  const activePhase = useMemo(() => {
    if (currentStep === steps.IDENTITY) {
      return (
        <CreationIdentityPanel
          characterName={characterName}
          onNameChange={(value) => {
            setWizardError("");
            setName(value);
          }}
          gender={gender}
          onGenderSelect={(value) => {
            setWizardError("");
            setGender(value);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.RACE) {
      return (
        <CreationRacePanel
          selectedRace={selectedRace}
          onRaceSelect={(race) => {
            setWizardError("");
            handleRaceSelect(race);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.CLASS) {
      return (
        <CreationClassPanel
          selectedClass={selectedClass}
          onClassSelect={(cls) => {
            setWizardError("");
            handleClassSelect(cls);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.PROFESSION) {
      return (
        <CreationProfessionPanel
          selectedProfession={selectedProfession}
          onProfessionSelect={(profId) => {
            setWizardError("");
            handleProfessionSelect(profId);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.ARCHETYPE) {
      return (
        <div>
          <CreationArchetypeRecommendations
            recommendations={archetypeRecommendations}
            selectedSystemId={selectedArchetypeSystem?.id || null}
            onSelect={(systemId) => {
              setWizardError("");
              handleArchetypeSystemSelect(systemId);
            }}
          />
          <CreationArchetypeSystemPanel
            systems={availableArchetypeSystems}
            selectedSystem={selectedArchetypeSystem}
            onSystemSelect={(systemId) => {
              setWizardError("");
              handleArchetypeSystemSelect(systemId);
            }}
            onAction={handleClick}
          />
        </div>
      );
    }
    if (currentStep === steps.ATTRIBUTES) {
      return (
        <CreationAttributesPanel
          allocationPoints={allocationPoints}
          derivedStats={derivedStats}
          availablePoints={availablePoints}
          onStatChange={(stat, delta) => {
            setWizardError("");
            handleStatChange(stat, delta);
          }}
          onAction={handleClick}
          rerollsRemaining={rerollsRemaining}
          onReroll={() => {
            setWizardError("");
            handleReroll();
          }}
        />
      );
    }
    if (currentStep === steps.SKILLS) {
      return (
        <CreationSkillsPanel
          selectedClass={selectedClass}
          availableActiveSkills={availableActiveSkills}
          availablePassiveSkills={availablePassiveSkills}
          selectedActiveSkills={selectedActiveSkills}
          selectedPassiveSkills={selectedPassiveSkills}
          onActiveSelect={(skill) => {
            setWizardError("");
            handleActiveSkillSelect(skill);
          }}
          onPassiveToggle={(skill) => {
            setWizardError("");
            handlePassiveSkillToggle(skill);
          }}
          onAction={handleClick}
        />
      );
    }
    return (
      <CreationSummaryPanel
        asciiArt={asciiArt}
        selectionSummary={selectionSummary}
        selectedActiveSkills={selectedActiveSkills}
        selectedPassiveSkills={selectedPassiveSkills}
        typewriterText={typewriterText}
        syncProgress={syncProgress}
        canFinalize={canFinalize}
        finalizeCharacter={finalizeCharacter}
        onComplete={onComplete}
      />
    );
  }, [
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
    allocationPoints,
    archetypeRecommendations,
    asciiArt,
    availableActiveSkills,
    availableArchetypeSystems,
    availablePassiveSkills,
    availablePoints,
    canFinalize,
    characterName,
    currentStep,
    derivedStats,
    finalizeCharacter,
    gender,
    handleClick,
    handleActiveSkillSelect,
    handleArchetypeSystemSelect,
    handleClassSelect,
    handleProfessionSelect,
    handleRaceSelect,
    handleReroll,
    handleStatChange,
    handlePassiveSkillToggle,
    onComplete,
    rerollsRemaining,
    selectedActiveSkills,
    selectedArchetypeSystem,
    selectedClass,
    selectedPassiveSkills,
    selectedProfession,
    selectedRace,
    selectionSummary,
    setGender,
    setName,
    steps.ARCHETYPE,
    steps.ATTRIBUTES,
    steps.CLASS,
    steps.IDENTITY,
    steps.PROFESSION,
    steps.RACE,
    steps.SKILLS,
    syncProgress,
    typewriterText,
  ]);

  const wizardSteps = useMemo(() => {
    const stepDefs = [
      { id: "identity", label: "Identity", ok: Boolean(characterName?.trim()) && Boolean(gender) },
      { id: "race", label: "Race", ok: Boolean(selectedRace) },
      { id: "class", label: "Class", ok: Boolean(selectedClass) },
      { id: "profession", label: "Profession", ok: Boolean(selectedProfession) },
      { id: "system", label: "System", ok: Boolean(selectedArchetypeSystem) },
      { id: "attributes", label: "Attributes", ok: availablePoints === 0 },
      {
        id: "skills",
        label: "Skills",
        ok:
          selectedActiveSkills.length === MAX_ACTIVE_SKILLS &&
          selectedPassiveSkills.length === MAX_PASSIVE_SKILLS,
      },
      { id: "review", label: "Review", ok: canFinalize },
    ];

    const currentIndex = Math.max(0, Number(currentStep || 1) - 1);
    return stepDefs.map((s, idx) => {
      const done = idx < currentIndex ? true : s.ok;
      const locked = idx > currentIndex;
      return { id: s.id, label: s.label, status: done ? "done" : locked ? "locked" : "open" };
    });
  }, [
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
    availablePoints,
    canFinalize,
    characterName,
    currentStep,
    gender,
    selectedActiveSkills.length,
    selectedArchetypeSystem,
    selectedClass,
    selectedPassiveSkills.length,
    selectedProfession,
    selectedRace,
  ]);

  const activeStepId = useMemo(() => {
    const ids = [
      "identity",
      "race",
      "class",
      "profession",
      "system",
      "attributes",
      "skills",
      "review",
    ];
    const idx = Math.max(0, Math.min(ids.length - 1, Number(currentStep || 1) - 1));
    return ids[idx];
  }, [currentStep]);

  const canBack = currentStep > steps.IDENTITY;
  const canNext = currentStep < steps.REVIEW;

  const windows = [
    {
      id: "wizard",
      title: "Character Genesis",
      dockZone: "center",
      minWidth: 720,
      minHeight: 520,
      content: (
        <CreationWizardShellPanel
          title="Character Genesis"
          steps={wizardSteps}
          activeStepId={activeStepId}
          error={wizardError}
          canBack={canBack}
          canNext={canNext}
          onBack={() => {
            setWizardError("");
            previousStep();
          }}
          onNext={() => {
            const validation = validateCurrentStep?.();
            if (!validation?.valid) {
              setWizardError(validation?.error || "Complete this phase to continue.");
              return;
            }
            setWizardError("");
            nextStep();
          }}
          sidebar={
            <CreationNarrativePanel
              statusLines={statusLines}
              typewriterText={typewriterText}
              syncProgress={syncProgress}
              selectedRace={selectedRace}
              selectedClass={selectedClass}
              selectedArchetypeSystem={selectedArchetypeSystem}
            />
          }
          content={activePhase}
        />
      ),
    },
    {
      id: "narrativeMemory",
      title: "Narrative Memory",
      dockZone: "right",
      allowDockCompact: true,
      compactLabel: "MEM",
      minWidth: 320,
      minHeight: 240,
      content: (
        <NarrativeMemoryPanel
          summary=""
          entries={creationMemoryEntries}
          latestEntry={latestEntry}
          latestEntryText={latestEntry?.text || ""}
          containerRef={narrativeMemoryRef}
        />
      ),
    },
  ];

  return <WindowManager mode="creation" windows={windows} forceFloating={true} />;
}
