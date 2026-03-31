export default function SaveResetGate({
  isRetryable,
  onRetryReset,
  saveResetEpoch,
  saveResetState,
}) {
  return (
    <div className="app-frame">
      <div className="app-container">
        <div className="save-reset-gate">
          <div className="save-reset-gate__card">
            <div className="save-reset-gate__eyebrow">Recovery Ritual</div>
            <h1 className="save-reset-gate__title">Progress Reset Required</h1>
            <div className="save-reset-gate__body">
              {saveResetState.busy
                ? saveResetState.mode === "remote"
                  ? "Clearing local progress and resetting synced saves before gameplay can continue."
                  : "Clearing local progress before gameplay can continue."
                : saveResetState.error ||
                  "Legacy progress reset could not be completed."}
            </div>
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
