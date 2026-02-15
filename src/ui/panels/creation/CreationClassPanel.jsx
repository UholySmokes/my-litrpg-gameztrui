import { DataRegistry } from "../../../data/DataRegistry.js";
import { getClassAbilitiesFor } from "../../../systems/class/ClassAbilityRegistry.js";

const RESOURCE_COLORS = {
  rage: "#FF6B6B",
  chi: "#51CF66",
  focus: "#845EF7",
  stealth: "#20C997",
  energy: "#FFD700",
  mana: "#845EF7",
};

function ResourceBadge({ resource }) {
  if (!resource) return null;
  const color = RESOURCE_COLORS[resource] || "var(--holo-cyan)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        padding: "0.12rem 0.4rem",
        borderRadius: "3px",
        fontSize: "0.55rem",
        fontWeight: "bold",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color,
        background: `${color}18`,
        border: `1px solid ${color}44`,
      }}
    >
      {resource}
    </span>
  );
}

function ArchetypeBadge({ archetype }) {
  if (!archetype) return null;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.1rem 0.35rem",
        borderRadius: "8px",
        fontSize: "0.55rem",
        color: "var(--holo-gold)",
        background: "rgba(255, 215, 0, 0.08)",
        border: "1px solid rgba(255, 215, 0, 0.2)",
      }}
    >
      {archetype}
    </span>
  );
}

export default function CreationClassPanel({
  selectedClass,
  onClassSelect,
  onAction,
}) {
  const classes = DataRegistry.getClasses().filter(
    (cls) => Number(cls?.tier || 1) === 1,
  );

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
        Combat Protocol
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
        Your class defines combat style, resource mechanics, and skill progression.
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "0.2rem",
        }}
      >
        {classes.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          const resource = cls.resourceSystem || cls.resource || null;
          const archetype = cls.archetype || null;
          const classSkills = Array.isArray(cls.skills) ? cls.skills : [];
          const classAbilities = getClassAbilitiesFor(cls.id) || [];
          const mergedSkillNames = Array.from(
            new Set(
              [...classSkills, ...classAbilities]
                .map((entry) =>
                  typeof entry === "string" ? entry : entry?.name || entry?.id,
                )
                .filter(Boolean),
            ),
          );
          const skillCount = mergedSkillNames.length;

          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onAction?.(() => onClassSelect(cls))}
              style={{
                padding: "0.75rem",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(0,0,0,0.7))"
                  : "rgba(0, 0, 0, 0.55)",
                border: isSelected
                  ? "2px solid var(--holo-cyan)"
                  : "1px solid rgba(0, 243, 255, 0.2)",
                color: "#00F3FF",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", letterSpacing: "1px" }}>{cls.name.toUpperCase()}</span>
                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  {resource && <ResourceBadge resource={resource} />}
                  {isSelected && (
                    <span style={{ fontSize: "0.55rem", color: "var(--holo-gold)", fontWeight: "bold" }}>SELECTED</span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: "1.35" }}>
                {cls.description}
              </div>

              {skillCount > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: "0.2rem",
                    marginTop: "0.1rem",
                    fontSize: "0.58rem",
                    color: "var(--text-dim)",
                  }}
                >
                  <span style={{ color: "var(--holo-gold)" }}>Skill List</span>
                  <span>
                    {mergedSkillNames.slice(0, 6).join(", ")}
                    {mergedSkillNames.length > 6 ? ", ..." : ""}
                  </span>
                </div>
              )}

              {/* Class metadata row */}
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                {archetype && <ArchetypeBadge archetype={archetype} />}
                {skillCount > 0 && (
                  <span style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>
                    {skillCount} skill{skillCount !== 1 ? "s" : ""}
                  </span>
                )}
                {cls.progression?.hpGrowth && (
                  <span style={{ fontSize: "0.55rem", color: "#FF8787" }}>
                    HP+{cls.progression.hpGrowth}/lvl
                  </span>
                )}
                {cls.progression?.manaGrowth && (
                  <span style={{ fontSize: "0.55rem", color: "#845EF7" }}>
                    MP+{cls.progression.manaGrowth}/lvl
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
