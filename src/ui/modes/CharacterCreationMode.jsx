import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildCharacterCreationDerivedState,
  useCharacterCreationReworked,
} from "../../hook/useCharacterCreationReworked.js";
import NarrativeMemoryPanel from "../panels/NarrativeMemoryPanel.jsx";
import CreationNarrativePanel from "../panels/CreationNarrativePanel.jsx";
import CreationNamePanel from "../panels/creation/CreationNamePanel.jsx";
import CreationRacePanel from "../panels/creation/CreationRacePanel.jsx";
import CreationClassPanel from "../panels/creation/CreationClassPanel.jsx";
import CreationProfessionPanel from "../panels/creation/CreationProfessionPanel.jsx";
import CreationAttributesPanel from "../panels/creation/CreationAttributesPanel.jsx";
import CreationSkillsPanel from "../panels/creation/CreationSkillsPanel.jsx";
import CreationChoicePanel from "../panels/creation/CreationChoicePanel.jsx";
import CreationArchetypeSystemPanel from "../panels/creation/CreationArchetypeSystemPanel.jsx";
import CreationSummaryPanel from "../panels/creation/CreationSummaryPanel.jsx";
import CreationStartingPointPanel from "../panels/creation/CreationStartingPointPanel.jsx";
import CreationImpactPreviewPanel from "../panels/creation/CreationImpactPreviewPanel.jsx";
import { ensureAttributeShape } from "../../constants/attributes.js";
import {
  buildCreationStepSequence,
  calculateCreationSyncProgress,
} from "../../core/characterCreationWizardFlow.js";
import {
  buildStarterKitPreview,
  mergeCreationOnboardingData,
} from "../../core/creationOnboarding.js";
import {
  createTelemetryEvent,
  postTelemetryBatch,
} from "../../core/telemetryClient.js";
import {
  patchCharacterCreationDraft,
  readCharacterCreationDraft,
} from "../../components/gameui/characterCreationDraft.js";
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

function summarizePositiveBonuses(entry = {}, limit = 2) {
  return Object.entries(entry || {})
    .filter(([, value]) => Number(value) > 0)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, limit)
    .map(([key, value]) => `+${value} ${key}`);
}

function summarizeNames(values = [], limit = 3) {
  return (Array.isArray(values) ? values : [])
    .map((value) => (typeof value === "string" ? value : value?.name || value?.id || ""))
    .filter(Boolean)
    .slice(0, limit)
    .join(", ");
}

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

function CollapsibleChamberSection({ eyebrow, title, summaryText, isOpen, onToggle, children }) {
  return (
    <section className="creation-chamber__section">
      <button
        type="button"
        className="creation-chamber__section-header creation-chamber__section-header--collapsible"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ cursor: "pointer", background: "none", border: "none", padding: 0, width: "100%", textAlign: "left", color: "inherit", font: "inherit" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>&#9654;</span>
          <div className="creation-flow__eyebrow">{eyebrow}</div>
        </div>
        <h3 className="surface-section__title">{title}</h3>
        {!isOpen && summaryText ? (
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>{summaryText}</div>
        ) : null}
      </button>
      {isOpen ? <div className="creation-chamber__section-body">{children}</div> : null}
    </section>
  );
}

