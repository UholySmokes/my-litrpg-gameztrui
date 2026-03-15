export default function SaveResetGate({
  isRetryable,
  onRetryReset,
  saveResetEpoch,
  saveResetState,
}) {
  return (
    <div className="app-frame">
      <div className="app-container">
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "rgba(0, 0, 0, 0.88)",
              border: "1px solid var(--holo-cyan)",
              borderRadius: "10px",
              padding: "1.5rem",
              display: "grid",
              gap: "0.9rem",
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                color: "var(--holo-cyan)",
                fontSize: "1rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Progress Reset Required
            </div>
            <div style={{ color: "var(--text-main)", lineHeight: 1.5 }}>
              {saveResetState.busy
                ? saveResetState.mode === "remote"
                  ? "Clearing local progress and resetting synced saves before gameplay can continue."
                  : "Clearing local progress before gameplay can continue."
                : saveResetState.error ||
                  "Legacy progress reset could not be completed."}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
              Save epoch {saveResetEpoch} invalidates all pre-origin progress.
            </div>
            {isRetryable ? (
              <button
                type="button"
                className="holo-button"
                onClick={onRetryReset}
              >
                Retry Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
