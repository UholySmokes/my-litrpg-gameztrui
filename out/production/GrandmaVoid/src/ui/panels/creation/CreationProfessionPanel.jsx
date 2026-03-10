import {
  PROFESSION_CATEGORIES,
  PROFESSIONS,
} from "../../../systems/profession/ProfessionRegistry.js";

function StatChip({ label }) {
  if (!label) return null;
  return (
    <span
      style={{
        fontSize: "0.6rem",
        color: "var(--text-main)",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(0, 243, 255, 0.18)",
        borderRadius: "999px",
        padding: "0.15rem 0.45rem",
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function getProfessionT1Skills(profession) {
  const tier1 = profession?.tierUnlocks?.[1];
  const skills = Array.isArray(tier1?.skills) ? tier1.skills : [];
  return skills.slice(0, 6);
}

export default function CreationProfessionPanel({
  selectedProfession,
  onProfessionSelect,
  onAction,
}) {
  const professionList = Object.values(PROFESSIONS || {}).filter(Boolean);
  const categories = Object.values(PROFESSION_CATEGORIES || {}).filter(Boolean);

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
        Profession
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
        Pick one craft or calling. You start with tier-1 skills from this profession.
      </div>

      <div style={{ display: "grid", gap: "0.85rem", maxHeight: "420px", overflowY: "auto", paddingRight: "0.2rem" }}>
        {categories.map((category) => {
          const items = professionList
            .filter((p) => p.category === category.id)
            .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
          if (items.length === 0) return null;

          return (
            <div key={category.id} style={{ display: "grid", gap: "0.45rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div style={{ color: "var(--holo-gold)", fontWeight: "bold", fontSize: "0.75rem", letterSpacing: "1px" }}>
                  {category.icon ? `${category.icon} ` : ""}{category.name.toUpperCase()}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>{category.description}</div>
              </div>

              <div style={{ display: "grid", gap: "0.5rem" }}>
                {items.map((profession) => {
                  const isSelected = selectedProfession?.id === profession.id;
                  const t1Skills = getProfessionT1Skills(profession);

                  return (
                    <button
                      key={profession.id}
                      type="button"
                      onClick={() => onAction?.(() => onProfessionSelect(profession.id))}
                      style={{
                        padding: "0.75rem",
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(0,0,0,0.7))"
                          : "rgba(0, 0, 0, 0.55)",
                        border: isSelected
                          ? "2px solid var(--holo-cyan)"
                          : "1px solid rgba(0, 243, 255, 0.2)",
                        color: "var(--text-main)",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        borderRadius: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: "bold", letterSpacing: "1px", color: "var(--holo-cyan)" }}>
                            {profession.icon ? `${profession.icon} ` : ""}{profession.name.toUpperCase()}
                          </span>
                          <StatChip label={profession.primaryStat} />
                          <StatChip label={profession.secondaryStat} />
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: "0.55rem", color: "var(--holo-gold)", fontWeight: "bold" }}>
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", lineHeight: "1.35" }}>
                        {profession.description}
                      </div>
                      <div style={{ display: "grid", gap: "0.2rem", marginTop: "0.15rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--holo-gold)", fontWeight: "bold" }}>
                          TIER 1 SKILLS
                        </div>
                        {t1Skills.length ? (
                          <div style={{ fontSize: "0.65rem", color: "var(--text-main)", lineHeight: "1.35" }}>
                            {t1Skills.map((s) => s.replace(/_/g, " ")).join(" · ")}
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
                            No tier-1 skills listed.
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