function SoulCrucibleSummaryStrip({ raceName, className, systemName, completionById, advancedUnlocked }) {
  const steps = ["attributes", "skills", "perks", ...(advancedUnlocked ? ["starter-tree"] : []), "alignment"];
  const done = steps.filter((s) => completionById[s]).length;
  return (
    <div
      className="creation-chamber__summary-strip"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        background: "rgba(7, 13, 22, 0.85)",
        border: "1px solid color-mix(in srgb, var(--holo-cyan) 20%, transparent)",
        fontSize: "0.8rem",
        color: "var(--text-dim)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "var(--holo-cyan)" }}>{raceName}</span>
      <span>·</span>
      <span style={{ color: "var(--holo-cyan)" }}>{className}</span>
      <span>·</span>
      <span style={{ color: "var(--holo-cyan)" }}>{systemName}</span>
      <span style={{ marginLeft: "auto", opacity: 0.7 }}>{done}/{steps.length} complete</span>
    </div>
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
    startingPrompt,
    optimizedStartingPromptOptions,
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
    availableRaces,
    availableClasses,
    availableSecondaryClasses,
    availableProfessions,
    availableActiveSkills,
    availablePassiveSkills,
    availableArchetypeSystems,
    availableStartingPoints,
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
    starterTreeLimits,
    rerollsRemaining,
    handleStartingPromptChange,
    handleOptimizeStartingPrompt,
    applyStartingPromptSuggestion,
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
  const initialDraft = useMemo(() => readCharacterCreationDraft(), []);
  const [activeChamberIndex, setActiveChamberIndex] = useState(
    Number.isFinite(initialDraft?.activeChamberIndex) ? initialDraft.activeChamberIndex : 0,
  );
  const [unlockedChamberIndex, setUnlockedChamberIndex] = useState(
    Number.isFinite(initialDraft?.unlockedChamberIndex) ? initialDraft.unlockedChamberIndex : 0,
  );
  const [wizardError, setWizardError] = useState("");
  const [openCrucibleSections, setOpenCrucibleSections] = useState({});
  const [selectedStartingPoint, setSelectedStartingPoint] = useState(
    () =>
      availableStartingPoints.find((point) => point.id === initialDraft?.selectedStartingPointId) ||
      null,
  );
  const narrativeMemoryRef = useRef(null);

  useEffect(() => {
    patchCharacterCreationDraft({
      activeChamberIndex,
      unlockedChamberIndex,
      selectedStartingPointId: selectedStartingPoint?.id || null,
    });
  }, [activeChamberIndex, selectedStartingPoint?.id, unlockedChamberIndex]);

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
      }),
    [allocationPoints, selectedClass, selectedRace],
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
    selectedProfession?.description,
    selectedRace,
  ]);

  const starterKitPreview = useMemo(
    () =>
      buildStarterKitPreview({
        class: selectedClass,
        profession: selectedProfession,
      }),
    [selectedClass, selectedProfession],
  );

  const selectionSummary = useMemo(() => {
    const systemMatchSummaryParts = [];
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
      raceName: selectedRace?.name || "Lineage Unbound",
      raceDescription: selectedRace?.description || "Choose a race to view inherited bonuses.",
      racePassiveAbility: selectedRace?.passiveAbility || null,
      raceActiveAbility: selectedRace
        ? getCharacterCreationRaceAbilitySummaries(selectedRace.id)[0] || null
        : null,
      className: selectedClass?.name || "Doctrine Unformed",
      classDescription: selectedClass?.description || "Choose a class to view combat doctrine.",
      talentName: selectedClass ? "Auto-assigned after creation" : "Talents pending",
      talentDescription: selectedClass
        ? `Talents will be assigned from the ${selectedClass.name} doctrine.`
        : "Select a class to determine the talent pool.",
      professionName: selectedProfession?.name || "Path Undefined",
      professionDescription:
        selectedProfession?.description ||
        "Choose a profession to gain tier-one support skills.",
      professionSkills: Array.isArray(selectedProfession?.tierUnlocks?.[1]?.skills)
        ? selectedProfession.tierUnlocks[1].skills
        : null,
      systemName: selectedArchetypeSystem?.name || "Awaiting System Governance",
      systemDescription:
        selectedArchetypeSystem?.summary ||
        selectedArchetypeSystem?.description ||
        "Choose a system to shape recommendations, pressure lanes, and skills.",
      systemMatchSummary: systemMatchSummaryParts.join(" "),
      activeSkills: selectedActiveSkills.length > 0 ? selectedActiveSkills : null,
      passiveSkills: selectedPassiveSkills.length > 0 ? selectedPassiveSkills : null,
      grantedActiveSkills,
      grantedPassiveSkills,
      startingPrompt:
        startingPrompt?.trim() || "Write how the run begins to lock the opening handoff.",
      originName: selectedStartingPoint?.name || "Origin not selected",
      originDescription: selectedStartingPoint?.summary || "Choose an origin to shape your opening pressures.",
      originBiome: selectedStartingPoint?.type || null,
      starterKitLabel: starterKitPreview.starterKitLabel,
      starterWeaponName: starterKitPreview.weapon?.name || null,
      starterArmorName: starterKitPreview.armor?.name || null,
      starterSupportName: starterKitPreview.supportItem?.name || null,
      starterConsumableName: starterKitPreview.consumable?.name || null,
    };
  }, [
    blockedSkillIds.length,
    grantedActiveSkills,
    grantedPassiveSkills,
    recommendedClassIds,
    recommendedProfessionIds,
    recommendedRaceIds,
    selectedArchetypeSystem,
    selectedClass,
    selectedPassiveSkills,
    selectedProfession,
    selectedRace,
    selectedActiveSkills,
    selectedStartingPoint,
    starterKitPreview,
    startingPrompt,
    systemAttributeBias,
  ]);

  const canFinalize = useMemo(() => Boolean(validateReview?.()?.valid), [validateReview]);
  const canSealChronicle = canFinalize && Boolean(selectedStartingPoint);

  const completionById = useMemo(
    () => ({
      name: Boolean(characterName?.trim()),
      system: Boolean(selectedArchetypeSystem),
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
      "starter-tree":
        !advancedUnlocked ||
        (selectedStarterTreeIds.length >= (starterTreeLimits?.minPicks || 0) &&
          selectedStarterTreeIds.length <=
            (starterTreeLimits?.maxPicks || Number.MAX_SAFE_INTEGER)),
      alignment: Boolean(selectedAlignmentId),
      "starting-point": Boolean(selectedStartingPoint && startingPrompt?.trim()),
      review: canSealChronicle,
    }),
    [
      MAX_ACTIVE_SKILLS,
      MAX_PASSIVE_SKILLS,
      advancedUnlocked,
      availablePoints,
      canFinalize,
      canSealChronicle,
      characterName,
      creationPerkLimits?.maxPicks,
      creationPerkLimits?.minPicks,
      starterTreeLimits?.maxPicks,
      starterTreeLimits?.minPicks,
      selectedActiveSkills.length,
      selectedAlignmentId,
      selectedArchetypeSystem,
      selectedClass,
      startingPrompt,
      selectedPassiveSkills.length,
      selectedPerkIds.length,
      selectedProfession,
      selectedRace,
      selectedStartingPoint,
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
      hasRace: completionById.race,
      hasClass: completionById.class,
      hasProfession: completionById.profession,
      attributesLocked: completionById.attributes,
      skillsLocked: completionById.skills,
      perksLocked: completionById.perks,
      starterTreeLocked: completionById["starter-tree"],
      requiresStarterTree:
        advancedUnlocked && (starterTreeLimits?.minPicks || 0) > 0,
      alignmentLocked: completionById.alignment,
      hasOrigin: Boolean(selectedStartingPoint),
      hasStartingPrompt: completionById["starting-point"],
      canFinalize: canSealChronicle,
    }),
    [advancedUnlocked, canSealChronicle, completionById, selectedStartingPoint, starterTreeLimits?.minPicks],
  );

  // Clear validation errors when the player makes a selection that changes chamber checks.
  useEffect(() => {
    setWizardError((prev) => (prev ? "" : prev));
  }, [chamberChecks]);

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
            label: `Starter Tree: ${selectedStarterTreeIds[0] || "optional"}`,
            active: completionById["starter-tree"],
          }
        : { label: "Starter Tree: unlock after first character", active: true },
      {
        label: `Alignment: ${selectedAlignmentId || "pending"}`,
        active: Boolean(selectedAlignmentId),
      },
      {
        label: `Start Command: ${startingPrompt?.trim() ? "ready" : "pending"}`,
        active: Boolean(startingPrompt?.trim()),
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
      starterTreeLimits?.minPicks,
      selectedActiveSkills.length,
      selectedAlignmentId,
      selectedArchetypeSystem,
      selectedClass,
      startingPrompt,
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
              <div className="creation-gender-select" style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", opacity: 0.7 }}>Gender (optional)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {["male", "female", "non-binary", "other"].map((g) => (
                    <button
                      key={g}
                      className={`creation-option-btn ${gender === g ? "creation-option-btn--selected" : ""}`}
                      onClick={() => { setWizardError(""); setGender(gender === g ? "" : g); }}
                      style={{ textTransform: "capitalize", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
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
      case "soul-crucible": {
        const crucibleSections = [
          { id: "attributes", eyebrow: "Attributes", title: "Distribute core power", summaryText: completionById.attributes ? `${availablePoints === 0 ? "All" : availablePoints} points allocated` : null },
          { id: "skills", eyebrow: "Skills", title: "Assemble active and passive loadout", summaryText: completionById.skills ? `${selectedActiveSkills.length} active, ${selectedPassiveSkills.length} passive` : null },
          { id: "perks", eyebrow: "Perks", title: "Select starting mutations", summaryText: completionById.perks ? `${selectedPerkIds.length} perk${selectedPerkIds.length !== 1 ? "s" : ""} chosen` : null },
          ...(advancedUnlocked
            ? [{
                id: "starter-tree",
                eyebrow: "Starter Tree",
                title: "Prime the first progression tree",
                summaryText: completionById["starter-tree"]
                  ? selectedStarterTreeIds.length > 0
                    ? `${selectedStarterTreeIds.length} tree selected`
                    : "Optional: none selected"
                  : null,
              }]
            : []),
          { id: "alignment", eyebrow: "Alignment", title: "Select roleplay tone", summaryText: completionById.alignment ? "Alignment set" : null },
        ];
        const firstIncompleteIdx = crucibleSections.findIndex((s) => !completionById[s.id]);
        const autoOpenIdx = firstIncompleteIdx === -1 ? crucibleSections.length - 1 : firstIncompleteIdx;
        return (
          <div className="creation-chamber__stack">
            <SoulCrucibleSummaryStrip
              raceName={selectionSummary.raceName}
              className={selectionSummary.className}
              systemName={selectionSummary.systemName}
              completionById={completionById}
              advancedUnlocked={advancedUnlocked}
            />
            {crucibleSections.map((sec, idx) => {
              const isOpen = idx === autoOpenIdx || (openCrucibleSections && openCrucibleSections[sec.id]);
              const toggle = () => setOpenCrucibleSections((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }));
              switch (sec.id) {
                case "attributes":
                  return (
                    <CollapsibleChamberSection key={sec.id} eyebrow={sec.eyebrow} title={sec.title} summaryText={sec.summaryText} isOpen={isOpen} onToggle={toggle}>
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
                    </CollapsibleChamberSection>
                  );
                case "skills":
                  return (
                    <CollapsibleChamberSection key={sec.id} eyebrow={sec.eyebrow} title={sec.title} summaryText={sec.summaryText} isOpen={isOpen} onToggle={toggle}>
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
                    </CollapsibleChamberSection>
                  );
                case "perks":
                  return (
                    <CollapsibleChamberSection key={sec.id} eyebrow={sec.eyebrow} title={sec.title} summaryText={sec.summaryText} isOpen={isOpen} onToggle={toggle}>
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
                    </CollapsibleChamberSection>
                  );
                case "starter-tree":
                  return (
                    <CollapsibleChamberSection key={sec.id} eyebrow={sec.eyebrow} title={sec.title} summaryText={sec.summaryText} isOpen={isOpen} onToggle={toggle}>
                      <CreationChoicePanel
                        title="Starter Tree"
                        subtitle="Optional initial progression tree. Select none to begin without one."
                        options={availableCreationStarterTrees}
                        selectedIds={selectedStarterTreeIds}
                        onToggle={handleStarterTreeSelect}
                        minSelections={starterTreeLimits?.minPicks || 0}
                        maxSelections={starterTreeLimits?.maxPicks || 1}
                        allowNone={true}
                        onSelectNone={() => handleStarterTreeSelect(null)}
                        noneLabel="None (Optional)"
                        onAction={handleClick}
                      />
                    </CollapsibleChamberSection>
                  );
                case "alignment":
                  return (
                    <CollapsibleChamberSection key={sec.id} eyebrow={sec.eyebrow} title={sec.title} summaryText={sec.summaryText} isOpen={isOpen} onToggle={toggle}>
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
                    </CollapsibleChamberSection>
                  );
                default:
                  return null;
              }
            })}
          </div>
        );
      }
      case "oath-mirror":
        return (
          <div className="creation-chamber__stack">
            <ChamberSection eyebrow="Origin" title="Choose where consciousness returns">
              <p style={{ fontSize: "0.82rem", opacity: 0.72, marginBottom: "1rem", lineHeight: 1.5 }}>
                The origin locks the biome pressure, opening contacts, and environmental texture of your first scene.
                It is optional but shapes every opening beat.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
                  gap: "0.65rem",
                }}
              >
                {availableStartingPoints.map((point) => {
                  const isSelected = selectedStartingPoint?.id === point.id;
                  const biomeColors = {
                    social: { bg: "rgba(155, 89, 182, 0.15)", border: "rgba(155, 89, 182, 0.55)", badge: "#c77dff" },
                    exploration: { bg: "rgba(0, 180, 120, 0.12)", border: "rgba(0, 200, 130, 0.45)", badge: "#4ade9a" },
                    combat: { bg: "rgba(220, 60, 60, 0.12)", border: "rgba(230, 80, 60, 0.45)", badge: "#ff6b6b" },
                  };
                  const colors = biomeColors[point.type] || biomeColors.exploration;
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedStartingPoint(isSelected ? null : point)}
                      style={{
                        textAlign: "left",
                        background: isSelected ? colors.bg : "rgba(2, 8, 18, 0.7)",
                        border: `1px solid ${isSelected ? colors.border : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "10px",
                        padding: "0.85rem 0.9rem",
                        cursor: "pointer",
                        transition: "border-color 0.18s, background 0.18s, box-shadow 0.18s",
                        boxShadow: isSelected ? `0 0 12px ${colors.border}` : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <strong style={{ fontSize: "0.88rem", color: isSelected ? "var(--text-main)" : "var(--text-dim)", lineHeight: 1.2 }}>
                          {point.name}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: colors.badge,
                            border: `1px solid ${colors.badge}`,
                            borderRadius: "4px",
                            padding: "0.05rem 0.35rem",
                            flexShrink: 0,
                          }}
                        >
                          {point.type}
                        </span>
                        {isSelected && (
                          <span style={{ marginLeft: "auto", color: colors.badge, fontSize: "0.75rem", flexShrink: 0 }}>✓</span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.76rem", color: "var(--text-dim)", lineHeight: 1.45, margin: 0 }}>
                        {point.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ChamberSection>
            <ChamberSection eyebrow="Start Command" title="Write how the chronicle begins">
              <CreationStartingPointPanel
                startingPrompt={startingPrompt}
                onStartingPromptChange={(value) => {
                  setWizardError("");
                  handleStartingPromptChange(value);
                }}
                onOptimizePrompt={() => {
                  setWizardError("");
                  handleOptimizeStartingPrompt();
                }}
                optimizedPromptAlternates={optimizedStartingPromptOptions}
                onSelectAlternate={(value) => {
                  setWizardError("");
                  applyStartingPromptSuggestion(value);
                }}
              />
            </ChamberSection>
            <ChamberSection eyebrow="Review" title="Seal the chronicle">
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
