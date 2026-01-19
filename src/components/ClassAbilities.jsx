// ClassAbilities.jsx
// Displays class-specific abilities with cooldowns and resource costs
import React from "react";

/**
 * Get abilities based on player class
 */
function getClassAbilities(player) {
  const classId = player.class?.id || player.class;

  switch (classId) {
    case "berserker":
      return {
        abilities: [
          {
            id: "enrage",
            name: "Enrage",
            cost: 50,
            costType: "rage",
            description: "Enter rage mode",
          },
          {
            id: "reckless_blow",
            name: "Reckless Blow",
            cost: 30,
            costType: "rage",
            description: "2x damage, take 20% recoil",
          },
        ],
        cooldowns: player.rageCooldowns || {},
      };

    case "monk":
    case "grandmaster":
      return {
        abilities: [
          {
            id: "flurry",
            name: "Flurry",
            cost: 30,
            costType: "chi",
            description: "3 rapid strikes",
          },
          {
            id: "palm_strike",
            name: "Palm Strike",
            cost: 20,
            costType: "chi",
            description: "Stun enemy",
          },
          {
            id: "meditation",
            name: "Meditate",
            cost: 0,
            costType: "chi",
            description: "Restore chi",
            cooldown: 5,
          },
        ],
        cooldowns: player.chiCooldowns || {},
      };

    case "archer":
    case "ranger":
      return {
        abilities: [
          {
            id: "aimed_shot",
            name: "Aimed Shot",
            cost: 40,
            costType: "focus",
            description: "2.5x damage, +30% crit",
          },
          {
            id: "multi_shot",
            name: "Multi-Shot",
            cost: 30,
            costType: "focus",
            description: "Hit 3 enemies",
          },
          {
            id: "rapid_fire",
            name: "Rapid Fire",
            cost: 50,
            costType: "focus",
            description: "4 quick shots",
            cooldown: 5,
          },
        ],
        cooldowns: player.archerCooldowns || {},
      };

    case "rogue":
    case "assassin":
      return {
        abilities: [
          {
            id: "quick_strike",
            name: "Quick Strike",
            cost: 15,
            costType: "energy",
            description: "Fast attack",
          },
          {
            id: "poison_blade",
            name: "Poison Blade",
            cost: 25,
            costType: "energy",
            description: "Apply poison",
            cooldown: 8,
          },
          {
            id: "evade",
            name: "Evade",
            cost: 30,
            costType: "energy",
            description: "Dodge next attack",
            cooldown: 4,
          },
          {
            id: "vanish",
            name: "Vanish",
            cost: 40,
            costType: "energy",
            description: "Enter stealth",
            cooldown: 10,
          },
        ],
        cooldowns: player.rogueCooldowns || {},
      };

    case "bard":
    case "maestro":
      return {
        abilities: [
          {
            id: "song_valor",
            name: "Song of Valor",
            cost: 25,
            costType: "mana",
            description: "+15% damage",
          },
          {
            id: "song_protection",
            name: "Song of Protection",
            cost: 25,
            costType: "mana",
            description: "+15% defense",
          },
          {
            id: "vicious_mockery",
            name: "Vicious Mockery",
            cost: 20,
            costType: "mana",
            description: "Psychic damage + debuff",
          },
          {
            id: "inspire",
            name: "Inspire",
            cost: 30,
            costType: "mana",
            description: "+15% all stats",
            cooldown: 10,
          },
        ],
        cooldowns: player.bardCooldowns || {},
      };

    case "shaman":
    case "spirit_walker":
      return {
        abilities: [
          {
            id: "totem_healing",
            name: "Healing Totem",
            cost: 30,
            costType: "mana",
            description: "Heal each turn",
          },
          {
            id: "totem_searing",
            name: "Searing Totem",
            cost: 25,
            costType: "mana",
            description: "Fire damage",
          },
          {
            id: "spirit_link",
            name: "Spirit Link",
            cost: 40,
            costType: "mana",
            description: "Share damage",
            cooldown: 15,
          },
          {
            id: "elemental_overload",
            name: "Overload",
            cost: 50,
            costType: "mana",
            description: "Double cast chance",
            cooldown: 20,
          },
        ],
        cooldowns: player.shamanCooldowns || {},
      };

    case "templar":
    case "inquisitor":
      return {
        abilities: [
          {
            id: "anti_magic_field",
            name: "Anti-Magic",
            cost: 40,
            costType: "mana",
            description: "-50% magic damage",
            cooldown: 12,
          },
          {
            id: "spell_reflect",
            name: "Spell Reflect",
            cost: 35,
            costType: "mana",
            description: "Reflect spells",
            cooldown: 10,
          },
          {
            id: "purge",
            name: "Purge",
            cost: 25,
            costType: "mana",
            description: "Remove enemy buffs",
          },
          {
            id: "holy_shield",
            name: "Holy Shield",
            cost: 30,
            costType: "mana",
            description: "Absorb damage",
            cooldown: 8,
          },
        ],
        cooldowns: player.templarCooldowns || {},
      };

    case "warlock":
    case "demon_lord":
      return {
        abilities: [
          {
            id: "summon_imp",
            name: "Summon Imp",
            cost: 1,
            costType: "shards",
            description: "Ranged demon",
          },
          {
            id: "summon_voidwalker",
            name: "Summon Voidwalker",
            cost: 2,
            costType: "shards",
            description: "Tank demon",
          },
          {
            id: "life_drain",
            name: "Life Drain",
            cost: 30,
            costType: "mana",
            description: "Damage + heal",
          },
          {
            id: "dark_pact",
            name: "Dark Pact",
            cost: 0,
            costType: "hp",
            description: "HP to mana",
          },
        ],
        cooldowns: player.warlockCooldowns || {},
      };

    case "mage":
    case "archmage":
      return {
        abilities: [
          {
            id: "fireball",
            name: "Fireball",
            cost: 25,
            costType: "mana",
            description: "Fire damage + burn",
          },
          {
            id: "ice_lance",
            name: "Ice Lance",
            cost: 20,
            costType: "mana",
            description: "Ice damage + slow",
          },
          {
            id: "lightning_bolt",
            name: "Lightning Bolt",
            cost: 30,
            costType: "mana",
            description: "Chain lightning",
          },
          {
            id: "mana_shield",
            name: "Mana Shield",
            cost: 20,
            costType: "mana",
            description: "Absorb with mana",
            cooldown: 10,
          },
        ],
        cooldowns: player.mageCooldowns || {},
      };

    case "priest":
    case "high_priest":
      return {
        abilities: [
          {
            id: "heal",
            name: "Heal",
            cost: 20,
            costType: "mana",
            description: "Restore HP",
          },
          {
            id: "greater_heal",
            name: "Greater Heal",
            cost: 40,
            costType: "mana",
            description: "Large heal",
            cooldown: 3,
          },
          {
            id: "holy_smite",
            name: "Holy Smite",
            cost: 25,
            costType: "mana",
            description: "2x vs undead",
          },
          {
            id: "divine_shield",
            name: "Divine Shield",
            cost: 50,
            costType: "mana",
            description: "Absorb damage",
            cooldown: 15,
          },
        ],
        cooldowns: player.priestCooldowns || {},
      };

    case "paladin":
    case "divine_knight":
      return {
        abilities: [
          {
            id: "holy_strike",
            name: "Holy Strike",
            cost: 20,
            costType: "mana",
            description: "1.5x holy damage",
          },
          {
            id: "lay_on_hands",
            name: "Lay on Hands",
            cost: 0,
            costType: "mana",
            description: "50% HP heal",
            cooldown: 30,
          },
          {
            id: "divine_shield",
            name: "Divine Shield",
            cost: 50,
            costType: "mana",
            description: "Immunity",
            cooldown: 60,
          },
          {
            id: "hammer_of_justice",
            name: "Hammer",
            cost: 25,
            costType: "mana",
            description: "Stun enemy",
            cooldown: 15,
          },
        ],
        cooldowns: player.paladinCooldowns || {},
      };

    case "warrior":
      return {
        abilities: [
          {
            id: "stance_offensive",
            name: "Offensive Stance",
            cost: 0,
            costType: "none",
            description: "+20% damage",
          },
          {
            id: "stance_defensive",
            name: "Defensive Stance",
            cost: 0,
            costType: "none",
            description: "+30% defense",
          },
          {
            id: "shield_block",
            name: "Shield Block",
            cost: 15,
            costType: "mana",
            description: "Block attack",
            cooldown: 3,
          },
        ],
        cooldowns: player.warriorCooldowns || {},
      };

    case "knight":
      return {
        abilities: [
          {
            id: "shield_block",
            name: "Shield Block",
            cost: 15,
            costType: "mana",
            description: "-50% damage",
            cooldown: 3,
          },
          {
            id: "taunt",
            name: "Taunt",
            cost: 20,
            costType: "mana",
            description: "Force target",
            cooldown: 8,
          },
          {
            id: "shield_bash",
            name: "Shield Bash",
            cost: 25,
            costType: "mana",
            description: "Stun chance",
          },
          {
            id: "bulwark",
            name: "Bulwark",
            cost: 30,
            costType: "mana",
            description: "+50% defense",
            cooldown: 12,
          },
        ],
        cooldowns: player.knightCooldowns || {},
      };

    case "battlemage":
    case "spellblade":
      return {
        abilities: [
          {
            id: "flame_blade",
            name: "Flame Blade",
            cost: 25,
            costType: "mana",
            description: "Fire enchant",
          },
          {
            id: "frost_blade",
            name: "Frost Blade",
            cost: 25,
            costType: "mana",
            description: "Ice enchant",
          },
          {
            id: "arcane_strike",
            name: "Arcane Strike",
            cost: 15,
            costType: "mana",
            description: "Charge-boosted",
          },
          {
            id: "arcane_burst",
            name: "Arcane Burst",
            cost: 30,
            costType: "mana",
            description: "AoE burst",
            cooldown: 8,
          },
        ],
        cooldowns: player.battlemageCooldowns || {},
      };

    case "necromancer":
    case "lich":
      return {
        abilities: [
          {
            id: "raise_dead",
            name: "Raise Dead",
            cost: 40,
            costType: "mana",
            description: "Raise undead",
          },
          {
            id: "death_coil",
            name: "Death Coil",
            cost: 25,
            costType: "mana",
            description: "Damage or heal",
          },
          {
            id: "bone_shield",
            name: "Bone Shield",
            cost: 35,
            costType: "mana",
            description: "Absorb charges",
            cooldown: 10,
          },
          {
            id: "corpse_explosion",
            name: "Corpse Explosion",
            cost: 30,
            costType: "mana",
            description: "AoE damage",
          },
        ],
        cooldowns: player.necromancerCooldowns || {},
      };

    case "druid":
    case "archdruid":
      return {
        abilities: [
          {
            id: "wild_growth",
            name: "Wild Growth",
            cost: 35,
            costType: "mana",
            description: "HoT effect",
          },
          {
            id: "moonfire",
            name: "Moonfire",
            cost: 20,
            costType: "mana",
            description: "Arcane DoT",
          },
          {
            id: "entangling_roots",
            name: "Roots",
            cost: 25,
            costType: "mana",
            description: "Immobilize",
            cooldown: 5,
          },
          {
            id: "thorns",
            name: "Thorns",
            cost: 30,
            costType: "mana",
            description: "Reflect damage",
          },
        ],
        cooldowns: player.druidCooldowns || {},
      };

    default:
      return null;
  }
}

/**
 * Check if player can afford ability
 */
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
      return (player.energy || 0) >= ability.cost;
    case "mana":
      return (player.mana?.current || 0) >= ability.cost;
    case "shards":
      return (player.soulShards || 0) >= ability.cost;
    case "hp":
      return player.hp.current > player.hp.max * 0.2;
    case "none":
      return true;
    default:
      return true;
  }
}

/**
 * Get cost type color
 */
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

/**
 * Main ClassAbilities component
 */
export default function ClassAbilities({ player, onUseAbility }) {
  if (!player) return null;

  const classData = getClassAbilities(player);
  if (!classData) return null;

  const { abilities, cooldowns } = classData;

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
        Class Abilities:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {abilities.map((ability) => {
          const currentCooldown = cooldowns[ability.id] || 0;
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
                minWidth: "100px",
                maxWidth: "150px",
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
