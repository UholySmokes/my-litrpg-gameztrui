import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DataRegistry } from "../data/DataRegistry.js";
import { useCharacterCreationReworked } from "../hook/useCharacterCreationReworked.js";
import {
  ATTRIBUTE_METADATA,
  CANONICAL_ATTRIBUTES,
  createAttributeBaseline,
  ensureAttributeShape,
} from "../constants/attributes.js";

// Audio placeholder
const playSystemSound = (sound) => {
  console.log(`[AUDIO] Playing: ${sound}`);
};

// Theme configuration for class selection
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

// ASCII silhouettes for different races
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

const styles = {
  // Panel-specific inline styles remain below; layout handled via CSS classes.
};

export default function CharacterGenesisUI_Enhanced({ onComplete }) {
  // Use existing character creation hook
  const {
    selectedRace,
    selectedClass,
    selectedTalent,
    currentTalents,
    characterName: hookCharacterName,
    gender,
    attributePoints,
    remainingPoints,
    selectedActiveSkills,
    selectedPassiveSkills,
    availableActiveSkills,
    availablePassiveSkills,
    rerollsRemaining,
    handleRaceSelect,
    handleClassSelect,
    handleTalentSelect,
    setName,
    setGender,
    allocateAttributePoint: handleStatIncrement,
    deallocateAttributePoint: handleStatDecrement,
    handleReroll,
    rerollTalents,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    finalizeCharacter,
    initializeTalents,
  } = useCharacterCreationReworked();

  // Local state for name to ensure it works
  const [localName, setLocalName] = useState(hookCharacterName || "");

  // Update both local and hook state when name changes
  const handleNameInputChange = useCallback(
    (value) => {
      setLocalName(value);
      setName(value); // Update hook state
    },
    [setName],
  );

  // Use local name for validation and display
  const characterName = localName;

  useEffect(() => {
    initializeTalents();
  }, [initializeTalents]);

  const allocationPoints = useMemo(
    () => ensureAttributeShape(attributePoints, 5),
    [attributePoints],
  );

  // Map remainingPoints to availablePoints for compatibility
  const availablePoints = remainingPoints || 0;

  // Handle stat changes
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

  // Calculate derived stats with memoization for performance
  const derivedStats = useMemo(() => {
    const resourceSystem =
      selectedClass?.resourceSystem || selectedClass?.resource || null;
    const raceBonuses = ensureAttributeShape(selectedRace?.baseStats, 0);
    const classBonuses = ensureAttributeShape(selectedClass?.baseStats, 0);

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

  // Apply theme when class changes
  useEffect(() => {
    if (selectedClass?.id && CLASS_THEMES[selectedClass.id]) {
      const theme = CLASS_THEMES[selectedClass.id];
      document.documentElement.style.setProperty(
        "--holo-primary",
        theme.primary,
      );
      document.documentElement.style.setProperty(
        "--holo-secondary",
        theme.secondary,
      );
      document.documentElement.style.setProperty("--holo-accent", theme.accent);
      playSystemSound("theme_change");
    }
  }, [selectedClass]);

  // Typewriter effect for descriptions
  useEffect(() => {
    const descriptionParts = [];
    if (selectedClass?.description)
      descriptionParts.push(selectedClass.description);
    if (selectedRace?.description)
      descriptionParts.push(selectedRace.description);
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
    const talentName = selectedTalent?.name || selectedTalent || "Talent not selected";
    const talentDescription =
      selectedTalent?.description ||
      "Choose a talent to unlock a core directive.";

    return {
      raceName,
      raceDescription,
      className,
      classDescription,
      talentName,
      talentDescription,
      activeSkills:
        selectedActiveSkills.length > 0 ? selectedActiveSkills : null,
      passiveSkills:
        selectedPassiveSkills.length > 0 ? selectedPassiveSkills : null,
    };
  }, [
    selectedRace,
    selectedClass,
    selectedTalent,
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  // Update sync progress based on completion
  useEffect(() => {
    const stepValue = 100 / 7;
    let progress = 0;
    if (characterName && characterName.trim().length > 0) progress += stepValue;
    if (gender) progress += stepValue;
    if (selectedRace) progress += stepValue;
    if (selectedClass) progress += stepValue;
    if (selectedTalent) progress += stepValue;
    if (availablePoints === 0) progress += stepValue;
    if (selectedActiveSkills?.length >= 3 && selectedPassiveSkills?.length >= 6)
      progress += stepValue;
    setSyncProgress(Math.min(100, progress));
  }, [
    characterName,
    gender,
    selectedRace,
    selectedClass,
    selectedTalent,
    availablePoints,
    selectedActiveSkills,
    selectedPassiveSkills,
  ]);

  // Check if character can be finalized
  const canFinalize =
    characterName &&
    characterName.trim().length > 0 &&
    gender &&
    selectedRace &&
    selectedClass &&
    selectedTalent &&
    availablePoints === 0 &&
    selectedActiveSkills?.length >= 3 &&
    selectedPassiveSkills?.length >= 6;

  // Handle button clicks with sound
  const handleClick = useCallback((action) => {
    playSystemSound("click");
    action();
  }, []);

  const asciiArt = selectedRace
    ? RACE_ASCII[selectedRace.id] || RACE_ASCII.default
    : RACE_ASCII.default;

  return (
    <div className="scanline genesis-grid">
      {/* Left Panel: Data Input */}
      <div className="holo-panel genesis-column">
        <div
          style={{
            color: "var(--holo-cyan)",
            fontFamily: "monospace",
            fontSize: "1.2rem",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          Genesis Terminal
        </div>

        {/* Name Input */}
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            DESIGNATION
          </div>
          <input
            type="text"
            value={characterName || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              handleNameInputChange(newValue);
            }}
            placeholder="Enter designation..."
            style={{
              width: "100%",
              background: "rgba(0, 0, 0, 0.8)",
              border: "2px solid var(--holo-cyan)",
              color: "#00F3FF",
              padding: "0.75rem",
              fontFamily: "monospace",
              fontSize: "1rem",
              marginBottom: "1rem",
            }}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            GENDER
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {["male", "female", "other"].map((genderOption) => (
              <button
                key={genderOption}
                onClick={() => handleClick(() => setGender(genderOption))}
                style={{
                  padding: "1rem",
                  background:
                    gender === genderOption
                      ? "rgba(0, 243, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.6)",
                  border:
                    gender === genderOption
                      ? "2px solid var(--holo-cyan)"
                      : "1px solid rgba(0, 243, 255, 0.3)",
                  color: "#00F3FF",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  {genderOption.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Race Selection */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            GENETIC TEMPLATE
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.5rem",
              overflowY: "auto",
              maxHeight: "300px",
            }}
          >
            {DataRegistry.getRaces().map((race) => (
              <button
                key={race.id}
                onClick={() => handleClick(() => handleRaceSelect(race))}
                style={{
                  padding: "1rem",
                  background:
                    selectedRace?.id === race.id
                      ? "rgba(0, 243, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.6)",
                  border:
                    selectedRace?.id === race.id
                      ? "2px solid var(--holo-cyan)"
                      : "1px solid rgba(0, 243, 255, 0.3)",
                  color: "#00F3FF",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  {race.name.toUpperCase()}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                  {race.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Class Selection */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            COMBAT PROTOCOL
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.5rem",
              overflowY: "auto",
              maxHeight: "300px",
            }}
          >
            {DataRegistry.getClasses().map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleClick(() => handleClassSelect(cls))}
                style={{
                  padding: "1rem",
                  background:
                    selectedClass?.id === cls.id
                      ? "rgba(0, 243, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.6)",
                  border:
                    selectedClass?.id === cls.id
                      ? "2px solid var(--holo-cyan)"
                      : "1px solid rgba(0, 243, 255, 0.3)",
                  color: "#00F3FF",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  {cls.name.toUpperCase()}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                  {cls.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel: Bio-Digital Preview */}
      <div className="status-terminal genesis-column genesis-center">
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "2rem",
            overflowY: "auto",
            maxHeight: "100vh",
          }}
        >
          {/* ASCII Silhouette */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6rem",
              lineHeight: "1.2",
              whiteSpace: "pre",
              marginBottom: "2rem",
            }}
          >
            <pre style={{ color: "var(--holo-cyan)", margin: 0 }}>
              {asciiArt}
            </pre>
          </div>

          {/* Selection Summary */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.85)",
              border: "1px solid var(--holo-cyan)",
              padding: "1.25rem",
              borderRadius: "6px",
              marginBottom: "2rem",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              color: "var(--text-main)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={{ color: "var(--holo-cyan)" }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  RACE
                </div>
                <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
                  {selectionSummary.raceName}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {selectionSummary.raceDescription}
                </div>
              </div>
              <div style={{ color: "var(--holo-cyan)" }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  CLASS
                </div>
                <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
                  {selectionSummary.className}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {selectionSummary.classDescription}
                </div>
              </div>
              <div style={{ color: "var(--holo-cyan)" }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  TALENT
                </div>
                <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
                  {selectionSummary.talentName}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {selectionSummary.talentDescription}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div
                  style={{
                    color: "var(--holo-gold)",
                    fontWeight: "bold",
                    marginBottom: "0.25rem",
                  }}
                >
                  ACTIVE SKILLS ({selectedActiveSkills.length}/3)
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1rem",
                    color: "var(--text-main)",
                    minHeight: "2.5rem",
                  }}
                >
                  {selectionSummary.activeSkills ? (
                    selectionSummary.activeSkills.map((skill) => {
                      const rank = skill.level || skill.rank || 1;
                      const desc =
                        skill.description || "No description provided.";
                      return (
                        <li key={skill.id}>
                          <strong>{skill.name}</strong> — {desc} (Rank {rank})
                        </li>
                      );
                    })
                  ) : (
                    <li style={{ color: "var(--text-dim)" }}>
                      Select 3 active skills.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <div
                  style={{
                    color: "var(--holo-gold)",
                    fontWeight: "bold",
                    marginBottom: "0.25rem",
                  }}
                >
                  PASSIVE SKILLS ({selectedPassiveSkills.length}/6)
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1rem",
                    color: "var(--text-main)",
                    minHeight: "2.5rem",
                  }}
                >
                  {selectionSummary.passiveSkills ? (
                    selectionSummary.passiveSkills.map((skill) => {
                      const rank = skill.level || skill.rank || 1;
                      const desc =
                        skill.description || "No description provided.";
                      return (
                        <li key={skill.id}>
                          <strong>{skill.name}</strong> — {desc} (Rank {rank})
                        </li>
                      );
                    })
                  ) : (
                    <li style={{ color: "var(--text-dim)" }}>
                      Select 6 passive skills.
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                borderTop: "1px solid rgba(0, 243, 255, 0.2)",
                paddingTop: "0.75rem",
              }}
            >
              {typewriterText}
              <span style={{ animation: "blink 1s infinite" }}>_</span>
            </div>
          </div>

          {/* System Sync Status Bar */}
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                color: "var(--holo-cyan)",
                fontFamily: "monospace",
                marginBottom: "0.5rem",
              }}
            >
              SYSTEM SYNC: {syncProgress}%
            </div>
            <div
              style={{
                width: "100%",
                height: "20px",
                background: "rgba(0, 0, 0, 0.8)",
                border: "1px solid var(--holo-cyan)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${syncProgress}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, var(--holo-cyan), var(--holo-accent))`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Initialize Avatar Button */}
          <div style={{ marginTop: "2rem" }}>
            {canFinalize ? (
              <div style={{ color: "green", marginBottom: "1rem" }}>
                Ready to initialize!
              </div>
            ) : (
              <div style={{ color: "orange", marginBottom: "1rem" }}>
                Complete all requirements to initialize
              </div>
            )}

            {canFinalize && (
              <button
                onClick={() => {
                  try {
                    // Call finalize character and get the result
                    const result = finalizeCharacter();

                    // Call complete callback with character data
                    if (onComplete && result.valid && result.characterData) {
                      onComplete(result.characterData);
                    } else {
                      console.error(
                        "finalizeCharacter failed or returned invalid data:",
                        result,
                      );
                      alert("Character finalization failed!");
                      return;
                    }

                    alert("Initialization complete!");
                  } catch (error) {
                    console.error("Initialization error:", error);
                    alert("Error: " + error.message);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  background:
                    "linear-gradient(135deg, var(--holo-gold), #FFA500)",
                  border: "2px solid var(--holo-gold)",
                  color: "#000",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                INITIALIZE AVATAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Parameter Tuning */}
      <div className="holo-panel genesis-column">
        <div
          style={{
            color: "var(--holo-cyan)",
            fontFamily: "monospace",
            fontSize: "1.2rem",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          Parameters
        </div>

        {/* Stat Allocation */}
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            STAT ALLOCATION ({availablePoints} points)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}
          >
            {ATTRIBUTE_METADATA.map(({ key, label, description }) => {
              const value = allocationPoints[key] ?? 5;
              const totalValue = derivedStats[key] ?? value;
              return (
                <div
                  key={key}
                  style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(0, 243, 255, 0.3)",
                    padding: "0.75rem",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--holo-gold)",
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    >
                      {label.toUpperCase()}
                    </span>
                    <span
                      style={{
                        color: "var(--holo-cyan)",
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    >
                      {totalValue}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(255, 255, 255, 0.6)",
                      minHeight: "1.25rem",
                    }}
                  >
                    {description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() =>
                        handleClick(() => handleStatChange(key, -1))
                      }
                      disabled={value <= 0 ? true : false}
                      style={{
                        background: "rgba(0, 243, 255, 0.1)",
                        border: "1px solid rgba(0, 243, 255, 0.3)",
                        color: "#00F3FF",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        cursor: value > 0 ? "pointer" : "not-allowed",
                        fontFamily: "monospace",
                        opacity: value > 0 ? 1 : 0.3,
                        animation:
                          availablePoints > 0 && value > 0
                            ? "pulse 1s infinite"
                            : "none",
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        color: "var(--holo-gold)",
                        fontFamily: "monospace",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {value}
                    </span>
                    <button
                      onClick={() =>
                        handleClick(() => handleStatChange(key, 1))
                      }
                      disabled={availablePoints <= 0 ? true : false}
                      style={{
                        background: "rgba(0, 243, 255, 0.1)",
                        border: "1px solid rgba(0, 243, 255, 0.3)",
                        color: "#00F3FF",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        cursor: availablePoints > 0 ? "pointer" : "not-allowed",
                        fontFamily: "monospace",
                        opacity: availablePoints > 0 ? 1 : 0.3,
                        animation:
                          availablePoints > 0 ? "pulse 1s infinite" : "none",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Initialization */}
        <div>
          <button
            onClick={() => handleClick(() => handleReroll())}
            disabled={rerollsRemaining <= 0 ? true : false}
            style={{
              width: "100%",
              padding: "1rem",
              background:
                rerollsRemaining > 0
                  ? "rgba(255, 107, 107, 0.2)"
                  : "rgba(0, 0, 0, 0.6)",
              border:
                rerollsRemaining > 0
                  ? "2px solid #FF6B6B"
                  : "1px solid rgba(0, 243, 255, 0.3)",
              color:
                rerollsRemaining > 0 ? "#FF6B6B" : "rgba(0, 243, 255, 0.5)",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              textAlign: "center",
              cursor: rerollsRemaining > 0 ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Reset Initialization ({rerollsRemaining} remaining)
          </button>
        </div>

        {/* Talent Selection Controls */}
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            TALENT SELECTION
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Select 1 talent
            </div>
            <button
              onClick={() => handleClick(() => rerollTalents())}
              style={{
                padding: "0.35rem 0.6rem",
                background: "rgba(0, 243, 255, 0.15)",
                border: "1px solid rgba(0, 243, 255, 0.4)",
                color: "#00F3FF",
                fontFamily: "monospace",
                fontSize: "0.7rem",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              REROLL
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.25rem",
              maxHeight: "140px",
              overflowY: "auto",
            }}
          >
            {(currentTalents || []).length > 0 ? (
              (currentTalents || []).map((talent) => {
                const isSelected =
                  selectedTalent?.id === talent.id || selectedTalent === talent.id;
                return (
                  <button
                    key={talent.id}
                    onClick={() => handleClick(() => handleTalentSelect(talent.id))}
                    style={{
                      padding: "0.5rem",
                      background: isSelected
                        ? "rgba(0, 243, 255, 0.3)"
                        : "rgba(0, 0, 0, 0.6)",
                      border: isSelected
                        ? "1px solid var(--holo-cyan)"
                        : "1px solid rgba(0, 243, 255, 0.3)",
                      color: "#00F3FF",
                      fontFamily: "monospace",
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
                      {talent.name || talent.id}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-dim)",
                      }}
                    >
                      {talent.description || "No description provided."}
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                Talent pool initializing...
              </div>
            )}
          </div>
        </div>

        {/* Skill Selection Controls */}
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontFamily: "monospace",
              marginBottom: "0.5rem",
            }}
          >
            SKILL SELECTION
          </div>
          {selectedClass && (
            <div>
              {/* Active Skills */}
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--holo-gold)",
                    marginBottom: "0.5rem",
                  }}
                >
                  ACTIVE SKILLS ({selectedActiveSkills?.length || 0}/3)
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.25rem",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                >
                  {(availableActiveSkills || []).map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() =>
                        handleClick(() => handleActiveSkillSelect(skill))
                      }
                      style={{
                        padding: "0.5rem",
                        background: (selectedActiveSkills || []).some(
                          (s) => s.id === skill.id,
                        )
                          ? "rgba(0, 243, 255, 0.3)"
                          : "rgba(0, 0, 0, 0.6)",
                        border: (selectedActiveSkills || []).some(
                          (s) => s.id === skill.id,
                        )
                          ? "1px solid var(--holo-cyan)"
                          : "1px solid rgba(0, 243, 255, 0.3)",
                        color: "#00F3FF",
                        fontFamily: "monospace",
                        fontSize: "0.7rem",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                    >
                      {skill.name || skill.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passive Skills */}
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--holo-gold)",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASSIVE SKILLS ({selectedPassiveSkills?.length || 0}/6)
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.25rem",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                >
                  {(availablePassiveSkills || []).map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() =>
                        handleClick(() => handlePassiveSkillToggle(skill))
                      }
                      style={{
                        padding: "0.5rem",
                        background: (selectedPassiveSkills || []).some(
                          (s) => s.id === skill.id,
                        )
                          ? "rgba(0, 243, 255, 0.3)"
                          : "rgba(0, 0, 0, 0.6)",
                        border: (selectedPassiveSkills || []).some(
                          (s) => s.id === skill.id,
                        )
                          ? "1px solid var(--holo-cyan)"
                          : "1px solid rgba(0, 243, 255, 0.3)",
                        color: "#00F3FF",
                        fontFamily: "monospace",
                        fontSize: "0.7rem",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "4px",
                      }}
                    >
                      {skill.name || skill.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!selectedClass && (
            <div
              style={{ fontSize: "0.7rem", color: "rgba(0, 243, 255, 0.8)" }}
            >
              Skills will be available after selecting a class
            </div>
          )}
        </div>
      </div>

      <style>{`
        .genesis-grid {
          width: 100%;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr) 320px;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-deep);
        }
        .genesis-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          max-height: 100vh;
        }
        .genesis-center {
          overflow: hidden;
        }
        @media (max-width: 1400px) {
          .genesis-grid {
            grid-template-columns: 260px minmax(0, 1fr) 260px;
          }
        }
        @media (max-width: 1024px) {
          .genesis-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .genesis-column {
            max-height: none;
            overflow: visible;
          }
          .genesis-center {
            order: -1;
          }
        }
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
