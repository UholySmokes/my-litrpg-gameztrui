// RaceAbilities.jsx
// Displays race-specific special ability with cooldown and resource cost
import React from "react";
import { getRaceAbilitiesFor } from "../systems/race/RaceAbilityRegistry.js";

function getRaceAbilities(player, cooldowns = {}) {
  const raceId = player.race?.id || player.race;
  const abilities = getRaceAbilitiesFor(raceId);
  if (!abilities) return null;
  return { abilities, cooldowns };
}

function canAfford(player, ability) {
  const resources = player.resources || {};
  const rage = resources.rage ?? player.rage ?? 0;
  const chi = resources.chi ?? player.chi ?? 0;
  const focus = resources.focus ?? player.focus?.current ?? player.focus ?? 0;

  switch (ability.costType) {
    case "rage":
      return rage >= ability.cost;
    case "chi":
      return chi >= ability.cost;
    case "focus":
      return focus >= ability.cost;
    case "energy":
      return (resources.energy ?? player.energy ?? 0) >= ability.cost;
    case "mana":
      return (player.mana?.current || 0) >= ability.cost;
    case "shards":
      return (player.soulShards || 0) >= ability.cost;
    case "hp": {
      const maxHp = player.hp?.max || 0;
      const percent = Number.isFinite(ability.hpCostPercent)
        ? ability.hpCostPercent
        : 0;
      const flat = Number.isFinite(ability.cost) ? ability.cost : 0;
      const required = Math.max(0, Math.floor(maxHp * percent + flat));
      return player.hp.current - required > maxHp * 0.1;
    }
    case "none":
      return true;
    default:
      return true;
  }
}

function getCostColor(costType) {
  switch (costType) {
    case "rage":
      return "#ff4444";
    case "chi":
      return "#44ff88";
    case "focus":
      return "#4488ff";
    case "energy":
      return "#ffff44";
    case "mana":
      return "#4488ff";
    case "shards":
      return "#aa44ff";
    case "hp":
      return "#ff4444";
    default:
      return "var(--text-main)";
  }
}

export default function RaceAbilities({
  player,
  onUseAbility,
  cooldowns = {},
}) {
  if (!player) return null;

  const raceData = getRaceAbilities(player, cooldowns);
  if (!raceData) return null;

  const { abilities, cooldowns: activeCooldowns } = raceData;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          color: "var(--holo-cyan)",
          fontWeight: "bold",
          marginBottom: "0.5rem",
          fontSize: "0.9rem",
        }}
      >
        Race Ability:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {abilities.map((ability) => {
          const currentCooldown = activeCooldowns[ability.id] || 0;
          const affordable = canAfford(player, ability);
          const disabled = currentCooldown > 0 || !affordable;

          return (
            <button
              key={ability.id}
              className="holo-button"
              disabled={disabled ? true : false}
              onClick={() => onUseAbility(ability.id, 0)}
              title={ability.description}
              style={{
                fontSize: "0.8rem",
                flex: "1 1 auto",
                minWidth: "120px",
                maxWidth: "180px",
                opacity: disabled ? 0.5 : 1,
                position: "relative",
              }}
            >
              <div>{ability.name}</div>
              {ability.cost > 0 && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: getCostColor(ability.costType),
                    marginTop: "2px",
                  }}
                >
                  {ability.cost} {ability.costType}
                </div>
              )}
              {currentCooldown > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(0,0,0,0.8)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  {currentCooldown}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
