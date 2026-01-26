import { DataRegistry } from "../../../data/DataRegistry.js";

export default function CreationClassPanel({
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
        Combat Protocol
      </div>
      <div
        style={{
          color: "var(--holo-cyan)",
          fontFamily: "monospace",
          marginBottom: "0.5rem",
        }}
      >
        CLASS SELECTION
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          maxHeight: "360px",
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
  );
}
