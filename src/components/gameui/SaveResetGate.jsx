export default function SaveResetGate({
  isRetryable,
  onRetryReset,
  saveResetEpoch,
  saveResetState,
}) {
  const bodyText = saveResetState.busy
    ? saveResetState.mode === "remote"
      ? "Clearing local progress and resetting synced saves before gameplay can continue."
      : "Clearing local progress before gameplay can continue."
    : saveResetState.recoverable
      ? "Local sync storage was unavailable, so gameplay will continue on a fresh local recovery path."
      : saveResetState.error || "Legacy progress reset could not be completed.";

  return (
    <div className="app-frame">
      <div className="app-container">
        <div className="save-reset-gate">
          <div className="save-reset-gate__card">
            <div className="save-reset-gate__eyebrow">Recovery Ritual</div>
            <h1 className="save-reset-gate__title">Progress Reset Required</h1>
            <div className="save-reset-gate__body">{bodyText}</div>
            <div className="save-reset-gate__meta">
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
