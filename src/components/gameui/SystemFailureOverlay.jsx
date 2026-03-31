export default function SystemFailureOverlay({ onRestart }) {
  return (
    <div className="system-failure">
      <h2 className="system-failure__title">System Failure</h2>
      <p className="system-failure__copy">
        Critical damage sustained. System shutdown initiated.
      </p>
      <button
        className="holo-button"
        onClick={onRestart}
        style={{ borderColor: "var(--holo-alert)", color: "#f1c0ad" }}
      >
        Restart Chronicle
      </button>
    </div>
  );
}
