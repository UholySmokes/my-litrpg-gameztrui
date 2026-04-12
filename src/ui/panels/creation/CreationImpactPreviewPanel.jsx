function PreviewGroup({ label, title, lines = [], accent = "var(--holo-cyan)" }) {
  if (!title && lines.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "0.75rem 0.85rem",
        borderRadius: "10px",
        border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
        background: "rgba(3, 10, 18, 0.82)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.64rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: "bold",
          }}
        >
          {label}
        </span>
        <strong style={{ color: "var(--text-main)", fontSize: "0.82rem" }}>{title}</strong>
      </div>
      {lines.map((line) => (
        <div key={line} style={{ color: "var(--text-dim)", fontSize: "0.75rem", lineHeight: 1.45 }}>
          {line}
        </div>
      ))}
    </div>
  );
}

export default function CreationImpactPreviewPanel({ groups = [] }) {
  const visibleGroups = groups.filter(
    (group) => group && (group.title || (Array.isArray(group.lines) && group.lines.length > 0)),
  );

  return (
    <div style={{ display: "grid", gap: "0.8rem" }}>
      <div>
        <div className="creation-flow__eyebrow">Immediate Impact</div>
        <h3 className="surface-section__title" style={{ marginBottom: "0.35rem" }}>
          Read the first-run consequences as you build.
        </h3>
        <p style={{ color: "var(--text-dim)", fontSize: "0.76rem", lineHeight: 1.5, margin: 0 }}>
          These previews stay practical: opening location pressure, starter kit identity, combat loop, and
          tier-one advantages.
        </p>
      </div>
      {visibleGroups.length > 0 ? (
        visibleGroups.map((group) => (
          <PreviewGroup
            key={group.label}
            label={group.label}
            title={group.title}
            lines={group.lines}
            accent={group.accent}
          />
        ))
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", lineHeight: 1.5 }}>
          Choose a system, lineage, doctrine, and origin to populate the opening forecast.
        </div>
      )}
    </div>
  );
}
