export default function CreationNarrativePanel({
  statusLines = [],
  typewriterText,
  syncProgress,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ color: "var(--holo-cyan)", fontFamily: "monospace" }}>
        Genesis stream online. Configure lineage, archetype, and attributes.
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
        {typewriterText}
        <span style={{ animation: "blink 1s infinite" }}>_</span>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--holo-cyan)" }}>
        SYNC {syncProgress}%
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li>1. Select a race to anchor your origin.</li>
        <li>2. Choose a class to define combat doctrine.</li>
        <li>3. Allocate attribute points for survivability.</li>
        <li>4. Confirm talents and finalize identity.</li>
      </ul>
      <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.8rem" }}>
        {statusLines.map((line) => (
          <div key={line.label} style={{ color: line.active ? "#00F3FF" : "var(--text-dim)" }}>
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}
