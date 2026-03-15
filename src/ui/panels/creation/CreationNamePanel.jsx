export default function CreationNamePanel({
  characterName,
  onNameChange,
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
        Genesis Terminal
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", lineHeight: "1.5" }}>
        Choose the name first. Your System is selected immediately after this and can reshape the rest of creation.
      </div>
      <div>
        <div
          style={{
            color: "var(--holo-cyan)",
            fontFamily: "monospace",
            marginBottom: "0.5rem",
          }}
        >
          DESIGNATION
        </div>
        <input
          type="text"
          value={characterName || ""}
          onChange={(event) => onNameChange(event.target.value)}
          aria-label="Character designation"
          placeholder="Enter designation"
          style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            border: "2px solid var(--holo-cyan)",
            color: "#00F3FF",
            padding: "0.85rem",
            fontFamily: "monospace",
            fontSize: "1rem",
            borderRadius: "6px",
          }}
        />
      </div>
    </div>
  );
}
