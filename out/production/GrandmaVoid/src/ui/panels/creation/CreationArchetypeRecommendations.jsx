function Chip({ text }) {
  if (!text) return null;
  return (
    <span
      style={{
        fontSize: "0.6rem",
        color: "var(--text-main)",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(0, 243, 255, 0.16)",
        borderRadius: "999px",
        padding: "0.15rem 0.45rem",
        lineHeight: 1.2,
      }}
    >
      {text}
    </span>
  );
}

export default function CreationArchetypeRecommendations({
  recommendations,
  selectedSystemId,
  onSelect,
}) {
  const items = Array.isArray(recommendations) ? recommendations : [];
  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: "0.55rem",
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.6rem",
        }}
      >
        <div style={{ color: "var(--holo-gold)", fontWeight: "bold" }}>
          Recommended Systems
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
          You can still choose any system below.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {items.map((entry, index) => {
          const system = entry?.system;
          if (!system?.id) return null;
          const isSelected = selectedSystemId === system.id;
          const reasons = Array.isArray(entry.reasons) ? entry.reasons : [];
          const label = index === 0 ? "TOP MATCH" : "RECOMMENDED";

          return (
            <div
              key={system.id}
              style={{
                borderRadius: "10px",
                border: isSelected
                  ? "2px solid var(--holo-cyan)"
                  : "1px solid rgba(0, 243, 255, 0.18)",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(0, 243, 255, 0.16), rgba(0,0,0,0.72))"
                  : "rgba(0, 0, 0, 0.45)",
                padding: "0.7rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.6rem",
                }}
              >
                <div style={{ display: "grid", gap: "0.1rem" }}>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-dim)",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--holo-cyan)" }}>
                    {system.name || system.id}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                    {system.category || "Unknown"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect?.(system.id)}
                  style={{
                    padding: "0.45rem 0.6rem",
                    background: "rgba(0, 0, 0, 0.55)",
                    border: "1px solid rgba(0, 243, 255, 0.35)",
                    borderRadius: "8px",
                    color: "var(--holo-cyan)",
                    cursor: "pointer",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Select
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {reasons.map((r) => (
                  <Chip key={r} text={r} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

