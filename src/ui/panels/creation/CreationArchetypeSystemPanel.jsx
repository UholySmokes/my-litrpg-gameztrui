export default function CreationArchetypeSystemPanel({
  systems,
  selectedSystem,
  onSystemSelect,
  onAction,
}) {
  const selectedId = selectedSystem?.id || selectedSystem;
  const selectedEntry =
    selectedSystem ||
    (systems || []).find((system) => system.id === selectedId) ||
    null;

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
        Archetype System
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
        Choose one system, authority, privilege, framework, or path.
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
          maxHeight: "260px",
          overflowY: "auto",
        }}
      >
        {(systems || []).map((system) => {
          const isSelected = system.id === selectedId;
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => onAction?.(() => onSystemSelect(system.id))}
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
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                <span>{system.name}</span>
                <span style={{ color: "var(--holo-gold)", fontSize: "0.7rem" }}>
                  {system.category}
                </span>
              </div>
              <div style={{ fontSize: "0.65rem", opacity: 0.85 }}>
                {system.summary || system.description}
              </div>
            </button>
          );
        })}
        {(systems || []).length === 0 && (
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
            No systems available.
          </div>
        )}
      </div>
      {selectedEntry && (
        <div
          style={{
            border: "1px solid rgba(0, 243, 255, 0.2)",
            padding: "0.6rem",
            borderRadius: "6px",
            background: "rgba(0, 0, 0, 0.45)",
            display: "grid",
            gap: "0.35rem",
            fontSize: "0.7rem",
            color: "var(--text-main)",
          }}
        >
          <div style={{ color: "var(--holo-gold)" }}>CORE LOOP</div>
          <div>{(selectedEntry.coreLoop || []).join(" ")}</div>
          <div style={{ color: "var(--holo-gold)" }}>PROGRESSION</div>
          <div>{(selectedEntry.progression || []).join(" ")}</div>
        </div>
      )}
    </div>
  );
}
