const ENTRY_STYLES = {
  narrative: {
    borderLeft: "3px solid var(--holo-cyan)",
    color: "var(--text-main)",
    label: null,
  },
  system: {
    borderLeft: "3px solid var(--holo-gold)",
    color: "var(--holo-gold)",
    label: "SYS",
  },
  "status-update": {
    borderLeft: "3px solid #845EF7",
    color: "#845EF7",
    label: "STATUS",
  },
  combat: {
    borderLeft: "3px solid #FF6B6B",
    color: "#FF8787",
    label: "COMBAT",
  },
  error: {
    borderLeft: "3px solid #FF6B6B",
    color: "#FF6B6B",
    label: "ERROR",
  },
};

const MOOD_INDICATORS = {
  tense: { icon: "\u26A0", color: "#FF8787" },
  triumphant: { icon: "\u2605", color: "#FFD700" },
  mysterious: { icon: "\u2727", color: "#E599F7" },
  serene: { icon: "\u2022", color: "#96F2D7" },
  desperate: { icon: "\u2620", color: "#FF6B6B" },
  neutral: { icon: null, color: null },
};

function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp === "number") {
    // Show relative tick number
    return `T${timestamp}`;
  }
  return null;
}

export default function NarrativeLogPanel({ entries }) {
  return (
    <div
      className="command-deck__narrative-log"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        padding: "0.25rem 0",
      }}
    >
      {entries.length === 0 && (
        <div style={{ color: "var(--text-dim)", fontSize: "0.92rem", fontStyle: "italic", padding: "0.5rem 0" }}>
          The narrative awaits your first action...
        </div>
      )}
      {entries.map((msg) => {
        const style = ENTRY_STYLES[msg.type] || ENTRY_STYLES.narrative;
        const mood = MOOD_INDICATORS[msg.mood] || MOOD_INDICATORS.neutral;
        const ts = formatTimestamp(msg.timestamp);
        const source = msg.source === "ai" ? null : msg.source === "fallback" ? "offline" : null;

        return (
          <div
            key={msg.id || `${msg.timestamp}-${msg.text}`}
            style={{
              borderLeft: style.borderLeft,
              padding: "0.4rem 0.6rem",
              background: "rgba(0, 0, 0, 0.25)",
              borderRadius: "0 4px 4px 0",
              fontSize: "1rem",
              lineHeight: "1.65",
              color: style.color,
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Entry header */}
            {(style.label || mood.icon || ts || source) && (
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  alignItems: "center",
                  marginBottom: "0.2rem",
                  fontSize: "0.62rem",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {style.label && (
                  <span style={{ color: style.color, fontWeight: "bold" }}>{style.label}</span>
                )}
                {mood.icon && (
                  <span style={{ color: mood.color }}>{mood.icon}</span>
                )}
                {ts && (
                  <span style={{ color: "var(--text-dim)" }}>{ts}</span>
                )}
                {source && (
                  <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>[{source}]</span>
                )}
              </div>
            )}
            {/* Entry text */}
            <div>{msg.text}</div>
          </div>
        );
      })}
    </div>
  );
}
