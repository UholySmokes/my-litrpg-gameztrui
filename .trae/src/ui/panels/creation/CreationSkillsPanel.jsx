const SOURCE_COLORS = {
  class: "#00F3FF",
  race: "#96F2D7",
  general: "#E599F7",
  universal: "#E599F7",
};

function SourceBadge({ source }) {
  const label = source || "unknown";
  const color = SOURCE_COLORS[label] || "var(--text-dim)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.08rem 0.3rem",
        borderRadius: "3px",
        fontSize: "0.5rem",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color,
        background: `${color}15`,
        border: `1px solid ${color}33`,
      }}
    >
      {label}
    </span>
  );
}

function SkillCard({ skill, isSelected, onClick, showDescription = false }) {
  const source = skill.source || skill.class || "general";
  const element = skill.element || null;
  const damage = skill.stats?.damage || null;
  const manaCost = skill.stats?.manaCost || null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.55rem 0.6rem",
        background: isSelected
          ? "rgba(0, 243, 255, 0.25)"
          : "rgba(0, 0, 0, 0.55)",
        border: isSelected
          ? "1px solid var(--holo-cyan)"
          : "1px solid rgba(0, 243, 255, 0.2)",
        color: "#00F3FF",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "5px",
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ fontWeight: "bold" }}>{skill.name || skill.id}</span>
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {element && (
            <span style={{ fontSize: "0.5rem", color: "var(--holo-gold)", textTransform: "uppercase" }}>
              {element}
            </span>
          )}
          <SourceBadge source={source} />
        </div>
      </div>
      {(showDescription || isSelected) && (
        <div style={{ fontSize: "0.6rem", opacity: 0.8, lineHeight: "1.35" }}>
          {skill.description || "No description provided."}
        </div>
      )}
      {(damage || manaCost) && (
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.5rem" }}>
          {damage && <span style={{ color: "#FF8787" }}>DMG: {damage}</span>}
          {manaCost && <span style={{ color: "#845EF7" }}>COST: {manaCost}</span>}
        </div>
      )}
    </button>
  );
}

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
  const activeCount = selectedActiveSkills?.length || 0;
  const passiveCount = selectedPassiveSkills?.length || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Active Skills Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--holo-gold)", fontWeight: "bold" }}>
                ACTIVE SKILLS
              </span>
              <span style={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                color: activeCount >= 3 ? "#8CE99A" : "var(--holo-cyan)",
                fontWeight: "bold",
              }}>
                {activeCount}/3 {activeCount >= 3 ? "\u2713" : ""}
              </span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
              Combat abilities triggered during encounters. Select 3.
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.3rem",
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "0.15rem",
              }}
            >
              {(availableActiveSkills || []).map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSelected={(selectedActiveSkills || []).some((s) => s.id === skill.id)}
                  onClick={() => onAction?.(() => onActiveSelect(skill))}
                  showDescription={true}
                />
              ))}
              {availableActiveSkills?.length === 0 && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", padding: "0.5rem 0" }}>
                  No active skills generated yet. Select a class to populate skills.
                </div>
              )}
            </div>
          </div>

          {/* Passive Skills Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--holo-gold)", fontWeight: "bold" }}>
                PASSIVE SKILLS
              </span>
              <span style={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                color: passiveCount >= 6 ? "#8CE99A" : "var(--holo-cyan)",
                fontWeight: "bold",
              }}>
                {passiveCount}/6 {passiveCount >= 6 ? "\u2713" : ""}
              </span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
              Always-on enhancements that shape your passive capabilities. Select 6.
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.3rem",
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "0.15rem",
              }}
            >
              {(availablePassiveSkills || []).map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSelected={(selectedPassiveSkills || []).some((s) => s.id === skill.id)}
                  onClick={() => onAction?.(() => onPassiveToggle(skill))}
                  showDescription={false}
                />
              ))}
              {availablePassiveSkills?.length === 0 && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", padding: "0.5rem 0" }}>
                  No passive skills available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.7rem", color: "rgba(0, 243, 255, 0.8)", padding: "1rem 0" }}>
          Skills will be available after selecting a class.
        </div>
      )}
    </div>
  );
}
