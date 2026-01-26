import { DataRegistry } from "../../../data/DataRegistry.js";

export default function CreationRacePanel({
  selectedRace,
  onRaceSelect,
  onAction,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
      <div
        style={{
          color: "var(--holo-cyan)",
          fontFamily: "monospace",
          marginBottom: "0.5rem",
        }}
      >
        RACE SELECTION
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          maxHeight: "360px",
          overflowY: "auto",
        }}
      >
        {DataRegistry.getRaces().map((race) => (
          <button
            key={race.id}
            type="button"
            onClick={() => onAction?.(() => onRaceSelect(race))}
            style={{
              padding: "0.85rem",
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
              fontSize: "0.85rem",
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
  );
}
