import { useState } from "react";

export default function CreationSummaryPanel({
  asciiArt,
  selectionSummary,
  selectedActiveSkills,
  selectedPassiveSkills,
  maxActiveSkills = 3,
  maxPassiveSkills = 6,
  typewriterText,
  syncProgress,
  canFinalize,
  onFinalize,
}) {
  const [isInitializing, setIsInitializing] = useState(false);
  const racePassiveAbility = selectionSummary.racePassiveAbility;
  const raceActiveAbility = selectionSummary.raceActiveAbility;
  const professionSkills = Array.isArray(selectionSummary.professionSkills)
    ? selectionSummary.professionSkills
    : [];
  const grantedActiveSkills = Array.isArray(selectionSummary.grantedActiveSkills)
    ? selectionSummary.grantedActiveSkills
    : [];
  const grantedPassiveSkills = Array.isArray(selectionSummary.grantedPassiveSkills)
    ? selectionSummary.grantedPassiveSkills
    : [];

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
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        <pre style={{ color: "var(--holo-cyan)", margin: 0, minWidth: "max-content" }}>
          {asciiArt}
        </pre>
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
              OPENING
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              Your first command defines the opening beat. Locations stay part of the wider world and unfold through play.
            </div>
            {selectionSummary.startingPrompt ? (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  lineHeight: 1.45,
                }}
              >
                <strong>Command:</strong> {selectionSummary.startingPrompt}
              </div>
            ) : null}
          </div>
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              ORIGIN
            </div>
            {(() => {
              const biomeColors = {
                social:      { badge: "#c77dff", border: "rgba(155, 89, 182, 0.55)" },
                exploration: { badge: "#4ade9a", border: "rgba(0, 200, 130, 0.45)" },
                combat:      { badge: "#ff6b6b", border: "rgba(230, 80, 60, 0.45)" },
              };
              const biome = selectionSummary.originBiome;
              const colors = biomeColors[biome] || null;
              return (
                <>
                  <div style={{ fontSize: "1rem", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                    {selectionSummary.originName}
                    {colors && biome && (
                      <span
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: colors.badge,
                          border: `1px solid ${colors.badge}`,
                          borderRadius: "4px",
                          padding: "0.05rem 0.32rem",
                        }}
                      >
                        {biome}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.45 }}>
                    {selectionSummary.originDescription}
                  </div>
                </>
              );
            })()}
          </div>
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
            {(racePassiveAbility || raceActiveAbility) && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  marginTop: "0.4rem",
                  display: "grid",
                  gap: "0.2rem",
                }}
              >
                {racePassiveAbility ? (
                  <div>
                    <strong>Passive:</strong> {racePassiveAbility.name} -{" "}
                    {racePassiveAbility.description}
                  </div>
                ) : null}
                {raceActiveAbility ? (
                  <div>
                    <strong>Active:</strong> {raceActiveAbility.name} -{" "}
                    {raceActiveAbility.description}
                  </div>
                ) : null}
              </div>
            )}
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
              TALENTS
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.talentName}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.talentDescription}
            </div>
          </div>
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              PROFESSION
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.professionName || "Path Undefined"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.professionDescription ||
                "Commit to a path to unlock nascent skills."}
            </div>
            {professionSkills.length ? (
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  lineHeight: 1.35,
                }}
              >
                <strong>Tier 1:</strong>{" "}
                {professionSkills
                  .slice(0, 6)
                  .map((skill) => String(skill).replace(/_/g, " "))
                  .join(", ")}
              </div>
            ) : null}
          </div>
          <div style={{ color: "var(--holo-cyan)" }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              SYSTEM
            </div>
            <div style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>
              {selectionSummary.systemName}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {selectionSummary.systemDescription}
            </div>
            {selectionSummary.systemMatchSummary ? (
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.35rem", lineHeight: 1.35 }}>
                {selectionSummary.systemMatchSummary}
              </div>
            ) : null}
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
                color: "#8CE99A",
                fontWeight: "bold",
                marginBottom: "0.25rem",
              }}
            >
              SYSTEM-GRANTED
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1rem",
                color: "var(--text-main)",
                minHeight: "2.5rem",
              }}
            >
              {grantedActiveSkills.length === 0 && grantedPassiveSkills.length === 0 ? (
                <li style={{ color: "var(--text-dim)" }}>No automatic system skills.</li>
              ) : (
                <>
                  {grantedActiveSkills.map((skill) => (
                    <li key={`ga-${skill.id}`}>
                      <strong>{skill.name}</strong> - Active
                    </li>
                  ))}
                  {grantedPassiveSkills.map((skill) => (
                    <li key={`gp-${skill.id}`}>
                      <strong>{skill.name}</strong> - Passive
                    </li>
                  ))}
                </>
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
              ACTIVE SKILLS ({selectedActiveSkills.length}/{maxActiveSkills})
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
                  const desc = skill.description || "System memory fragmented.";
                  return (
                    <li key={skill.id}>
                      <strong>{skill.name}</strong> - {desc} (Rank {rank})
                    </li>
                  );
                })
              ) : (
                <li style={{ color: "var(--text-dim)" }}>
                  Select {maxActiveSkills} active skills.
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
              PASSIVE SKILLS ({selectedPassiveSkills.length}/{maxPassiveSkills})
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
                  const desc = skill.description || "System memory fragmented.";
                  return (
                    <li key={skill.id}>
                      <strong>{skill.name}</strong> - {desc} (Rank {rank})
                    </li>
                  );
                })
              ) : (
                <li style={{ color: "var(--text-dim)" }}>
                  Select {maxPassiveSkills} passive skills.
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
            Soul synthesis verified. Ready for manifestation.
          </div>
        ) : (
          <div style={{ color: "orange", marginBottom: "1rem" }}>
            Soul synthesis incomplete. Fulfill all chamber designations.
          </div>
        )}
        {canFinalize ? (
          <button
            type="button"
            onClick={async () => {
              if (isInitializing || typeof onFinalize !== "function") {
                return;
              }
              setIsInitializing(true);
              try {
                await onFinalize();
              } finally {
                setIsInitializing(false);
              }
            }}
            disabled={isInitializing}
            aria-busy={isInitializing}
            style={{
              width: "100%",
              padding: "1.5rem",
              background: "linear-gradient(135deg, var(--holo-gold), #FFA500)",
              border: "2px solid var(--holo-gold)",
              color: "#000",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: isInitializing ? "not-allowed" : "pointer",
              opacity: isInitializing ? 0.75 : 1,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(event) => {
              if (isInitializing) return;
              event.target.style.transform = "scale(1.02)";
              event.target.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(event) => {
              event.target.style.transform = "scale(1)";
              event.target.style.boxShadow = "none";
            }}
          >
            {isInitializing ? "MANIFESTING..." : "MANIFEST AVATAR"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
