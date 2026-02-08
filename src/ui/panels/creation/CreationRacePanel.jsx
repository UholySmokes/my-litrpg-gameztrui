import { DataRegistry } from "../../../data/DataRegistry.js";
import { getRaceAbilitiesFor } from "../../../systems/race/RaceAbilityRegistry.js";
import { CANONICAL_ATTRIBUTES } from "../../../constants/attributes.js";

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
  onRaceSelect,
  onAction,
}) {
  const races = DataRegistry.getRaces();

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
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "0.2rem",
        }}
      >
        {races.map((race) => {
          const isSelected = selectedRace?.id === race.id;
          const activeAbility = getRaceAbilitiesFor(race.id)?.[0] || null;
          const passiveAbility = race.passiveAbility;
          const modifiers = race.modifiers || race.statBonuses || race.baseStats || {};

          // Extract stat modifiers for the canonical attributes
          const statEntries = CANONICAL_ATTRIBUTES
            .map((key) => ({ key, value: modifiers[key] || 0 }))
            .filter((e) => e.value !== 0);

          return (
            <button
              key={race.id}
              type="button"
              onClick={() => onAction?.(() => onRaceSelect(race))}
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
                {isSelected && (
                  <span style={{ fontSize: "0.55rem", color: "var(--holo-gold)", fontWeight: "bold" }}>SELECTED</span>
                )}
              </div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: "1.35" }}>
                {race.description}
              </div>

              {/* Stat modifier bars */}
              {statEntries.length > 0 && (
                <div style={{ display: "grid", gap: "0.2rem", marginTop: "0.15rem" }}>
                  {statEntries.map(({ key, value }) => (
                    <StatModifierBar key={key} label={key} value={value} />
                  ))}
                </div>
              )}

              {/* Abilities */}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
