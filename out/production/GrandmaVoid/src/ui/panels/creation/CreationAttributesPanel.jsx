import { ATTRIBUTE_METADATA } from "../../../constants/attributes.js";

export default function CreationAttributesPanel({
  allocationPoints,
  derivedStats,
  availablePoints,
  onStatChange,
  onAction,
  rerollsRemaining,
  onReroll,
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
        Parameters
      </div>
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
                    type="button"
                    onClick={() => onAction?.(() => onStatChange(key, -1))}
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
                    type="button"
                    onClick={() => onAction?.(() => onStatChange(key, 1))}
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
                      animation: availablePoints > 0 ? "pulse 1s infinite" : "none",
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
      <div>
        <button
          type="button"
          onClick={() => onAction?.(() => onReroll())}
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
    </div>
  );
}
