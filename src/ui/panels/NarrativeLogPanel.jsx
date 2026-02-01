export default function NarrativeLogPanel({ entries }) {
  return (
    <div className="command-deck__narrative-log">
      {entries.map((msg) => (
        <div
          key={msg.id || `${msg.timestamp}-${msg.text}`}
          className={msg.type}
          style={{ marginBottom: "0.5rem" }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
