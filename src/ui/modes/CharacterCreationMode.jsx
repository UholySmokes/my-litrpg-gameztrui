import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildCharacterCreationDerivedState,
  useCharacterCreationReworked,
} from "../../hook/useCharacterCreationReworked.js";
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
import { ensureAttributeShape } from "../../constants/attributes.js";
import {
  buildCreationStepSequence,
  calculateCreationSyncProgress,
} from "../../core/characterCreationWizardFlow.js";
import {
  createTelemetryEvent,
  postTelemetryBatch,
} from "../../core/telemetryClient.js";
import {
  getCharacterCreationRaceAbilitySummaries,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";
import {
  buildCreationChamberManifest,
  validateCreationChamber,
} from "./creationChamberManifest.js";

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
  human: "\n    +-----------+\n    |   HUMAN   |\n    |   _____   |\n    |  / o o \\\\  |\n    | |   ^   | |\n    | |  '-'  | |\n    |  \\\\_____/  |\n    +-----------+",
  elf: "\n    +-----------+\n    |    ELF    |\n    |   /\\\\ /\\\\   |\n    |  / o o\\\\   |\n    | |   ^  |  |\n    | |  ___ |  |\n    |  \\\\____/   |\n    +-----------+",
  dwarf: "\n    +-----------+\n    |   DWARF   |\n    |  [#####]  |\n    |  | o o |  |\n    |  |  ^  |  |\n    |  | === |  |\n    |   \\\\___/   |\n    +-----------+",
  orc: "\n    +-----------+\n    |    ORC    |\n    |   _/^^\\\\_  |\n    |  / o  o\\\\  |\n    | |   ^^  | |\n    | |  ____ | |\n    |  \\\\______/ |\n    +-----------+",
  default: "\n    +-----------+\n    | ADVENTURER|\n    |   _____   |\n    |  / o o \\\\  |\n    | |   ^   | |\n    | |  ___  | |\n    |  \\\\_____/  |\n    +-----------+",
};

function playSystemSound(sound) {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

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
}

function ChamberSection({ eyebrow, title, children }) {
  return (
    <section className="creation-chamber__section">
      <div className="creation-chamber__section-header">
        <div className="creation-flow__eyebrow">{eyebrow}</div>
        <h3 className="surface-section__title">{title}</h3>
      </div>
      <div className="creation-chamber__section-body">{children}</div>
    </section>
  );
}

