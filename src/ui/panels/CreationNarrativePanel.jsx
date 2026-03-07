import { useMemo } from "react";
import { getCategoryConfig } from "../../systems/archetype/ArchetypeSystemRegistry.js";

const STEP_DESCRIPTIONS = [
  { step: 1, label: "Lock identity and origin", icon: "\u2316" },
  { step: 2, label: "Select lineage", icon: "\u25C7" },
  { step: 3, label: "Define combat doctrine", icon: "\u2694" },
  { step: 4, label: "Choose craft", icon: "\u2699" },
  { step: 5, label: "Bind progression system", icon: "\u25A4" },
  { step: 6, label: "Allocate attributes", icon: "\u2665" },
  { step: 7, label: "Load starting skills", icon: "\u26A1" },
  { step: 8, label: "Finalize identity", icon: "\u2714" },
];

function buildFlavorText(statusLines) {
  // Generate dynamic flavor based on what's been selected
  const completed = statusLines.filter((l) => l.active).length;
  const total = statusLines.length;

  if (completed === 0) {
    return "The genesis terminal awaits your input. Every choice shapes the world you will inhabit.";
  }
  if (completed <= 2) {
    return "The system calibrates. Your early choices send ripples through probability space.";
  }
  if (completed <= 4) {
    return "A profile coalesces. The system binds your selections into a coherent identity.";
  }
  if (completed <= 6) {
    return "Near-complete. The final parameters lock into place, forging your path forward.";
  }
  if (completed >= total) {
    return "Genesis sequence ready. Your identity has crystallized. Confirm when prepared.";
  }
  return "Configure lineage, archetype, and attributes to complete genesis.";
}

export default function CreationNarrativePanel({
  statusLines = [],
  typewriterText,
  syncProgress,
  selectedOrigin,
  selectedRace,
  selectedClass,
  selectedArchetypeSystem,
}) {
  const flavorText = useMemo(
    () => buildFlavorText(statusLines),
    [statusLines],
  );

  const archConfig = selectedArchetypeSystem
    ? getCategoryConfig(selectedArchetypeSystem.category)
    : null;

  const progressColor = syncProgress >= 100
    ? "#8CE99A"
    : syncProgress >= 60
      ? "var(--holo-gold)"
      : "var(--holo-cyan)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {/* Header */}
      <div style={{ color: "var(--holo-cyan)", fontFamily: "monospace", fontSize: "0.85rem", letterSpacing: "2px" }}>
        GENESIS STREAM
      </div>

      {/* Dynamic flavor text */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: "1.4", fontStyle: "italic" }}>
        {flavorText}
      </div>

      {/* Typewriter description */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-main)", lineHeight: "1.4", minHeight: "2.5rem" }}>
        {typewriterText}
        <span style={{ animation: "blink 1s infinite", color: "var(--holo-cyan)" }}>_</span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--holo-cyan)", fontFamily: "monospace", letterSpacing: "1px" }}>
            SYNC PROGRESS
          </span>
          <span style={{ fontSize: "0.7rem", color: progressColor, fontWeight: "bold", fontFamily: "monospace" }}>
            {Math.round(syncProgress)}%
          </span>
        </div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, syncProgress)}%`,
              height: "100%",
              background: `linear-gradient(90deg, var(--holo-cyan), ${progressColor})`,
              borderRadius: "2px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Active selections summary */}
      {(selectedOrigin || selectedRace || selectedClass || selectedArchetypeSystem) && (
        <div style={{
          padding: "0.5rem",
          background: "rgba(0, 0, 0, 0.4)",
          borderRadius: "5px",
          border: "1px solid rgba(0, 243, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
          fontSize: "0.65rem",
        }}>
          {selectedOrigin && (
            <div>
              <span style={{ color: "#FFD43B" }}>ORIGIN:</span>{" "}
              <span style={{ color: "var(--text-main)" }}>{selectedOrigin.name}</span>
            </div>
          )}
          {selectedRace && (
            <div>
              <span style={{ color: "#96F2D7" }}>RACE:</span>{" "}
              <span style={{ color: "var(--text-main)" }}>{selectedRace.name}</span>
            </div>
          )}
          {selectedClass && (
            <div>
              <span style={{ color: "#E599F7" }}>CLASS:</span>{" "}
              <span style={{ color: "var(--text-main)" }}>{selectedClass.name}</span>
            </div>
          )}
          {selectedArchetypeSystem && (
            <div>
              <span style={{ color: archConfig?.color || "var(--holo-gold)" }}>SYSTEM:</span>{" "}
              <span style={{ color: "var(--text-main)" }}>{selectedArchetypeSystem.name}</span>
              <span style={{ color: "var(--text-dim)" }}> ({selectedArchetypeSystem.category})</span>
            </div>
          )}
        </div>
      )}

      {/* Step checklist */}
      <div style={{ display: "grid", gap: "0.25rem" }}>
        {STEP_DESCRIPTIONS.map(({ step, label, icon }, i) => {
          const line = statusLines[i];
          const isActive = line?.active || false;
          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.7rem",
                color: isActive ? "var(--holo-cyan)" : "var(--text-dim)",
                fontFamily: "monospace",
                transition: "color 0.3s ease",
              }}
            >
              <span style={{ width: "1rem", textAlign: "center" }}>
                {isActive ? "\u2713" : icon}
              </span>
              <span>{step}. {label}</span>
            </div>
          );
        })}
      </div>

      {/* Status detail lines */}
      <div style={{ display: "grid", gap: "0.2rem", fontSize: "0.65rem" }}>
        {statusLines.map((line) => (
          <div
            key={line.label}
            style={{
              color: line.active ? "#8CE99A" : "var(--text-dim)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span style={{ fontSize: "0.5rem" }}>{line.active ? "\u25CF" : "\u25CB"}</span>
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}
