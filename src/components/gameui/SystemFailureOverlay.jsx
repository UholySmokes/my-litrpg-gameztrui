export default function SystemFailureOverlay({ onRestart }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <h2 style={{ color: "var(--holo-alert)", marginBottom: "1rem" }}>
        SYSTEM FAILURE
      </h2>
      <p style={{ marginBottom: "1.5rem", color: "var(--text-main)" }}>
        Critical damage sustained. System shutdown initiated.
      </p>
      <button
        className="holo-button"
        onClick={onRestart}
        style={{
          borderColor: "var(--holo-alert)",
          color: "var(--holo-alert)",
        }}
      >
        Restart System
      </button>
    </div>
  );
}
