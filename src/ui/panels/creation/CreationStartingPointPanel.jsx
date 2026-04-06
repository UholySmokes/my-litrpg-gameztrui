const EXAMPLE_STARTS = [
  "I wake in Rootbound Camp, join the scouts, and ask who knows a safe way into the Fringe.",
  "I begin in the Wildroot Fringe, crouched at the tree line and listening for movement before I step out.",
  "I arrive at Rebirth Alcove and ask the first guild runner what trouble is already looking for me.",
];

export default function CreationStartingPointPanel({
  startingPrompt = "",
  onStartingPromptChange,
  onOptimizePrompt,
  optimizedPromptAlternates = [],
  onSelectAlternate,
  inferredStartingLocation,
  inferredStartingZone,
}) {
  return (
    <div className="creation-starting-point-panel">
      <p style={{ fontSize: "0.82rem", opacity: 0.72, marginBottom: "1rem", lineHeight: 1.5 }}>
        Write the exact opening you want. The world will infer the safest valid spawn from your text,
        then auto-run it as your first turn.
      </p>

      <label
        htmlFor="creation-start-command"
        style={{
          display: "block",
          marginBottom: "0.45rem",
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--holo-cyan)",
        }}
      >
        Start Command
      </label>
      <textarea
        id="creation-start-command"
        value={startingPrompt}
        onChange={(event) => onStartingPromptChange?.(event.target.value)}
        placeholder="I wake in Rootbound Camp, fall in with the caravan hands, and ask who is heading toward the Wildroot Fringe."
        rows={5}
        style={{
          width: "100%",
          minHeight: "8.5rem",
          resize: "vertical",
          padding: "0.85rem 0.95rem",
          borderRadius: "10px",
          border: "1px solid rgba(0, 243, 255, 0.35)",
          background: "rgba(2, 8, 18, 0.92)",
          color: "var(--text-main)",
          fontSize: "0.92rem",
          lineHeight: 1.5,
          fontFamily: "inherit",
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "0.9rem",
        }}
      >
        <button
          type="button"
          className="creation-option-btn"
          onClick={() => onOptimizePrompt?.()}
          disabled={!startingPrompt.trim()}
          style={{ minWidth: "13rem" }}
        >
          Optimize Prompt
        </button>
        <div
          style={{
            padding: "0.55rem 0.8rem",
            borderRadius: "999px",
            border: "1px solid rgba(140, 233, 154, 0.35)",
            background: "rgba(18, 38, 24, 0.72)",
            color: "#8ce99a",
            fontSize: "0.8rem",
          }}
        >
          Spawn: {inferredStartingLocation?.name || "Rebirth Alcove"} / {inferredStartingZone?.name || "Meridian Arcology"}
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "grid", gap: "0.65rem" }}>
        <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
          Alternate Rewrites
        </div>
        {optimizedPromptAlternates.length > 0 ? (
          optimizedPromptAlternates.map((alternate) => (
            <button
              key={alternate}
              type="button"
              className="creation-option-btn"
              onClick={() => onSelectAlternate?.(alternate)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.2rem",
                textAlign: "left",
                padding: "0.75rem 0.85rem",
              }}
            >
              <strong style={{ fontSize: "0.82rem" }}>Use This Rewrite</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.45 }}>
                {alternate}
              </span>
            </button>
          ))
        ) : (
          <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
            Optimize the draft to get three cleaner handoff variants you can still edit.
          </div>
        )}
      </div>

      <div style={{ marginTop: "1.1rem", display: "grid", gap: "0.45rem" }}>
        <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
          Example Starts
        </div>
        {EXAMPLE_STARTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSelectAlternate?.(example)}
            style={{
              textAlign: "left",
              background: "transparent",
              color: "var(--text-dim)",
              border: "1px dashed rgba(255,255,255,0.14)",
              borderRadius: "10px",
              padding: "0.7rem 0.8rem",
              cursor: "pointer",
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
