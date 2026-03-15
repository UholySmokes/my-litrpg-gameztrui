import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  buildCharacterCreationDerivedState,
  useCharacterCreationReworked,
} from "../../hook/useCharacterCreationReworked.js";
import WindowManager from "../windowing/WindowManager.jsx";
import NarrativeMemoryPanel from "../panels/NarrativeMemoryPanel.jsx";
import CreationNarrativePanel from "../panels/CreationNarrativePanel.jsx";
import CreationNamePanel from "../panels/creation/CreationNamePanel.jsx";
import CreationIdentityPanel from "../panels/creation/CreationIdentityPanel.jsx";
import CreationRacePanel from "../panels/creation/CreationRacePanel.jsx";
import CreationClassPanel from "../panels/creation/CreationClassPanel.jsx";
import CreationProfessionPanel from "../panels/creation/CreationProfessionPanel.jsx";
import CreationAttributesPanel from "../panels/creation/CreationAttributesPanel.jsx";
import CreationSkillsPanel from "../panels/creation/CreationSkillsPanel.jsx";
import CreationChoicePanel from "../panels/creation/CreationChoicePanel.jsx";
import CreationArchetypeSystemPanel from "../panels/creation/CreationArchetypeSystemPanel.jsx";
import CreationSummaryPanel from "../panels/creation/CreationSummaryPanel.jsx";
import CreationWizardShellPanel from "../panels/creation/CreationWizardShellPanel.jsx";
import { ensureAttributeShape } from "../../constants/attributes.js";
import {
  buildCreationStepSequence,
  buildCreationWizardSteps,
  calculateCreationSyncProgress,
  findCreationStepIndex,
  getCreationActiveStepId,
} from "../../core/characterCreationWizardFlow.js";
import {
  createTelemetryEvent,
  postTelemetryBatch,
} from "../../core/telemetryClient.js";
import {
  getCharacterCreationRaceAbilitySummaries,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";

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
    +-----------+
    |   HUMAN   |
    |   _____   |
    |  / o o \\  |
    | |   ^   | |
    | |  '-'  | |
    |  \\_____/  |
    +-----------+`,
  elf: `
    +-----------+
    |    ELF    |
    |   /\\ /\\   |
    |  / o o\\   |
    | |   ^  |  |
    | |  ___ |  |
    |  \\____/   |
    +-----------+`,
  dwarf: `
    +-----------+
    |   DWARF   |
    |  [#####]  |
    |  | o o |  |
    |  |  ^  |  |
    |  | === |  |
    |   \\___/   |
    +-----------+`,
  orc: `
    +-----------+
    |    ORC    |
    |   _/^^\\_  |
    |  / o  o\\  |
    | |   ^^  | |
    | |  ____ | |
    |  \\______/ |
    +-----------+`,
  default: `
    +-----------+
    | ADVENTURER|
    |   _____   |
    |  / o o \\  |
    | |   ^   | |
    | |  ___  | |
    |  \\_____/  |
    +-----------+`,
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

export default function CharacterCreationMode({
  onComplete,
  advancedUnlocked = false,
  telemetryUser = null,
}) {
  const {
    currentStep,
    steps,
    selectedOrigin,
    selectedRace,
    selectedClass,
    selectedSecondaryClass,
    selectedArchetypeSystem,
    selectedProfession,
    name: characterName,
    gender,
    attributePoints,
    remainingPoints,
    selectedActiveSkills,
    selectedPassiveSkills,
    selectedPerkIds,
    selectedStarterTreeIds,
    selectedAlignmentId,
    selectedSkillLoadoutId,
    availableOrigins,
    availableRaces,
    availableClasses,
    availableSecondaryClasses,
    availableProfessions,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems,
    availableCreationPerks,
    availableCreationStarterTrees,
    availableCreationAlignments,
    availableCreationSkillLoadouts,
    recommendedOriginIds,
    recommendedRaceIds,
    recommendedClassIds,
    recommendedProfessionIds,
    grantedActiveSkills,
    grantedPassiveSkills,
    blockedSkillIds,
    systemAttributeBias,
    creationPerkLimits,
    rerollsRemaining,
    handleOriginSelect,
    handleRaceSelect,
    handleClassSelect,
    handleSecondaryClassSelect,
    handleArchetypeSystemSelect,
    handleProfessionSelect,
    setName,
    setGender,
    allocateAttributePoint: handleStatIncrement,
    deallocateAttributePoint: handleStatDecrement,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    handlePerkToggle,
    handleStarterTreeSelect,
    handleAlignmentSelect,
    handleSkillLoadoutSelect,
    nextStep,
    previousStep,
    finalizeCharacter,
    validateCurrentStep,
    validateReview,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  } = useCharacterCreationReworked({ advancedUnlocked });

  const allocationPoints = useMemo(
    () => ensureAttributeShape(attributePoints, 5),
    [attributePoints],
  );
  const availablePoints = remainingPoints || 0;
  const creationFlow = useMemo(
    () => buildCreationStepSequence(steps, advancedUnlocked),
    [advancedUnlocked, steps],
  );
  const currentSequenceIndex = useMemo(
    () => findCreationStepIndex(creationFlow, currentStep),
    [creationFlow, currentStep],
  );

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
    "Choose a designation, then bind a System to shape the rest of creation.",
  );
  const [wizardError, setWizardError] = useState("");
  const emitCreationTelemetry = useCallback(
    (event) => {
      void postTelemetryBatch({
        user: telemetryUser,
        tags: {
          surface: "character_creation",
          mode: advancedUnlocked ? "advanced" : "basic",
        },
        events: [event],
      });
    },
    [advancedUnlocked, telemetryUser],
  );
  const derivedStats = useMemo(() => {
    const totals = buildCharacterCreationDerivedState({
      attributePoints: allocationPoints,
      selectedRace,
      selectedClass,
      selectedOrigin,
    });
    return {
      ...totals.attributes,
      hp: totals.hp,
      mana: totals.mana,
      resources: totals.resources,
    };
  }, [allocationPoints, selectedClass, selectedOrigin, selectedRace]);

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
    if (selectedArchetypeSystem?.summary) descriptionParts.push(selectedArchetypeSystem.summary);
    if (selectedOrigin?.description) descriptionParts.push(selectedOrigin.description);
    if (selectedClass?.description) descriptionParts.push(selectedClass.description);
    if (selectedRace?.description) descriptionParts.push(selectedRace.description);
    if (selectedProfession?.description) descriptionParts.push(selectedProfession.description);
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
    setTypewriterText("Choose a designation, then bind a System to shape the rest of creation.");
  }, [
    selectedArchetypeSystem?.summary,
    selectedClass,
    selectedOrigin,
    selectedProfession?.description,
    selectedRace,
  ]);

  const selectionSummary = useMemo(() => {
    const originName = selectedOrigin?.name || "Origin not selected";
    const originDescription =
      selectedOrigin?.description ||
      "Choose an origin to shape starting stat pressures and world hooks.";
    const raceName = selectedRace?.name || "Race not selected";
    const raceDescription =
      selectedRace?.description || "Choose a race to view genetic bonuses.";
    const racePassiveAbility = selectedRace?.passiveAbility || null;
    const raceActiveAbility = selectedRace
      ? getCharacterCreationRaceAbilitySummaries(selectedRace.id)[0] || null
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
      "Choose a System to shape progression, recommendations, and skills.";
    const professionName = selectedProfession?.name || "Profession not selected";
    const professionDescription =
      selectedProfession?.description ||
      "Choose a profession to gain tier-1 skills.";
    const professionSkills = Array.isArray(selectedProfession?.tierUnlocks?.[1]?.skills)
      ? selectedProfession.tierUnlocks[1].skills
      : null;
    const systemMatchSummaryParts = [];
    if (recommendedOriginIds.includes(selectedOrigin?.id)) {
      systemMatchSummaryParts.push(`Origin harmonizes with ${selectedArchetypeSystem?.name}.`);
    }
    if (recommendedRaceIds.includes(selectedRace?.id)) {
      systemMatchSummaryParts.push(`Race is a strong System match.`);
    }
    if (recommendedClassIds.includes(selectedClass?.id)) {
      systemMatchSummaryParts.push(`Class is favored by the selected System.`);
    }
    if (recommendedProfessionIds.includes(selectedProfession?.id)) {
      systemMatchSummaryParts.push(`Profession is boosted by the selected System.`);
    }
    if (systemAttributeBias?.primary?.length) {
      systemMatchSummaryParts.push(
        `Attribute bias: ${systemAttributeBias.primary.join(", ")} primary` +
          (systemAttributeBias.secondary?.length
            ? `, ${systemAttributeBias.secondary.join(", ")} secondary.`
            : "."),
      );
    }
    if (blockedSkillIds.length) {
      systemMatchSummaryParts.push(
        `${blockedSkillIds.length} elective skills were locked out by System rules.`,
      );
    }
    return {
      originName,
      originDescription,
      originBiome: selectedOrigin?.favoredBiome || null,
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
      systemMatchSummary: systemMatchSummaryParts.join(" "),
      activeSkills: selectedActiveSkills.length > 0 ? selectedActiveSkills : null,
      passiveSkills:
        selectedPassiveSkills.length > 0 ? selectedPassiveSkills : null,
      grantedActiveSkills,
      grantedPassiveSkills,
    };
  }, [
    blockedSkillIds.length,
    grantedActiveSkills,
    grantedPassiveSkills,
    recommendedClassIds,
    recommendedOriginIds,
    recommendedProfessionIds,
    recommendedRaceIds,
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    selectedOrigin,
    selectedProfession,
    selectedActiveSkills,
    selectedPassiveSkills,
    systemAttributeBias,
  ]);

  const canFinalize = useMemo(() => {
    const result = validateReview?.();
    return Boolean(result?.valid);
  }, [validateReview]);
  const completionById = useMemo(
    () => ({
      name: Boolean(characterName?.trim()),
      system: Boolean(selectedArchetypeSystem),
      identity: Boolean(selectedOrigin),
      race: Boolean(selectedRace),
      class: Boolean(selectedClass),
      multiclass: true,
      profession: Boolean(selectedProfession),
      attributes: availablePoints === 0,
      skills:
        selectedActiveSkills.length === MAX_ACTIVE_SKILLS &&
        selectedPassiveSkills.length === MAX_PASSIVE_SKILLS,
      perks:
        selectedPerkIds.length >= (creationPerkLimits?.minPicks || 0) &&
        selectedPerkIds.length <=
          (creationPerkLimits?.maxPicks || Number.MAX_SAFE_INTEGER),
      "starter-tree": !advancedUnlocked || selectedStarterTreeIds.length === 1,
      alignment: Boolean(selectedAlignmentId),
      review: canFinalize,
    }),
    [
      MAX_ACTIVE_SKILLS,
      MAX_PASSIVE_SKILLS,
      advancedUnlocked,
      availablePoints,
      canFinalize,
      characterName,
      creationPerkLimits?.maxPicks,
      creationPerkLimits?.minPicks,
      selectedActiveSkills.length,
      selectedAlignmentId,
      selectedArchetypeSystem,
      selectedClass,
      selectedOrigin,
      selectedPassiveSkills.length,
      selectedPerkIds.length,
      selectedProfession,
      selectedRace,
      selectedStarterTreeIds.length,
    ],
  );
  const syncProgress = useMemo(
    () => calculateCreationSyncProgress(creationFlow, completionById),
    [completionById, creationFlow],
  );

  useEffect(() => {
    emitCreationTelemetry(
      createTelemetryEvent("character_create_step_viewed", {
        data: {
          stepId: getCreationActiveStepId(creationFlow, currentStep),
          stepIndex: currentSequenceIndex + 1,
          stepCount: creationFlow.length,
        },
      }),
    );
  }, [creationFlow, currentSequenceIndex, currentStep, emitCreationTelemetry]);

  const handleFinalize = useCallback(async () => {
    setWizardError("");

    let result;
    try {
      result = finalizeCharacter();
    } catch (error) {
      setWizardError(error?.message || "Character finalization failed.");
      return;
    }

    if (!result?.valid || !result?.characterData) {
      const validationMessage =
        (Array.isArray(result?.errors) && result.errors.join(" ")) ||
        result?.error ||
        "Character finalization failed. Review your selections.";
      setWizardError(validationMessage);
      return;
    }

    if (typeof onComplete !== "function") {
      setWizardError("Character initialization callback is unavailable.");
      return;
    }

    try {
      await onComplete(result.characterData);
      emitCreationTelemetry(
        createTelemetryEvent("character_create_finished", {
          data: {
            stepCount: creationFlow.length,
            hasSecondaryClass: Boolean(result.characterData.secondaryClass),
            perkCount: Array.isArray(result.characterData.perks)
              ? result.characterData.perks.length
              : 0,
          },
        }),
      );
    } catch (error) {
      setWizardError(error?.message || "Character initialization failed.");
    }
  }, [creationFlow.length, emitCreationTelemetry, finalizeCharacter, onComplete]);

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
      {
        label: `System: ${selectedArchetypeSystem?.name || "pending"}`,
        active: Boolean(selectedArchetypeSystem),
      },
      { label: `Gender: ${gender || "optional"}`, active: true },
      {
        label: `Origin: ${selectedOrigin?.name || "pending"}`,
        active: Boolean(selectedOrigin),
      },
      {
        label: `Race: ${selectedRace?.name || "pending"}`,
        active: Boolean(selectedRace),
      },
      {
        label: `Class: ${selectedClass?.name || "pending"}`,
        active: Boolean(selectedClass),
      },
      advancedUnlocked
        ? {
            label: `Multiclass: ${selectedSecondaryClass?.name || "optional"}`,
            active: true,
          }
        : {
            label: "Mode: basic path",
            active: true,
          },
      {
        label: `Profession: ${selectedProfession?.name || "pending"}`,
        active: Boolean(selectedProfession),
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
        label: `Skills: ${selectedActiveSkills.length}/${MAX_ACTIVE_SKILLS} active, ${selectedPassiveSkills.length}/${MAX_PASSIVE_SKILLS} passive${grantedActiveSkills.length || grantedPassiveSkills.length ? ` + ${grantedActiveSkills.length + grantedPassiveSkills.length} granted` : ""}`,
        active:
          selectedActiveSkills.length >= MAX_ACTIVE_SKILLS &&
          selectedPassiveSkills.length >= MAX_PASSIVE_SKILLS,
      },
      {
        label: `Perks: ${selectedPerkIds.length}/${creationPerkLimits?.maxPicks || 0}`,
        active: completionById.perks,
      },
      advancedUnlocked
        ? {
            label: `Starter Tree: ${selectedStarterTreeIds[0] || "pending"}`,
            active: completionById["starter-tree"],
          }
        : {
            label: "Starter Tree: unlock after first character",
            active: true,
          },
      {
        label: `Alignment: ${selectedAlignmentId || "pending"}`,
        active: Boolean(selectedAlignmentId),
      },
    ],
    [
      advancedUnlocked,
      availablePoints,
      characterName,
      completionById,
      creationPerkLimits?.maxPicks,
      gender,
      grantedActiveSkills.length,
      grantedPassiveSkills.length,
      selectedOrigin,
      selectedActiveSkills.length,
      selectedAlignmentId,
      selectedClass,
      selectedArchetypeSystem,
      selectedPerkIds.length,
      selectedPassiveSkills.length,
      selectedRace,
      selectedSecondaryClass?.name,
      selectedStarterTreeIds,
      selectedProfession,
      MAX_ACTIVE_SKILLS,
      MAX_PASSIVE_SKILLS,
    ],
  );

  const creationMemoryEntries = useMemo(() => {
    const entries = [];
    if (characterName?.trim()) {
      entries.push({
        timestamp: "name",
        text: `Designation set: ${characterName.trim()}`,
      });
    }
    if (selectedArchetypeSystem) {
      entries.push({
        timestamp: "system",
        text: `System bound: ${selectedArchetypeSystem.name}`,
      });
    }
    if (selectedOrigin) {
      entries.push({
        timestamp: "origin",
        text: `Origin anchored: ${selectedOrigin.name}`,
      });
    }
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
    if (grantedActiveSkills.length || grantedPassiveSkills.length) {
      entries.push({
        timestamp: "system-grants",
        text: `System grants: ${[...grantedActiveSkills, ...grantedPassiveSkills]
          .map((skill) => skill.name || skill.id)
          .join(", ")}`,
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
    characterName,
    grantedActiveSkills,
    grantedPassiveSkills,
    selectedActiveSkills,
    selectedClass,
    selectedArchetypeSystem,
    selectedPassiveSkills,
    selectedOrigin,
    selectedRace,
    selectedProfession,
  ]);
  const latestEntry =
    creationMemoryEntries.length > 0
      ? creationMemoryEntries[creationMemoryEntries.length - 1]
      : null;
  const narrativeMemoryRef = useRef(null);

  const activePhase = useMemo(() => {
    if (currentStep === steps.NAME) {
      return (
        <CreationNamePanel
          characterName={characterName}
          onNameChange={(value) => {
            setWizardError("");
            setName(value);
          }}
        />
      );
    }
    if (currentStep === steps.ARCHETYPE) {
      return (
        <CreationArchetypeSystemPanel
          systems={availableArchetypeSystems}
          selectedSystem={selectedArchetypeSystem}
          onSystemSelect={(systemId) => {
            setWizardError("");
            handleArchetypeSystemSelect(systemId);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.IDENTITY) {
      return (
        <CreationIdentityPanel
          gender={gender}
          onGenderSelect={(value) => {
            setWizardError("");
            setGender(value);
          }}
          selectedOrigin={selectedOrigin}
          origins={availableOrigins}
          recommendedOriginIds={recommendedOriginIds}
          onOriginSelect={(origin) => {
            setWizardError("");
            handleOriginSelect(origin);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.RACE) {
      return (
        <CreationRacePanel
          selectedRace={selectedRace}
          races={availableRaces}
          recommendedRaceIds={recommendedRaceIds}
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
          classes={availableClasses}
          recommendedClassIds={recommendedClassIds}
          onClassSelect={(cls) => {
            setWizardError("");
            handleClassSelect(cls);
          }}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.MULTICLASS) {
      const classOptions = availableSecondaryClasses;
      return (
        <CreationChoicePanel
          title="Multiclass"
          subtitle="Optional secondary class. Select none to stay single-classed."
          options={classOptions}
          selectedIds={selectedSecondaryClass?.id ? [selectedSecondaryClass.id] : []}
          onToggle={(classId) => {
            const next = classOptions.find((entry) => entry.id === classId) || null;
            handleSecondaryClassSelect(next);
          }}
          allowNone={true}
          onSelectNone={() => handleSecondaryClassSelect(null)}
          noneLabel="None (Single Class)"
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.PROFESSION) {
      return (
        <CreationProfessionPanel
          selectedProfession={selectedProfession}
          professions={availableProfessions}
          recommendedProfessionIds={recommendedProfessionIds}
          onProfessionSelect={(profId) => {
            setWizardError("");
            handleProfessionSelect(profId);
          }}
          onAction={handleClick}
        />
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
            emitCreationTelemetry(
              createTelemetryEvent("character_create_randomize_used", {
                data: {
                  stepId: "attributes",
                },
              }),
            );
            handleReroll();
          }}
        />
      );
    }
    if (currentStep === steps.SKILLS) {
      return (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {availableCreationSkillLoadouts.length > 0 && (
            <CreationChoicePanel
              title="Skill Loadout"
              subtitle="Optional preset loadout; manual picks below always apply."
              options={availableCreationSkillLoadouts}
              selectedIds={selectedSkillLoadoutId ? [selectedSkillLoadoutId] : []}
              onToggle={handleSkillLoadoutSelect}
              allowNone={true}
              onSelectNone={() => handleSkillLoadoutSelect(null)}
              noneLabel="None (Manual Selection)"
              maxSelections={1}
              onAction={handleClick}
            />
          )}
          <CreationSkillsPanel
            selectedClass={selectedClass}
            selectedSystem={selectedArchetypeSystem}
            availableActiveSkills={availableActiveSkills}
            availablePassiveSkills={availablePassiveSkills}
            grantedActiveSkills={grantedActiveSkills}
            grantedPassiveSkills={grantedPassiveSkills}
            blockedSkillIds={blockedSkillIds}
            selectedActiveSkills={selectedActiveSkills}
            selectedPassiveSkills={selectedPassiveSkills}
            maxActiveSkills={MAX_ACTIVE_SKILLS}
            maxPassiveSkills={MAX_PASSIVE_SKILLS}
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
        </div>
      );
    }
    if (currentStep === steps.PERKS) {
      return (
        <CreationChoicePanel
          title="Perks"
          subtitle="Choose your starting perks."
          options={availableCreationPerks}
          selectedIds={selectedPerkIds}
          onToggle={handlePerkToggle}
          minSelections={creationPerkLimits?.minPicks || 0}
          maxSelections={creationPerkLimits?.maxPicks || 0}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.STARTER_TREE) {
      return (
        <CreationChoicePanel
          title="Starter Tree"
          subtitle="Choose your initial progression tree."
          options={availableCreationStarterTrees}
          selectedIds={selectedStarterTreeIds}
          onToggle={handleStarterTreeSelect}
          minSelections={1}
          maxSelections={1}
          onAction={handleClick}
        />
      );
    }
    if (currentStep === steps.ALIGNMENT) {
      return (
        <CreationChoicePanel
          title="Alignment"
          subtitle="Select narrative alignment for roleplay tone."
          options={availableCreationAlignments}
          selectedIds={selectedAlignmentId ? [selectedAlignmentId] : []}
          onToggle={handleAlignmentSelect}
          minSelections={1}
          maxSelections={1}
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
        maxActiveSkills={MAX_ACTIVE_SKILLS}
        maxPassiveSkills={MAX_PASSIVE_SKILLS}
        typewriterText={typewriterText}
        syncProgress={syncProgress}
        canFinalize={canFinalize}
        onFinalize={handleFinalize}
      />
    );
  }, [
    allocationPoints,
    asciiArt,
    availableActiveSkills,
    availableArchetypeSystems,
    availableClasses,
    availableOrigins,
    availablePassiveSkills,
    availablePoints,
    availableProfessions,
    availableRaces,
    availableSecondaryClasses,
    blockedSkillIds,
    canFinalize,
    characterName,
    currentStep,
    derivedStats,
    emitCreationTelemetry,
    gender,
    grantedActiveSkills,
    grantedPassiveSkills,
    handleClick,
    handleFinalize,
    handleActiveSkillSelect,
    handleArchetypeSystemSelect,
    handleClassSelect,
    handleOriginSelect,
    handleProfessionSelect,
    handleRaceSelect,
    handleReroll,
    handleStatChange,
    handlePassiveSkillToggle,
    handleSecondaryClassSelect,
    handlePerkToggle,
    handleStarterTreeSelect,
    handleAlignmentSelect,
    handleSkillLoadoutSelect,
    rerollsRemaining,
    recommendedClassIds,
    recommendedOriginIds,
    recommendedProfessionIds,
    recommendedRaceIds,
    selectedActiveSkills,
    selectedArchetypeSystem,
    selectedClass,
    selectedOrigin,
    selectedPassiveSkills,
    selectedPerkIds,
    selectedStarterTreeIds,
    selectedAlignmentId,
    selectedSkillLoadoutId,
    selectedSecondaryClass?.id,
    selectedProfession,
    selectedRace,
    availableCreationPerks,
    availableCreationStarterTrees,
    availableCreationAlignments,
    availableCreationSkillLoadouts,
    creationPerkLimits,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
    selectionSummary,
    setGender,
    setName,
    steps.ATTRIBUTES,
    steps.CLASS,
    steps.MULTICLASS,
    steps.PERKS,
    steps.IDENTITY,
    steps.ALIGNMENT,
    steps.NAME,
    steps.ARCHETYPE,
    steps.PROFESSION,
    steps.RACE,
    steps.SKILLS,
    steps.STARTER_TREE,
    syncProgress,
    typewriterText,
  ]);

  const wizardSteps = useMemo(
    () => buildCreationWizardSteps(creationFlow, currentStep, completionById),
    [completionById, creationFlow, currentStep],
  );

  const activeStepId = useMemo(
    () => getCreationActiveStepId(creationFlow, currentStep),
    [creationFlow, currentStep],
  );

  const canBack = currentSequenceIndex > 0;
  const canNext = currentSequenceIndex < creationFlow.length - 1;

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
            emitCreationTelemetry(
              createTelemetryEvent("character_create_step_completed", {
                data: {
                  stepId: activeStepId,
                  stepIndex: currentSequenceIndex + 1,
                  stepCount: creationFlow.length,
                },
              }),
            );
            nextStep();
          }}
          sidebar={
            <CreationNarrativePanel
              statusLines={statusLines}
              typewriterText={typewriterText}
              syncProgress={syncProgress}
              selectedOrigin={selectedOrigin}
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
