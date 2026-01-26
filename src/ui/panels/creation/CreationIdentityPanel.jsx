import { DataRegistry } from "../../../data/DataRegistry.js";

const genderOptions = ["male", "female", "other"];

export default function CreationIdentityPanel({
  characterName,
  onNameChange,
  gender,
  onGenderSelect,
  selectedRace,
  onRaceSelect,
  selectedClass,
  onClassSelect,
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
        Genesis Terminal
      </div>
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
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Enter designation..."
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            border: "2px solid var(--holo-cyan)",
            color: "#00F3FF",
            padding: "0.75rem",
            fontFamily: "monospace",
            fontSize: "1rem",
          }}
        />
      </div>
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
          {genderOptions.map((genderOption) => (
            <button
              key={genderOption}
              type="button"
              onClick={() => onAction?.(() => onGenderSelect(genderOption))}
              style={{
                padding: "0.85rem",
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
                fontSize: "0.85rem",
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
      <div>
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
            maxHeight: "320px",
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
      <div>
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
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {DataRegistry.getClasses().map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => onAction?.(() => onClassSelect(cls))}
              style={{
                padding: "0.85rem",
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
                fontSize: "0.85rem",
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
  );
}
