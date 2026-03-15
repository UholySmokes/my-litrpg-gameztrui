import { useState } from "react";
import NarrativeLogPanel from "./NarrativeLogPanel.jsx";
import NarrativeMemoryPanel from "./NarrativeMemoryPanel.jsx";

const MOOD_DISPLAY = {
  tense: { label: "Tense", color: "#FF8787", icon: "\u26A0" },
  triumphant: { label: "Triumphant", color: "#FFD700", icon: "\u2605" },
  mysterious: { label: "Mysterious", color: "#E599F7", icon: "\u2727" },
  serene: { label: "Serene", color: "#96F2D7", icon: "\u2022" },
  desperate: { label: "Desperate", color: "#FF6B6B", icon: "\u2620" },
  neutral: { label: "Neutral", color: "var(--text-dim)", icon: null },
};

function MoodIndicator({ mood }) {
  const display = MOOD_DISPLAY[mood] || MOOD_DISPLAY.neutral;
  if (!display.icon && mood === "neutral") return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.2rem 0.5rem",
        fontSize: "0.6rem",
        fontFamily: "monospace",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: display.color,
        background: `${display.color}12`,
        borderRadius: "3px",
        border: `1px solid ${display.color}33`,
      }}
    >
      {display.icon && <span>{display.icon}</span>}
      <span>{display.label}</span>
    </div>
  );
}

export default function NarrativeHubPanel({
  entries = [],
  summary = "",
  latestEntry = null,
  latestEntryText = "",
  memoryRef,
  currentMood = "neutral",
}) {
  const [activeTab, setActiveTab] = useState("log");

  return (
    <div className="narrative-hub" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab bar with mood indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 0.15rem 0.4rem",
          borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
          marginBottom: "0.4rem",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {[
            { id: "log", label: "Log", icon: "\u2630" },
            { id: "memory", label: "Memory", icon: "\u2302" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: "4px",
                fontSize: "0.7rem",
                fontFamily: "monospace",
                fontWeight: "bold",
                cursor: "pointer",
                background: activeTab === tab.id ? "rgba(0, 243, 255, 0.15)" : "transparent",
                border: activeTab === tab.id ? "1px solid var(--holo-cyan)" : "1px solid transparent",
                color: activeTab === tab.id ? "var(--holo-cyan)" : "var(--text-dim)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <MoodIndicator mood={currentMood} />
      </div>

      {/* Entry count */}
      <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "monospace", marginBottom: "0.3rem" }}>
        {entries.length} entr{entries.length === 1 ? "y" : "ies"}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "log" ? (
          <NarrativeLogPanel entries={entries} />
        ) : (
          <NarrativeMemoryPanel
            summary={summary}
            entries={entries}
            latestEntry={latestEntry}
            latestEntryText={latestEntryText}
            containerRef={memoryRef}
          />
        )}
      </div>
    </div>
  );
}
