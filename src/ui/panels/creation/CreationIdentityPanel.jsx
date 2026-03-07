import { DataRegistry } from "../../../data/DataRegistry.js";

const genderOptions = ["male", "female", "other"];

export default function CreationIdentityPanel({
  characterName,
  onNameChange,
  gender,
  onGenderSelect,
  selectedOrigin,
  onOriginSelect,
  onAction,
}) {
  const origins = DataRegistry.getOrigins();

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
          aria-label="Character designation"
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
          ORIGIN
        </div>
        <div style={{ display: "grid", gap: "0.5rem", maxHeight: "18rem", overflowY: "auto" }}>
          {origins.map((origin) => {
            const isSelected = selectedOrigin?.id === origin.id;
            return (
              <button
                key={origin.id}
                type="button"
                onClick={() => onAction?.(() => onOriginSelect(origin))}
                style={{
                  padding: "0.85rem",
                  background: isSelected
                    ? "rgba(0, 243, 255, 0.18)"
                    : "rgba(0, 0, 0, 0.6)",
                  border: isSelected
                    ? "2px solid var(--holo-cyan)"
                    : "1px solid rgba(0, 243, 255, 0.3)",
                  color: "#00F3FF",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "grid",
                  gap: "0.35rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{origin.name.toUpperCase()}</span>
                  <span style={{ color: "var(--holo-gold)", fontSize: "0.72rem" }}>
                    {String(origin.favoredBiome || "neutral").toUpperCase()}
                  </span>
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.4 }}>
                  {origin.description}
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.58)", fontSize: "0.72rem" }}>
                  {Object.entries(origin.attributeBonuses || {})
                    .map(([stat, value]) => `${stat} ${value >= 0 ? `+${value}` : value}`)
                    .join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
