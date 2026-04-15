import { getZoneById } from "../../../world/WorldDataRegistry.js";

const genderOptions = ["male", "female", "other"];

function humanizeToken(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatOriginBiomeLabel(biomeId) {
  if (!biomeId) return "Neutral";
  return getZoneById(biomeId)?.name || humanizeToken(biomeId);
}

export default function CreationIdentityPanel({
  gender,
  onGenderSelect,
  selectedOrigin,
  onOriginSelect,
  origins = [],
  recommendedOriginIds = [],
  onAction,
}) {
  const recommended = new Set(recommendedOriginIds);

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
        Identity Matrix
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
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {recommended.has(origin.id) ? (
                      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ color: "#8CE99A", fontSize: "0.66rem", fontWeight: "bold" }}>SYSTEM MATCH</span>
                        <span style={{ fontSize: "0.45rem", color: "#8CE99A", opacity: 0.7 }}>Favored by your bound system</span>
                      </span>
                    ) : null}
                    <span style={{ color: "var(--holo-gold)", fontSize: "0.72rem" }}>
                      {formatOriginBiomeLabel(origin.favoredBiome).toUpperCase()}
                    </span>
                  </div>
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
