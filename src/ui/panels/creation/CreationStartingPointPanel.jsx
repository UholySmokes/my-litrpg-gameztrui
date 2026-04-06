const EXAMPLE_STARTS = [
  "I join the scouts, keep quiet, and ask who needs another blade.",
  "I steady myself, watch the crowd, and wait for the first opening worth taking.",
  "I ask the nearest locals what trouble is already moving and who is desperate enough to pay.",
];

export default function CreationStartingPointPanel({
  startingPrompt = "",
  onStartingPromptChange,
  onOptimizePrompt,
  optimizedPromptAlternates = [],
  onSelectAlternate,
}) {
  return (
    <div className="creation-starting-point-panel">
      <p style={{ fontSize: "0.82rem", opacity: 0.72, marginBottom: "1rem", lineHeight: 1.5 }}>
        Write the exact opening you want. This command defines the first beat of the chronicle,
        then auto-runs as your opening turn.
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
            Optimize the draft to get three cleaner opening variants you can still edit.
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
