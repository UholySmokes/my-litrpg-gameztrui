function Section({ title, children }) {
  return (
    <section
      style={{
        border: "1px solid rgba(0, 243, 255, 0.14)",
        background: "rgba(4, 12, 22, 0.58)",
        borderRadius: "10px",
        padding: "0.85rem",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: "0.65rem",
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function renderEntryBody(entry) {
  if (typeof entry?.body === "string" && entry.body.trim()) {
    return entry.body.trim();
  }
  return "Chronicle detail pending.";
}

export default function ChronicleArchivePanel({ chronicle = {} }) {
  const entries = Array.isArray(chronicle?.entries) ? chronicle.entries.slice().reverse() : [];
  const firsts =
    chronicle?.firsts && typeof chronicle.firsts === "object"
      ? Object.entries(chronicle.firsts).filter(([, value]) => Boolean(value))
      : [];
  const discoveries = Array.isArray(chronicle?.discoveries) ? chronicle.discoveries : [];
  const factionMilestones = Array.isArray(chronicle?.factionMilestones)
    ? chronicle.factionMilestones
    : [];

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <Section title="Recorded Firsts">
        {firsts.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {firsts.map(([key]) => (
              <span
                key={key}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(255, 215, 0, 0.24)",
                  background: "rgba(255, 215, 0, 0.08)",
                  color: "#ffd86a",
                  fontSize: "0.74rem",
                }}
              >
                {key}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>No firsts recorded yet.</div>
        )}
      </Section>

      <Section title="Chronicle Entries">
        {entries.length ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {entries.slice(0, 10).map((entry) => (
              <article
                key={entry?.id || entry?.title}
                style={{
                  padding: "0.7rem 0.75rem",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ color: "var(--holo-cyan)", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {entry?.title || "Untitled Entry"}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.45 }}>
                  {renderEntryBody(entry)}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>No chronicle entries recorded yet.</div>
        )}
      </Section>

      <Section title="Discoveries">
        {discoveries.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {discoveries.map((entry) => (
              <span
                key={entry?.id || entry?.label}
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "999px",
                  background: "rgba(0, 243, 255, 0.08)",
                  border: "1px solid rgba(0, 243, 255, 0.18)",
                  color: "var(--holo-cyan)",
                  fontSize: "0.78rem",
                }}
              >
                {entry?.label || entry?.id}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>No discoveries archived yet.</div>
        )}
      </Section>

      <Section title="Faction Milestones">
        {factionMilestones.length ? (
          <div style={{ display: "grid", gap: "0.45rem" }}>
            {factionMilestones.map((entry) => (
              <div key={entry?.id || entry?.factionId} style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "#ffd86a" }}>{entry?.label || entry?.factionId}</strong>
                {" · "}
                <span>{entry?.status || "contact"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>No faction milestones yet.</div>
        )}
      </Section>
    </div>
  );
}
