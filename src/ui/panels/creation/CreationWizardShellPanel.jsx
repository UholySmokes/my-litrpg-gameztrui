export default function CreationWizardShellPanel({
  title,
  steps,
  activeStepId,
  sidebar,
  content,
  error,
  onBack,
  onNext,
  canBack,
  canNext,
  onStepSelect,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        fontFamily: "monospace",
        color: "var(--text-main)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.8rem",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontSize: "1.05rem",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: "bold",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
            Guided phases with full compatibility to existing panels and game state.
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={!canBack}
            onClick={onBack}
            style={{
              padding: "0.55rem 0.8rem",
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(0, 243, 255, 0.25)",
              borderRadius: "6px",
              color: "var(--holo-cyan)",
              cursor: canBack ? "pointer" : "not-allowed",
              opacity: canBack ? 1 : 0.45,
            }}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={onNext}
            style={{
              padding: "0.55rem 0.9rem",
              background: canNext
                ? "linear-gradient(135deg, rgba(0, 243, 255, 0.25), rgba(0,0,0,0.75))"
                : "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(0, 243, 255, 0.5)",
              borderRadius: "6px",
              color: "var(--holo-cyan)",
              cursor: canNext ? "pointer" : "not-allowed",
              opacity: canNext ? 1 : 0.45,
              fontWeight: "bold",
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.45rem",
        }}
      >
        {steps.map((step, idx) => {
          const isActive = step.id === activeStepId;
          const isDone = step.status === "done";
          const isLocked = step.status === "locked";
          const clickable = typeof onStepSelect === "function" && !isLocked;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!clickable}
              onClick={() => onStepSelect(step.id)}
              style={{
                padding: "0.55rem 0.6rem",
                textAlign: "left",
                background: isActive
                  ? "linear-gradient(135deg, rgba(0, 243, 255, 0.22), rgba(0,0,0,0.72))"
                  : "rgba(0, 0, 0, 0.5)",
                border: isActive
                  ? "2px solid var(--holo-cyan)"
                  : "1px solid rgba(0, 243, 255, 0.18)",
                borderRadius: "8px",
                color: "var(--text-main)",
                cursor: clickable ? "pointer" : "not-allowed",
                opacity: isLocked ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: isActive ? "var(--holo-cyan)" : "var(--text-dim)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Phase {idx + 1}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: isActive ? "bold" : "normal" }}>
                  {step.label}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: "bold",
                  color: isDone
                    ? "var(--holo-gold)"
                    : isActive
                      ? "var(--holo-cyan)"
                      : "var(--text-dim)",
                }}
              >
                {isDone ? "DONE" : isActive ? "NOW" : isLocked ? "LOCK" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {error ? (
        <div
          style={{
            padding: "0.65rem 0.8rem",
            background: "rgba(255, 135, 135, 0.08)",
            border: "1px solid rgba(255, 135, 135, 0.35)",
            borderRadius: "8px",
            color: "#FF8787",
            fontSize: "0.75rem",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "0.9rem",
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.55)",
            border: "1px solid rgba(0, 243, 255, 0.18)",
            borderRadius: "10px",
            padding: "0.85rem",
            minHeight: "300px",
          }}
        >
          {sidebar}
        </div>

        <div
          style={{
            background: "rgba(0, 0, 0, 0.55)",
            border: "1px solid rgba(0, 243, 255, 0.18)",
            borderRadius: "10px",
            padding: "0.85rem",
            minHeight: "300px",
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