export default function CharacterCreationMode({
  onComplete,
  advancedUnlocked = false,
  telemetryUser = null,
}) {
  const creation = useCharacterCreationReworked({ advancedUnlocked });
  const {
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
    allocateAttributePoint,
    deallocateAttributePoint,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    handlePerkToggle,
    handleStarterTreeSelect,
    handleAlignmentSelect,
    handleSkillLoadoutSelect,
    finalizeCharacter,
    validateReview,
    MAX_ACTIVE_SKILLS,
    MAX_PASSIVE_SKILLS,
  } = creation;

  const chambers = useMemo(() => buildCreationChamberManifest(advancedUnlocked), [advancedUnlocked]);
  const [activeChamberIndex, setActiveChamberIndex] = useState(0);
  const [unlockedChamberIndex, setUnlockedChamberIndex] = useState(0);
  const [wizardError, setWizardError] = useState("");
  const narrativeMemoryRef = useRef(null);

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

  const allocationPoints = useMemo(() => ensureAttributeShape(attributePoints, 5), [attributePoints]);
  const availablePoints = remainingPoints || 0;
  const creationFlow = useMemo(() => buildCreationStepSequence(steps, advancedUnlocked), [advancedUnlocked, steps]);
  const derivedStats = useMemo(
    () =>
      buildCharacterCreationDerivedState({
        attributePoints: allocationPoints,
        selectedRace,
        selectedClass,
        selectedOrigin,
      }),
    [allocationPoints, selectedClass, selectedOrigin, selectedRace],
  );

  useEffect(() => {
    if (selectedClass?.id && CLASS_THEMES[selectedClass.id]) {
      const theme = CLASS_THEMES[selectedClass.id];
      document.documentElement.style.setProperty("--holo-primary", theme.primary);
      document.documentElement.style.setProperty("--holo-secondary", theme.secondary);
      document.documentElement.style.setProperty("--holo-accent", theme.accent);
      playSystemSound("theme_change");
    }
  }, [selectedClass]);

  const typewriterText = useMemo(() => {
    const description = [
      selectedArchetypeSystem?.summary,
      selectedOrigin?.description,
      selectedClass?.description,
      selectedRace?.description,
      selectedProfession?.description,
    ]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ");

    return (
      description ||
      "Bind a designation, then choose the system that will shape the rest of genesis."
    );
  }, [
    selectedArchetypeSystem?.summary,
    selectedClass,
    selectedOrigin,
    selectedProfession?.description,
    selectedRace,
  ]);

  const selectionSummary = useMemo(() => {
    const systemMatchSummaryParts = [];
    if (recommendedOriginIds.includes(selectedOrigin?.id)) {
      systemMatchSummaryParts.push(`Origin harmonizes with ${selectedArchetypeSystem?.name}.`);
    }
    if (recommendedRaceIds.includes(selectedRace?.id)) {
      systemMatchSummaryParts.push("Race is a strong system match.");
    }
    if (recommendedClassIds.includes(selectedClass?.id)) {
      systemMatchSummaryParts.push("Class is favored by the selected system.");
    }
    if (recommendedProfessionIds.includes(selectedProfession?.id)) {
      systemMatchSummaryParts.push("Profession is boosted by the selected system.");
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
        `${blockedSkillIds.length} elective skills were locked out by system rules.`,
      );
    }

    return {
      originName: selectedOrigin?.name || "Origin not selected",
      originDescription:
        selectedOrigin?.description ||
        "Choose an origin to shape starting stat pressure and world hooks.",
      originBiome: selectedOrigin?.favoredBiome || null,
      raceName: selectedRace?.name || "Race not selected",
      raceDescription: selectedRace?.description || "Choose a race to view inherited bonuses.",
      racePassiveAbility: selectedRace?.passiveAbility || null,
      raceActiveAbility: selectedRace
        ? getCharacterCreationRaceAbilitySummaries(selectedRace.id)[0] || null
        : null,
      className: selectedClass?.name || "Class not selected",
      classDescription: selectedClass?.description || "Choose a class to view combat doctrine.",
      talentName: selectedClass ? "Auto-assigned after creation" : "Talents pending",
      talentDescription: selectedClass
        ? `Talents will be assigned from the ${selectedClass.name} doctrine.`
        : "Select a class to determine the talent pool.",
      professionName: selectedProfession?.name || "Profession not selected",
      professionDescription:
        selectedProfession?.description ||
        "Choose a profession to gain tier-one support skills.",
      professionSkills: Array.isArray(selectedProfession?.tierUnlocks?.[1]?.skills)
        ? selectedProfession.tierUnlocks[1].skills
        : null,
      systemName: selectedArchetypeSystem?.name || "System not selected",
      systemDescription:
        selectedArchetypeSystem?.summary ||
        selectedArchetypeSystem?.description ||
        "Choose a system to shape recommendations, pressure lanes, and skills.",
      systemMatchSummary: systemMatchSummaryParts.join(" "),
      activeSkills: selectedActiveSkills.length > 0 ? selectedActiveSkills : null,
      passiveSkills: selectedPassiveSkills.length > 0 ? selectedPassiveSkills : null,
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
    selectedArchetypeSystem,
    selectedClass,
    selectedOrigin,
    selectedPassiveSkills,
    selectedProfession,
    selectedRace,
    selectedActiveSkills,
    systemAttributeBias,
  ]);

  const canFinalize = useMemo(() => Boolean(validateReview?.()?.valid), [validateReview]);

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

  const chamberChecks = useMemo(
    () => ({
      hasName: completionById.name,
      hasSystem: completionById.system,
      hasOrigin: completionById.identity,
      hasRace: completionById.race,
      hasClass: completionById.class,
      hasProfession: completionById.profession,
      attributesLocked: completionById.attributes,
      skillsLocked: completionById.skills,
      perksLocked: completionById.perks,
      starterTreeLocked: completionById["starter-tree"],
      alignmentLocked: completionById.alignment,
      canFinalize,
    }),
    [canFinalize, completionById],
  );

  const chamberCompletion = useMemo(
    () =>
      Object.fromEntries(
        chambers.map((chamber) => [
          chamber.id,
          chamber.includedSteps.every((stepId) => completionById[stepId] !== false),
        ]),
      ),
    [chambers, completionById],
  );

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
        : { label: "Mode: basic path", active: true },
      {
        label: `Profession: ${selectedProfession?.name || "pending"}`,
        active: Boolean(selectedProfession),
      },
      {
        label: `Attribute points: ${availablePoints === 0 ? "locked" : "open"}`,
        active: availablePoints === 0,
      },
      {
        label:
          `Skills: ${selectedActiveSkills.length}/${MAX_ACTIVE_SKILLS} active, ` +
          `${selectedPassiveSkills.length}/${MAX_PASSIVE_SKILLS} passive`,
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
        : { label: "Starter Tree: unlock after first character", active: true },
      {
        label: `Alignment: ${selectedAlignmentId || "pending"}`,
        active: Boolean(selectedAlignmentId),
      },
    ],
    [
      MAX_ACTIVE_SKILLS,
      MAX_PASSIVE_SKILLS,
      advancedUnlocked,
      availablePoints,
      characterName,
      completionById,
      creationPerkLimits?.maxPicks,
      gender,
      selectedActiveSkills.length,
      selectedAlignmentId,
      selectedArchetypeSystem,
      selectedClass,
      selectedOrigin,
      selectedPassiveSkills.length,
      selectedPerkIds.length,
      selectedProfession,
      selectedRace,
      selectedSecondaryClass?.name,
      selectedStarterTreeIds,
    ],
  );

  const creationMemoryEntries = useMemo(() => {
    const entries = [];
    if (characterName?.trim()) {
      entries.push({ timestamp: "name", text: `Designation set: ${characterName.trim()}` });
    }
    if (selectedArchetypeSystem) {
      entries.push({ timestamp: "system", text: `System bound: ${selectedArchetypeSystem.name}` });
    }
    if (selectedOrigin) {
      entries.push({ timestamp: "origin", text: `Origin anchored: ${selectedOrigin.name}` });
    }
    if (selectedRace) {
      entries.push({ timestamp: "race", text: `Race locked: ${selectedRace.name}` });
    }
    if (selectedClass) {
      entries.push({ timestamp: "class", text: `Class doctrine: ${selectedClass.name}` });
    }
    if (selectedProfession) {
      entries.push({ timestamp: "profession", text: `Profession chosen: ${selectedProfession.name}` });
    }
    return entries;
  }, [
    characterName,
    selectedArchetypeSystem,
    selectedClass,
    selectedOrigin,
    selectedProfession,
    selectedRace,
  ]);

  const latestEntry =
    creationMemoryEntries.length > 0
      ? creationMemoryEntries[creationMemoryEntries.length - 1]
      : null;
  const activeChamber = chambers[activeChamberIndex] || chambers[0];
  const asciiArt = selectedRace ? RACE_ASCII[selectedRace.id] || RACE_ASCII.default : RACE_ASCII.default;

  useEffect(() => {
    emitCreationTelemetry(
      createTelemetryEvent("character_create_step_viewed", {
        data: {
          chamberId: activeChamber.id,
          chamberIndex: activeChamberIndex + 1,
          chamberCount: chambers.length,
        },
      }),
    );
  }, [activeChamber.id, activeChamberIndex, chambers.length, emitCreationTelemetry]);

  const handleClick = useCallback((action) => {
    playSystemSound("click");
    action();
  }, []);

  const handleFinalize = useCallback(async () => {
    setWizardError("");
    const result = finalizeCharacter();
    if (!result?.valid || !result?.characterData) {
      setWizardError(
        (Array.isArray(result?.errors) && result.errors.join(" ")) ||
          result?.error ||
          "Character finalization failed. Review your selections.",
      );
      return;
    }
    try {
      await onComplete?.(result.characterData);
      emitCreationTelemetry(
        createTelemetryEvent("character_create_finished", {
          data: {
            chamberCount: chambers.length,
            hasSecondaryClass: Boolean(result.characterData.secondaryClass),
          },
        }),
      );
    } catch (error) {
      setWizardError(error?.message || "Character initialization failed.");
    }
  }, [chambers.length, emitCreationTelemetry, finalizeCharacter, onComplete]);

  const handleNext = () => {
    const validation = validateCreationChamber(activeChamber.id, chamberChecks);
    if (!validation.valid) {
      setWizardError(validation.error);
      return;
    }

    emitCreationTelemetry(
      createTelemetryEvent("character_create_step_completed", {
        data: {
          chamberId: activeChamber.id,
          chamberIndex: activeChamberIndex + 1,
          chamberCount: chambers.length,
        },
      }),
    );

    const nextIndex = Math.min(activeChamberIndex + 1, chambers.length - 1);
    setUnlockedChamberIndex((current) => Math.max(current, nextIndex));
    setActiveChamberIndex(nextIndex);
    setWizardError("");
  };

  const navigateToChamber = (index) => {
    if (index < 0 || index > unlockedChamberIndex || index >= chambers.length) return;
    setWizardError("");
    setActiveChamberIndex(index);
  };

  const chamberBody = (() => {
    switch (activeChamber.id) {
      case "binding-hall":
        return (
          <div className="creation-chamber__grid creation-chamber__grid--split">
            <ChamberSection eyebrow="Designation" title="Mark the chronicle">
              <CreationNamePanel
                characterName={characterName}
                onNameChange={(value) => {
                  setWizardError("");
                  setName(value);
                }}
              />
            </ChamberSection>
            <ChamberSection eyebrow="System" title="Bind the lattice">
              <CreationArchetypeSystemPanel
                systems={availableArchetypeSystems}
                selectedSystem={selectedArchetypeSystem}
                onSystemSelect={(systemId) => {
                  setWizardError("");
                  handleArchetypeSystemSelect(systemId);
                }}
                onAction={handleClick}
              />
            </ChamberSection>
          </div>
        );
      case "lineage-vault":
        return (
          <div className="creation-chamber__grid creation-chamber__grid--split">
            <ChamberSection eyebrow="Identity" title="Anchor the self">
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
            </ChamberSection>
            <ChamberSection eyebrow="Lineage" title="Choose inherited form">
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
            </ChamberSection>
          </div>
        );
      case "doctrine-forge":
        return (
          <div className="creation-chamber__stack">
            <ChamberSection eyebrow="Class" title="Set the primary doctrine">
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
            </ChamberSection>
            {advancedUnlocked ? (
              <ChamberSection eyebrow="Multiclass" title="Optional branching doctrine">
                <CreationChoicePanel
                  title="Multiclass"
                  subtitle="Optional secondary class. Select none to remain single-classed."
                  options={availableSecondaryClasses}
                  selectedIds={selectedSecondaryClass?.id ? [selectedSecondaryClass.id] : []}
                  onToggle={(classId) => {
                    const next =
                      availableSecondaryClasses.find((entry) => entry.id === classId) || null;
                    handleSecondaryClassSelect(next);
                  }}
                  allowNone={true}
                  onSelectNone={() => handleSecondaryClassSelect(null)}
                  noneLabel="None (Single Class)"
                  onAction={handleClick}
                />
              </ChamberSection>
            ) : null}
            <ChamberSection eyebrow="Profession" title="Add the opening craft">
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
            </ChamberSection>
          </div>
        );
      case "soul-crucible":
        return (
          <div className="creation-chamber__stack">
            <ChamberSection eyebrow="Attributes" title="Distribute core power">
              <CreationAttributesPanel
                allocationPoints={allocationPoints}
                derivedStats={derivedStats}
                availablePoints={availablePoints}
                onStatChange={(stat, delta) => {
                  setWizardError("");
                  if (delta > 0) {
                    allocateAttributePoint(stat);
                  } else {
                    deallocateAttributePoint(stat);
                  }
                }}
                onAction={handleClick}
                rerollsRemaining={rerollsRemaining}
                onReroll={() => {
                  setWizardError("");
                  handleReroll();
                }}
              />
            </ChamberSection>
            <ChamberSection eyebrow="Skills" title="Assemble active and passive loadout">
              <div className="creation-chamber__stack">
                {availableCreationSkillLoadouts.length > 0 ? (
                  <CreationChoicePanel
                    title="Skill Loadout"
                    subtitle="Optional preset loadout. Manual picks below still apply."
                    options={availableCreationSkillLoadouts}
                    selectedIds={selectedSkillLoadoutId ? [selectedSkillLoadoutId] : []}
                    onToggle={handleSkillLoadoutSelect}
                    allowNone={true}
                    onSelectNone={() => handleSkillLoadoutSelect(null)}
                    noneLabel="None (Manual Selection)"
                    maxSelections={1}
                    onAction={handleClick}
                  />
                ) : null}
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
            </ChamberSection>
            <ChamberSection eyebrow="Perks" title="Select starting mutations">
              <CreationChoicePanel
                title="Perks"
                subtitle="Choose the starting perk package."
                options={availableCreationPerks}
                selectedIds={selectedPerkIds}
                onToggle={handlePerkToggle}
                minSelections={creationPerkLimits?.minPicks || 0}
                maxSelections={creationPerkLimits?.maxPicks || 0}
                onAction={handleClick}
              />
            </ChamberSection>
            {advancedUnlocked ? (
              <ChamberSection eyebrow="Starter Tree" title="Prime the first progression tree">
                <CreationChoicePanel
                  title="Starter Tree"
                  subtitle="Choose the initial progression tree."
                  options={availableCreationStarterTrees}
                  selectedIds={selectedStarterTreeIds}
                  onToggle={handleStarterTreeSelect}
                  minSelections={1}
                  maxSelections={1}
                  onAction={handleClick}
                />
              </ChamberSection>
            ) : null}
            <ChamberSection eyebrow="Alignment" title="Select roleplay tone">
              <CreationChoicePanel
                title="Alignment"
                subtitle="Choose the narrative alignment that colors the run."
                options={availableCreationAlignments}
                selectedIds={selectedAlignmentId ? [selectedAlignmentId] : []}
                onToggle={handleAlignmentSelect}
                minSelections={1}
                maxSelections={1}
                onAction={handleClick}
              />
            </ChamberSection>
          </div>
        );
      default:
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
    }
  })();

  return (
    <section className="creation-flow creation-flow--chambers">
      <header className="creation-flow__hero creation-flow__hero--chambers">
        <div className="creation-flow__eyebrow">Character Genesis</div>
        <h2 className="creation-flow__title">Walk the chamber sequence.</h2>
        <p className="creation-flow__copy">
          Each chamber resolves a different piece of the chronicle. Bind the system,
          shape the vessel, and seal the oath only when the full pattern is stable.
        </p>
        <div className="creation-flow__status-list">
          {statusLines.slice(0, 8).map((line) => (
            <div
              key={line.label}
              className={[
                "creation-flow__status-pill",
                line.active ? "creation-flow__status-pill--active" : "",
              ].filter(Boolean).join(" ")}
            >
              {line.label}
            </div>
          ))}
        </div>
        <div className="creation-chamber__nav">
          {chambers.map((chamber, index) => (
            <button
              key={chamber.id}
              type="button"
              className={[
                "creation-chamber__nav-item",
                index === activeChamberIndex ? "creation-chamber__nav-item--active" : "",
                chamberCompletion[chamber.id] ? "creation-chamber__nav-item--done" : "",
              ].filter(Boolean).join(" ")}
              disabled={index > unlockedChamberIndex}
              onClick={() => navigateToChamber(index)}
            >
              <span>{`0${index + 1}`}</span>
              <strong>{chamber.title}</strong>
              <em>{chamberCompletion[chamber.id] ? "stable" : "pending"}</em>
            </button>
          ))}
        </div>
      </header>

      {wizardError ? <div className="creation-flow__error">{wizardError}</div> : null}

      <div className="creation-flow__frame creation-flow__frame--chambers">
        <aside className="creation-flow__sidebar">
          <div className="creation-flow__sidebar-card">
            <CreationNarrativePanel
              statusLines={statusLines}
              typewriterText={typewriterText}
              syncProgress={syncProgress}
              selectedOrigin={selectedOrigin}
              selectedRace={selectedRace}
              selectedClass={selectedClass}
              selectedArchetypeSystem={selectedArchetypeSystem}
            />
          </div>
          <div className="creation-flow__sidebar-card">
            <NarrativeMemoryPanel
              summary=""
              entries={creationMemoryEntries}
              latestEntry={latestEntry}
              latestEntryText={latestEntry?.text || ""}
              containerRef={narrativeMemoryRef}
            />
          </div>
        </aside>

        <div className="creation-flow__main">
          <div className="creation-flow__main-card creation-flow__main-card--chamber">
            <div className="creation-chamber__header">
              <div className="creation-flow__eyebrow">Active Chamber</div>
              <h3 className="surface-section__title">{activeChamber.title}</h3>
              <p className="creation-chamber__subtitle">{activeChamber.subtitle}</p>
            </div>
            {chamberBody}
          </div>
          <div className="creation-flow__actions">
            <button
              type="button"
              className="holo-button"
              disabled={activeChamberIndex === 0}
              onClick={() => navigateToChamber(activeChamberIndex - 1)}
            >
              Previous Chamber
            </button>
            {activeChamberIndex < chambers.length - 1 ? (
              <button type="button" className="holo-button holo-button--solid" onClick={handleNext}>
                Open Next Chamber
              </button>
            ) : (
              <button
                type="button"
                className="holo-button holo-button--solid"
                disabled={!canFinalize}
                onClick={handleFinalize}
              >
                Seal The Oath
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
