export default function CreationChoicePanel({
  title,
  subtitle,
  options = [],
  selectedIds = [],
  onToggle,
  maxSelections = 1,
  minSelections = 0,
  allowNone = false,
  onSelectNone,
  noneLabel = "None",
  onAction,
}) {
  const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);

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
        {title}
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
        {subtitle}
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--holo-gold)" }}>
        Picks: {selectedSet.size}
        {Number.isFinite(minSelections) ? ` (min ${minSelections})` : ""}
        {Number.isFinite(maxSelections) ? ` (max ${maxSelections})` : ""}
      </div>

      {allowNone && (
        <button
          type="button"
          onClick={() => onAction?.(() => onSelectNone?.())}
          style={{
            padding: "0.65rem",
            textAlign: "left",
            background: selectedSet.size === 0 ? "rgba(0, 243, 255, 0.18)" : "rgba(0, 0, 0, 0.55)",
            border:
              selectedSet.size === 0
                ? "2px solid var(--holo-cyan)"
                : "1px solid rgba(0, 243, 255, 0.2)",
            color: "#00F3FF",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.8rem",
          }}
        >
          {noneLabel}
        </button>
      )}

      <div style={{ display: "grid", gap: "0.5rem", maxHeight: "360px", overflowY: "auto" }}>
        {options.map((entry) => {
          const isSelected = selectedSet.has(entry.id);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onAction?.(() => onToggle?.(entry.id))}
              style={{
                padding: "0.75rem",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(0,0,0,0.7))"
                  : "rgba(0, 0, 0, 0.55)",
                border: isSelected
                  ? "2px solid var(--holo-cyan)"
                  : "1px solid rgba(0, 243, 255, 0.2)",
                color: "#00F3FF",
                borderRadius: "6px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "0.3rem" }}>{entry.name || entry.id}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                {entry.description || "No description available."}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
