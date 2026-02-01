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
import CreationAttributesPanel from "../panels/creation/CreationAttributesPanel.jsx";
import CreationSkillsPanel from "../panels/creation/CreationSkillsPanel.jsx";
import CreationArchetypeSystemPanel from "../panels/creation/CreationArchetypeSystemPanel.jsx";
import CreationSummaryPanel from "../panels/creation/CreationSummaryPanel.jsx";

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
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
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
    setName,
    setGender,
    allocateAttributePoint: handleStatIncrement,
    deallocateAttributePoint: handleStatDecrement,
    handleReroll,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    finalizeCharacter,
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
    return {
      raceName,
      raceDescription,
      className,
      classDescription,
      talentName,
      talentDescription,
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
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  useEffect(() => {
    const stepValue = 100 / 7;
    let progress = 0;
    if (characterName && characterName.trim().length > 0) progress += stepValue;
    if (gender) progress += stepValue;
    if (selectedRace) progress += stepValue;
    if (selectedClass) progress += stepValue;
    if (selectedArchetypeSystem) progress += stepValue;
    if (availablePoints === 0) progress += stepValue;
    if (selectedActiveSkills?.length >= 3 && selectedPassiveSkills?.length >= 6)
      progress += stepValue;
    setSyncProgress(Math.min(100, progress));
  }, [
    characterName,
    gender,
    selectedRace,
    selectedClass,
    selectedArchetypeSystem,
    availablePoints,
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  const canFinalize =
    characterName &&
    characterName.trim().length > 0 &&
    gender &&
    selectedRace &&
    selectedClass &&
    selectedArchetypeSystem &&
    availablePoints === 0 &&
    selectedActiveSkills?.length >= 3 &&
    selectedPassiveSkills?.length >= 6;

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
        label: `Skills: ${selectedActiveSkills.length}/3 active, ${selectedPassiveSkills.length}/6 passive`,
        active:
          selectedActiveSkills.length >= 3 && selectedPassiveSkills.length >= 6,
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
  ]);
  const latestEntry =
    creationMemoryEntries.length > 0
      ? creationMemoryEntries[creationMemoryEntries.length - 1]
      : null;
  const narrativeMemoryRef = useRef(null);

  const windows = [
    {
      id: "identity",
      title: "Identity",
      dockZone: "float",
      position: { x: 40, y: 80 },
      size: { w: 320, h: 240 },
      minWidth: 260,
      minHeight: 200,
      content: (
        <CreationIdentityPanel
          characterName={characterName}
          onNameChange={setName}
          gender={gender}
          onGenderSelect={setGender}
          onAction={handleClick}
        />
      ),
    },
    {
      id: "race",
      title: "Race",
      dockZone: "float",
      position: { x: 40, y: 340 },
      size: { w: 320, h: 380 },
      minWidth: 260,
      minHeight: 260,
      content: (
        <CreationRacePanel
          selectedRace={selectedRace}
          onRaceSelect={handleRaceSelect}
          onAction={handleClick}
        />
      ),
    },
    {
      id: "class",
      title: "Class",
      dockZone: "float",
      position: { x: 380, y: 80 },
      size: { w: 320, h: 240 },
      minWidth: 260,
      minHeight: 200,
      content: (
        <CreationClassPanel
          selectedClass={selectedClass}
          onClassSelect={handleClassSelect}
          onAction={handleClick}
        />
      ),
    },
    {
      id: "archetypeSystem",
      title: "System",
      dockZone: "float",
      position: { x: 720, y: 80 },
      size: { w: 320, h: 320 },
      minWidth: 280,
      minHeight: 240,
      content: (
        <CreationArchetypeSystemPanel
          systems={availableArchetypeSystems}
          selectedSystem={selectedArchetypeSystem}
          onSystemSelect={handleArchetypeSystemSelect}
          onAction={handleClick}
        />
      ),
    },
    {
      id: "attributes",
      title: "Attributes",
      dockZone: "float",
      position: { x: 380, y: 340 },
      size: { w: 320, h: 380 },
      minWidth: 260,
      minHeight: 280,
      content: (
        <CreationAttributesPanel
          allocationPoints={allocationPoints}
          derivedStats={derivedStats}
          availablePoints={availablePoints}
          onStatChange={handleStatChange}
          onAction={handleClick}
          rerollsRemaining={rerollsRemaining}
          onReroll={handleReroll}
        />
      ),
    },
    {
      id: "skills",
      title: "Skills",
      dockZone: "float",
      position: { x: 720, y: 420 },
      size: { w: 300, h: 340 },
      minWidth: 280,
      minHeight: 280,
      content: (
        <CreationSkillsPanel
          selectedClass={selectedClass}
          availableActiveSkills={availableActiveSkills}
          availablePassiveSkills={availablePassiveSkills}
          selectedActiveSkills={selectedActiveSkills}
          selectedPassiveSkills={selectedPassiveSkills}
          onActiveSelect={handleActiveSkillSelect}
          onPassiveToggle={handlePassiveSkillToggle}
          onAction={handleClick}
        />
      ),
    },
    {
      id: "summary",
      title: "Summary",
      dockZone: "center",
      minWidth: 520,
      minHeight: 420,
      content: (
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
      ),
    },
    {
      id: "creationNarrative",
      title: "Creation Log",
      dockZone: "center",
      minWidth: 360,
      minHeight: 220,
      content: (
        <CreationNarrativePanel
          statusLines={statusLines}
          typewriterText={typewriterText}
          syncProgress={syncProgress}
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
