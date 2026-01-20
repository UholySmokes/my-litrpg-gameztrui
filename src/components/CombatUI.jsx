// CombatUI.jsx
import React from "react";
import ClassResourceBar from "./ClassResourceBar";
import ClassAbilities from "./ClassAbilities";
import StatusEffects from "./StatusEffects";
import MinionPanel from "./MinionPanel";

export default function CombatUI({
  combatState,
  playerState,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onEscape,
}) {
  const combat = combatState;
  const player = playerState;

  if (!combat || combat.status !== "active") {
    return null;
  }

  const skillCooldowns = combat.skillCooldowns || {};
  const livingEnemies = (combat.enemies || [])
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy?.stats?.hp?.current > 0);
  const availableSkills =
    player?.activeSkills?.length
      ? player.activeSkills
      : player?.skills?.active ||
        (player?.abilities || []).filter((ability) => ability.type === "active");
  const toPercent = (current, max) => {
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  return (
    <div
      className="holo-panel"
      style={{ marginBottom: "1rem", padding: "1rem" }}
    >
      <div
        style={{
          color: "var(--holo-alert)",
          fontWeight: "bold",
          marginBottom: "0.5rem",
          fontSize: "1.1rem",
        }}
      >
        [COMBAT]
      </div>

      {/* Class Resource Bar */}
      {player && <ClassResourceBar player={player} />}

      {/* Status Effects */}
      {player && <StatusEffects player={player} />}

      {/* Minions/Pets/Totems */}
      {player && <MinionPanel player={player} />}

      {/* Enemies */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            color: "var(--holo-cyan)",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          Enemies:
        </div>
        {livingEnemies.map(({ enemy, index }) => {
          const hpPercentage = toPercent(
            enemy?.stats?.hp?.current ?? 0,
            enemy?.stats?.hp?.max ?? 0,
          );

          return (
            <div
              key={enemy.id || index}
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem",
                border: "1px solid var(--holo-cyan)",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <span style={{ color: "var(--text-main)", fontWeight: "bold" }}>
                  {enemy.name} (Lvl {enemy.level})
                </span>
                <span style={{ color: "var(--text-main)" }}>
                  HP: {enemy.stats.hp.current}/{enemy.stats.hp.max}
                </span>
              </div>
              <div
                className="health-bar-container"
                style={{ marginBottom: "0.5rem" }}
              >
                <div className="health-bar">
                  <div
                    className="health-bar-fill"
                    style={{
                      width: `${hpPercentage}%`,
                      background:
                        hpPercentage < 30
                          ? "linear-gradient(90deg, var(--holo-alert), #ff6b9d)"
                          : "linear-gradient(90deg, var(--holo-alert), var(--holo-cyan))",
                    }}
                  ></div>
                </div>
              </div>
              <button
                className="holo-button"
                onClick={() => onAttack(index)}
                style={{ width: "100%", fontSize: "0.85rem" }}
              >
                Attack {enemy.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Combat log removed - now displayed in narrator */}

      {/* Skills */}
      {availableSkills.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              color: "var(--holo-cyan)",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            Skills:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {availableSkills.slice(0, 4).map((skill) => {
              const remainingCooldown = skillCooldowns?.[skill.id] || 0;
              const disabled = remainingCooldown > 0;

              return (
                <button
                  key={skill.id}
                  className="holo-button"
                  onClick={() =>
                    onUseSkill(skill.id, livingEnemies[0]?.index ?? 0)
                  }
                  disabled={disabled}
                  style={{
                    fontSize: "0.85rem",
                    flex: "1 1 auto",
                    minWidth: "120px",
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                  title={
                    disabled
                      ? `${skill.name} is on cooldown (${remainingCooldown} turn(s) remaining)`
                      : skill.description || skill.name
                  }
                >
                  {skill.name} (Cost: {skill.manaCost ?? skill.cost?.mana ?? 0} MP
                  {disabled ? ` | CD: ${remainingCooldown}` : ""})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Abilities */}
      {player && onUseClassAbility && (
        <ClassAbilities player={player} onUseAbility={onUseClassAbility} />
      )}

      {/* Escape Button */}
      <button
        className="holo-button"
        onClick={onEscape}
        style={{
          width: "100%",
          borderColor: "var(--holo-alert)",
          color: "var(--holo-alert)",
          fontSize: "0.9rem",
        }}
      >
        Attempt Escape
      </button>
    </div>
  );
}
