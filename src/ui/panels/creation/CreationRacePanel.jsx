import { useState, useMemo } from "react";
import {
  getCharacterCreationRaceAbilitySummaries,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";
import { CANONICAL_ATTRIBUTES } from "../../../constants/attributes.js";

const RACE_CATEGORIES = {
  "Human Variants": ["pure_human", "neo_human", "ancient_bloodline"],
  "Beast & Nature": [
    "spirit_beast", "beast_kin", "nature_spirit", "fae_touched",
    "whisper_fae", "ironroot", "verdant_shaper", "venomtail",
    "echo_spirit", "wild_mutant",
  ],
  Elemental: [
    "elemental_attuned", "frostborne", "emberkin", "tidecaller",
    "stormforged", "quakeborn", "flux_attuned", "sparkborn", "glacierkin",
  ],
  "Celestial & Divine": [
    "celestial_descendant", "divine_scion", "phoenix_reborn",
    "auric_seraph", "sunborn", "sunforged",
  ],
  "Dark & Undead": [
    "demon_kin", "shadow_walker", "undead_awakened", "gloomshade",
    "duskborne", "grim_revenant", "shadow_veil", "umbral_oracle",
    "ashenblood", "blood_frenzied", "bloodwoven",
  ],
  "Construct & Void": [
    "mechanical_construct", "void_walker", "rune_sentinel",
    "astral_nomad", "riftborn",
  ],
  "Dragon & Mythic": ["dragon_blood", "crystal_being"],
  "Chaos & Exotic": [
    "chaos_born", "mirageborn", "chaos_touched", "luckweaver",
    "sandstrider", "skybound", "starseer", "mutant",
  ],
};

const CATEGORY_ID_SET = new Map();
for (const [cat, ids] of Object.entries(RACE_CATEGORIES)) {
  for (const id of ids) CATEGORY_ID_SET.set(id, cat);
}

function getCategoryForRace(raceId) {
  return CATEGORY_ID_SET.get(raceId) || "Other";
}

function StatModifierBar({ label, value }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const barWidth = Math.min(absVal * 20, 100);
  const color = isPositive ? "#8CE99A" : isNegative ? "#FF8787" : "var(--text-dim)";
  const sign = isPositive ? "+" : "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.6rem" }}>
      <span style={{ width: "2.2rem", textAlign: "right", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: "bold" }}>
        {label.slice(0, 3)}
      </span>
      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: color,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ width: "1.8rem", textAlign: "right", color, fontWeight: "bold", fontFamily: "monospace" }}>
        {value === 0 ? "--" : `${sign}${value}`}
      </span>
    </div>
  );
}

function AbilityTag({ label, name, description, color }) {
  return (
    <div style={{ fontSize: "0.65rem", lineHeight: "1.35" }}>
      <span style={{ color, fontWeight: "bold" }}>{label}:</span>{" "}
      <span style={{ color: "var(--text-main)" }}>{name}</span>
      {description && (
        <span style={{ color: "var(--text-dim)" }}> -- {description}</span>
      )}
    </div>
  );
}

