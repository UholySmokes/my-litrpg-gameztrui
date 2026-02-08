export default function CreationTalentPanel({
  currentTalents,
  selectedTalent,
  onTalentSelect,
  onReroll,
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
        Talent Selection
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Select 1 talent
        </div>
        <button
          type="button"
          onClick={() => onAction?.(() => onReroll())}
          style={{
            padding: "0.35rem 0.6rem",
            background: "rgba(0, 243, 255, 0.15)",
            border: "1px solid rgba(0, 243, 255, 0.4)",
            color: "#00F3FF",
            fontFamily: "monospace",
            fontSize: "0.7rem",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          REROLL
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.35rem",
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        {(currentTalents || []).length > 0 ? (
          (currentTalents || []).map((talent) => {
            const isSelected =
              selectedTalent?.id === talent.id || selectedTalent === talent.id;
            return (
              <button
                key={talent.id}
                type="button"
                onClick={() => onAction?.(() => onTalentSelect(talent.id))}
                style={{
                  padding: "0.6rem",
                  background: isSelected
                    ? "rgba(0, 243, 255, 0.3)"
                    : "rgba(0, 0, 0, 0.6)",
                  border: isSelected
                    ? "1px solid var(--holo-cyan)"
                    : "1px solid rgba(0, 243, 255, 0.3)",
                  color: "#00F3FF",
                  fontFamily: "monospace",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                  {talent.name || talent.id}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
                  {talent.description || "No description provided."}
                </div>
              </button>
            );
          })
        ) : (
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
            Talent pool initializing...
          </div>
        )}
      </div>
    </div>
  );
}
