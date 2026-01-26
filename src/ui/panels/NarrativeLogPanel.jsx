export default function NarrativeLogPanel({ chatLog }) {
  return (
    <div className="command-deck__narrative-log">
      {chatLog.map((msg, index) => (
        <div
          key={index}
          className={msg.type}
          style={{ marginBottom: "0.5rem" }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
