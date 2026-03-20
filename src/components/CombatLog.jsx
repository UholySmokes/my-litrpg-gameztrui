import React from "react";

function normalizeCombatEntry(entry, index) {
  if (typeof entry === "string") {
    return {
      id: `combat-log-${index}`,
      text: entry,
    };
  }

  return {
    id: entry?.id || `combat-log-${index}`,
    text: String(entry?.text || entry?.message || "").trim(),
  };
}

function extractTags(text) {
  const tags = [];
  if (/critical hit/i.test(text) || /critical!/i.test(text)) {
    tags.push("CRIT");
  }
  const laneMatch = text.match(/Lane gap\s+(\d+):\s+x([0-9.]+)/i);
  if (laneMatch) {
    tags.push(`Lane ${laneMatch[1]} x${laneMatch[2]}`);
  }
  if (/shield absorbs/i.test(text)) {
    tags.push("Shield");
  }
  return tags;
}

export default function CombatLog({ entries = [] }) {
  const normalizedEntries = entries
    .map((entry, index) => normalizeCombatEntry(entry, index))
    .filter((entry) => entry.text)
    .slice(-8)
    .reverse();

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          color: "var(--holo-cyan)",
          fontWeight: "bold",
          marginBottom: "0.5rem",
        }}
      >
        Combat Log:
      </div>
      {normalizedEntries.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
          No combat events yet.
        </div>
      ) : (
        <div
          className="holo-panel"
          style={{ padding: "0.75rem", maxHeight: "220px", overflowY: "auto" }}
        >
          {normalizedEntries.map((entry) => {
            const tags = extractTags(entry.text);
            return (
              <div
                key={entry.id}
                style={{
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(0, 243, 255, 0.12)",
                }}
              >
                <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
                  {entry.text}
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                    {tags.map((tag) => (
                      <span
                        key={`${entry.id}-${tag}`}
                        style={{
                          color: "var(--holo-cyan)",
                          border: "1px solid rgba(0, 243, 255, 0.3)",
                          borderRadius: "999px",
                          padding: "0.1rem 0.45rem",
                          fontSize: "0.7rem",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}