export default function CreationSkillsPanel({
  selectedClass,
  availableActiveSkills,
  availablePassiveSkills,
  selectedActiveSkills,
  selectedPassiveSkills,
  onActiveSelect,
  onPassiveToggle,
  onAction,
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
        Skill Selection
      </div>
      {selectedClass ? (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--holo-gold)",
                marginBottom: "0.5rem",
              }}
            >
              ACTIVE SKILLS ({selectedActiveSkills?.length || 0}/3)
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.35rem",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {(availableActiveSkills || []).map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onAction?.(() => onActiveSelect(skill))}
                  style={{
                    padding: "0.6rem",
                    background: (selectedActiveSkills || []).some(
                      (s) => s.id === skill.id,
                    )
                      ? "rgba(0, 243, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.6)",
                    border: (selectedActiveSkills || []).some(
                      (s) => s.id === skill.id,
                    )
                      ? "1px solid var(--holo-cyan)"
                      : "1px solid rgba(0, 243, 255, 0.3)",
                    color: "#00F3FF",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {skill.name || skill.id}
                  </div>
                  <div style={{ fontSize: "0.65rem", opacity: 0.85 }}>
                    {skill.description || "No description provided."}
                  </div>
                </button>
              ))}
              {availableActiveSkills?.length === 0 && (
                <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                  No active skills generated yet.
                </div>
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--holo-gold)",
                marginBottom: "0.5rem",
              }}
            >
              PASSIVE SKILLS ({selectedPassiveSkills?.length || 0}/6)
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.35rem",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {(availablePassiveSkills || []).map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onAction?.(() => onPassiveToggle(skill))}
                  style={{
                    padding: "0.6rem",
                    background: (selectedPassiveSkills || []).some(
                      (s) => s.id === skill.id,
                    )
                      ? "rgba(0, 243, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.6)",
                    border: (selectedPassiveSkills || []).some(
                      (s) => s.id === skill.id,
                    )
                      ? "1px solid var(--holo-cyan)"
                      : "1px solid rgba(0, 243, 255, 0.3)",
                    color: "#00F3FF",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  {skill.name || skill.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.7rem", color: "rgba(0, 243, 255, 0.8)" }}>
          Skills will be available after selecting a class
        </div>
      )}
    </div>
  );
}
