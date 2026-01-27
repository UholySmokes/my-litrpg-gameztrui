export default function NarrativeMemoryPanel({
  summary,
  entries,
  latestEntry,
  latestEntryText,
  containerRef,
}) {
  if (!entries.length) {
    return <div style={{ color: "var(--text-dim)" }}>No memory yet.</div>;
  }

  return (
    <div className="narrative-memory-panel">
      <div className="command-deck__panel-title">Narrative Memory</div>
      {summary && <p className="command-deck__summary">{summary}</p>}
      <div
        className="narrative-memory-entries"
        ref={containerRef}
        aria-label="AI narrative memory entries"
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {entries.map((entry) => {
            const isLatest = entry.timestamp === latestEntry?.timestamp;
            const classNames = ["narrative-memory-entry"];
            if (isLatest) {
              classNames.push("narrative-memory-entry--latest");
            }
            return (
              <li key={entry.timestamp} className={classNames.join(" ")}>
                {isLatest ? latestEntryText : entry.text}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