export default function CreationRacePanel({
  selectedRace,
  races = [],
  recommendedRaceIds = [],
  onRaceSelect,
  onAction,
}) {
  const recommended = new Set(recommendedRaceIds);
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const filteredRaces = useMemo(() => {
    if (!search.trim()) return races;
    const q = search.toLowerCase();
    return races.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [races, search]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const race of filteredRaces) {
      const cat = getCategoryForRace(race.id);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(race);
    }
    // Use RACE_CATEGORIES key order, then "Other"
    const ordered = [];
    for (const cat of Object.keys(RACE_CATEGORIES)) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    if (groups["Other"]) ordered.push(["Other", groups["Other"]]);
    return ordered;
  }, [filteredRaces]);

  const toggleCategory = (cat) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          color: "var(--holo-cyan)",
          fontFamily: "monospace",
          fontSize: "1.1rem",
          textTransform: "uppercase",
          letterSpacing: "3px",
        }}
      >
        Genetic Template
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
        Each race carries unique stat bonuses, innate abilities, and narrative flavor.
      </div>

      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search races..."
          aria-label="Search races"
          style={{
            width: "100%",
            padding: "0.45rem 0.6rem 0.45rem 1.6rem",
            background: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            borderRadius: "5px",
            color: "var(--holo-cyan)",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.7rem",
            color: "var(--text-dim)",
            pointerEvents: "none",
          }}
        >
          ⌕
        </span>
      </div>

      <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>
        Showing {filteredRaces.length} of {races.length} races
      </div>

      {/* Category-grouped list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "550px",
          overflowY: "auto",
          paddingRight: "0.2rem",
        }}
      >
        {grouped.map(([category, categoryRaces]) => {
          const isCollapsed = collapsedCategories[category];
          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "0.35rem 0.5rem",
                  background: "rgba(0, 243, 255, 0.07)",
                  border: "1px solid rgba(0, 243, 255, 0.15)",
                  borderRadius: "4px",
                  color: "var(--holo-gold)",
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  marginBottom: isCollapsed ? 0 : "0.35rem",
                }}
              >
                <span>{isCollapsed ? "▶" : "▼"} {category}</span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>
                  {categoryRaces.length}
                </span>
              </button>
              {!isCollapsed && (
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  {categoryRaces.map((race) => {
                    const isSelected = selectedRace?.id === race.id;
                    const raceAbilities = getCharacterCreationRaceAbilitySummaries(race.id);
                    const activeAbility = raceAbilities[0] || null;
                    const passiveAbility = race.passiveAbility;
                    const raceSkillNames = Array.from(
                      new Set(
                        [passiveAbility, ...raceAbilities]
                          .map((entry) => entry?.name || entry?.id)
                          .filter(Boolean),
                      ),
                    );
                    const modifiers = race.modifiers || race.statBonuses || race.baseStats || {};
                    const statEntries = CANONICAL_ATTRIBUTES
                      .map((key) => ({ key, value: modifiers[key] || 0 }))
                      .filter((e) => e.value !== 0);

                    return (
                      <button
                        key={race.id}
                        type="button"
                        onClick={() => { onAction?.(() => {}); onRaceSelect(race); }}
                        style={{
                          padding: "0.75rem",
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(0,0,0,0.7))"
                            : "rgba(0, 0, 0, 0.55)",
                          border: isSelected
                            ? "2px solid var(--holo-cyan)"
                            : "1px solid rgba(0, 243, 255, 0.2)",
                          color: "#00F3FF",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          borderRadius: "6px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", letterSpacing: "1px" }}>{race.name.toUpperCase()}</span>
                          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                            {recommended.has(race.id) ? (
                              <span style={{ fontSize: "0.55rem", color: "#8CE99A", fontWeight: "bold" }}>SYSTEM MATCH</span>
                            ) : null}
                            {isSelected && (
                              <span style={{ fontSize: "0.55rem", color: "var(--holo-gold)", fontWeight: "bold" }}>SELECTED</span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: "1.35" }}>
                          {race.description}
                        </div>
                        {statEntries.length > 0 && (
                          <div style={{ display: "grid", gap: "0.2rem", marginTop: "0.15rem" }}>
                            {statEntries.map(({ key, value }) => (
                              <StatModifierBar key={key} label={key} value={value} />
                            ))}
                          </div>
                        )}
                        {(passiveAbility || activeAbility) && (
                          <div style={{ display: "grid", gap: "0.2rem", marginTop: "0.15rem" }}>
                            {passiveAbility && (
                              <AbilityTag
                                label="Passive"
                                name={passiveAbility.name}
                                description={passiveAbility.description}
                                color="#96F2D7"
                              />
                            )}
                            {activeAbility && (
                              <AbilityTag
                                label="Active"
                                name={activeAbility.name}
                                description={activeAbility.description}
                                color="#E599F7"
                              />
                            )}
                          </div>
                        )}
                        {raceSkillNames.length > 0 && (
                          <div
                            style={{
                              fontSize: "0.58rem",
                              color: "var(--text-dim)",
                              marginTop: "0.1rem",
                              lineHeight: "1.35",
                            }}
                          >
                            <span style={{ color: "var(--holo-gold)" }}>Skill List:</span>{" "}
                            {raceSkillNames.slice(0, 6).join(", ")}
                            {raceSkillNames.length > 6 ? ", ..." : ""}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
