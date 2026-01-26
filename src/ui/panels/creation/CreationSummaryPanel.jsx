export default function CreationSummaryPanel({
  asciiArt,
  selectionSummary,
  selectedActiveSkills,
  selectedPassiveSkills,
  typewriterText,
  syncProgress,
  canFinalize,
  finalizeCharacter,
  onComplete,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.6rem",
          lineHeight: "1.2",
          whiteSpace: "pre",
        }}
      >
        <pre style={{ color: "var(--holo-cyan)", margin: 0 }}>{asciiArt}</pre>
      </div>
      <div
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          border: "1px solid var(--holo-cyan)",
          padding: "1.25rem",
          borderRadius: "6px",
          fontSize: "0.9rem",
          color: "var(--text-main)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              RACE
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.raceName}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.raceDescription}
            </div>
          </div>
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              CLASS
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.className}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.classDescription}
            </div>
          </div>
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              TALENT
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.talentName}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.talentDescription}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--holo-gold)",
                fontWeight: "bold",
                marginBottom: "0.25rem",
              }}
            >
              ACTIVE SKILLS ({selectedActiveSkills.length}/3)
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1rem",
                color: "var(--text-main)",
                minHeight: "2.5rem",
              }}
            >
              {selectionSummary.activeSkills ? (
                selectionSummary.activeSkills.map((skill) => {
                  const rank = skill.level || skill.rank || 1;
                  const desc = skill.description || "No description provided.";
                  return (
                    <li key={skill.id}>
                      <strong>{skill.name}</strong> — {desc} (Rank {rank})
                    </li>
                  );
                })
              ) : (
                <li style={{ color: "var(--text-dim)" }}>
                  Select 3 active skills.
                </li>
              )}
            </ul>
          </div>
          <div>
            <div
              style={{
                color: "var(--holo-gold)",
                fontWeight: "bold",
                marginBottom: "0.25rem",
              }}
            >
              PASSIVE SKILLS ({selectedPassiveSkills.length}/6)
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1rem",
                color: "var(--text-main)",
                minHeight: "2.5rem",
              }}
            >
              {selectionSummary.passiveSkills ? (
                selectionSummary.passiveSkills.map((skill) => {
                  const rank = skill.level || skill.rank || 1;
                  const desc = skill.description || "No description provided.";
                  return (
                    <li key={skill.id}>
                      <strong>{skill.name}</strong> — {desc} (Rank {rank})
                    </li>
                  );
                })
              ) : (
                <li style={{ color: "var(--text-dim)" }}>
                  Select 6 passive skills.
                </li>
              )}
            </ul>
          </div>
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--text-dim)",
            borderTop: "1px solid rgba(0, 243, 255, 0.2)",
            paddingTop: "0.75rem",
          }}
        >
          {typewriterText}
          <span style={{ animation: "blink 1s infinite" }}>_</span>
        </div>
      </div>
      <div>
        <div
          style={{
            color: "var(--holo-cyan)",
            fontFamily: "monospace",
            marginBottom: "0.5rem",
          }}
        >
          SYSTEM SYNC: {syncProgress}%
        </div>
        <div
          style={{
            width: "100%",
            height: "20px",
            background: "rgba(0, 0, 0, 0.8)",
            border: "1px solid var(--holo-cyan)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${syncProgress}%`,
              height: "100%",
              background: `linear-gradient(90deg, var(--holo-cyan), var(--holo-accent))`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      <div>
        {canFinalize ? (
          <div style={{ color: "green", marginBottom: "1rem" }}>
            Ready to initialize!
          </div>
        ) : (
          <div style={{ color: "orange", marginBottom: "1rem" }}>
            Complete all requirements to initialize
          </div>
        )}
        {canFinalize && (
          <button
            type="button"
            onClick={() => {
              try {
                const result = finalizeCharacter();
                if (onComplete && result.valid && result.characterData) {
                  onComplete(result.characterData);
                } else {
                  alert("Character finalization failed!");
                  return;
                }
                alert("Initialization complete!");
              } catch (error) {
                alert("Error: " + error.message);
              }
            }}
            style={{
              width: "100%",
              padding: "1.5rem",
              background: "linear-gradient(135deg, var(--holo-gold), #FFA500)",
              border: "2px solid var(--holo-gold)",
              color: "#000",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(event) => {
              event.target.style.transform = "scale(1.02)";
              event.target.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(event) => {
              event.target.style.transform = "scale(1)";
              event.target.style.boxShadow = "none";
            }}
          >
            INITIALIZE AVATAR
          </button>
        )}
      </div>
    </div>
  );
}
