// StatusEffects.jsx
// Displays active buffs, debuffs, and status effects
import React from "react";

/**
 * Get effect icon and color based on type
 */
function getEffectStyle(effect) {
  const type = effect.type?.toUpperCase() || "BUFF";

  switch (type) {
    case "BUFF":
      return { icon: "⬆️", color: "#44ff44", borderColor: "#44ff44" };
    case "DEBUFF":
      return { icon: "⬇️", color: "#ff4444", borderColor: "#ff4444" };
    case "DOT":
      return { icon: "🔥", color: "#ff8800", borderColor: "#ff8800" };
    case "HOT":
      return { icon: "💚", color: "#44ff88", borderColor: "#44ff88" };
    case "SHIELD":
      return { icon: "🛡️", color: "#4488ff", borderColor: "#4488ff" };
    case "STUN":
      return { icon: "💫", color: "#ffff44", borderColor: "#ffff44" };
    case "SLOW":
      return { icon: "🐌", color: "#8888ff", borderColor: "#8888ff" };
    case "CHARM":
      return { icon: "💕", color: "#ff88ff", borderColor: "#ff88ff" };
    case "CURSE":
      return { icon: "💀", color: "#aa44aa", borderColor: "#aa44aa" };
    default:
      return {
        icon: "✨",
        color: "var(--holo-cyan)",
        borderColor: "var(--holo-cyan)",
      };
  }
}

/**
 * Get class-specific buffs
 */
function getClassBuffs(player) {
  const buffs = [];

  // Berserker
  if (player.isEnraged) {
    buffs.push({
      id: "enraged",
      name: "Enraged",
      type: "BUFF",
      icon: "🔥",
      duration: null,
    });
  }

  // Stealth
  if (player.isStealthed) {
    buffs.push({
      id: "stealth",
      name: "Stealthed",
      type: "BUFF",
      icon: "👤",
      duration: null,
    });
  }

  // Bard songs
  if (player.activeSong) {
    buffs.push({
      id: "song",
      name: player.activeSong.name,
      type: "BUFF",
      icon: "🎵",
      duration: player.activeSong.duration,
    });
  }

  // Inspiration
  if (player.inspiration?.active) {
    buffs.push({
      id: "inspiration",
      name: "Inspired",
      type: "BUFF",
      icon: "✨",
      duration: player.inspiration.duration,
    });
  }

  // Mana Shield
  if (player.manaShield?.active) {
    buffs.push({
      id: "mana_shield",
      name: "Mana Shield",
      type: "SHIELD",
      icon: "🛡️",
      duration: player.manaShield.duration,
    });
  }

  // Divine Shield
  if (player.divineShield?.active) {
    buffs.push({
      id: "divine_shield",
      name: "Divine Shield",
      type: "SHIELD",
      icon: "✝️",
      duration: player.divineShield.duration,
    });
  }

  // Paladin Divine Shield
  if (player.paladinDivineShield?.active) {
    buffs.push({
      id: "paladin_divine",
      name: "Divine Immunity",
      type: "SHIELD",
      icon: "✝️",
      duration: player.paladinDivineShield.duration,
    });
  }

  // Holy Shield
  if (player.holyShield?.active) {
    buffs.push({
      id: "holy_shield",
      name: "Holy Shield",
      type: "SHIELD",
      icon: "🛡️",
      duration: player.holyShield.duration,
      extra: `${player.holyShield.remaining} absorb`,
    });
  }

  // Bone Shield
  if (player.boneShield?.active) {
    buffs.push({
      id: "bone_shield",
      name: "Bone Shield",
      type: "SHIELD",
      icon: "💀",
      duration: null,
      extra: `${player.boneShield.charges} charges`,
    });
  }

  // Anti-Magic Field
  if (player.antiMagicField?.active) {
    buffs.push({
      id: "anti_magic",
      name: "Anti-Magic",
      type: "BUFF",
      icon: "🚫",
      duration: player.antiMagicField.duration,
    });
  }

  // Spell Reflect
  if (player.spellReflect?.active) {
    buffs.push({
      id: "spell_reflect",
      name: "Spell Reflect",
      type: "BUFF",
      icon: "🔄",
      duration: player.spellReflect.duration,
    });
  }

  // Bulwark
  if (player.bulwark?.active) {
    buffs.push({
      id: "bulwark",
      name: "Bulwark",
      type: "BUFF",
      icon: "🛡️",
      duration: player.bulwark.duration,
    });
  }

  // Last Stand
  if (player.lastStand?.active) {
    buffs.push({
      id: "last_stand",
      name: "Last Stand",
      type: "BUFF",
      icon: "⚔️",
      duration: player.lastStand.duration,
    });
  }

  // Battle Trance
  if (player.battleTrance?.active) {
    buffs.push({
      id: "battle_trance",
      name: "Battle Trance",
      type: "BUFF",
      icon: "⚡",
      duration: player.battleTrance.duration,
    });
  }

  // Weapon Enchantment
  if (player.weaponEnchantment) {
    buffs.push({
      id: "weapon_enchant",
      name: player.weaponEnchantment.name,
      type: "BUFF",
      icon: "⚔️",
      duration: player.weaponEnchantment.duration,
    });
  }

  // Poison Blade
  if (player.poisonBlade?.active) {
    buffs.push({
      id: "poison_blade",
      name: "Poison Blade",
      type: "BUFF",
      icon: "☠️",
      duration: player.poisonBlade.duration,
    });
  }

  // Thorns
  if (player.thorns?.active) {
    buffs.push({
      id: "thorns",
      name: "Thorns",
      type: "BUFF",
      icon: "🌿",
      duration: player.thorns.duration,
    });
  }

  // Evade
  if (player.evadeNext) {
    buffs.push({
      id: "evade",
      name: "Evading",
      type: "BUFF",
      icon: "💨",
      duration: 1,
    });
  }

  // Shield Block
  if (player.shieldBlockActive) {
    buffs.push({
      id: "shield_block",
      name: "Blocking",
      type: "BUFF",
      icon: "🛡️",
      duration: 1,
    });
  }

  // Spirit Link
  if (player.spiritLink?.active) {
    buffs.push({
      id: "spirit_link",
      name: "Spirit Link",
      type: "BUFF",
      icon: "🔗",
      duration: player.spiritLink.duration,
    });
  }

  // Elemental Overload
  if (player.elementalOverload?.active) {
    buffs.push({
      id: "overload",
      name: "Overload",
      type: "BUFF",
      icon: "⚡",
      duration: player.elementalOverload.duration,
    });
  }

  return buffs;
}

/**
 * Single effect badge
 */
function EffectBadge({ effect }) {
  const style = getEffectStyle(effect);

  return (
    <div
      title={`${effect.name}${effect.extra ? ` (${effect.extra})` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${style.borderColor}`,
        borderRadius: "12px",
        fontSize: "0.75rem",
        color: style.color,
      }}
    >
      <span>{effect.icon || style.icon}</span>
      <span>{effect.name}</span>
      {effect.duration && (
        <span
          style={{
            background: "rgba(0,0,0,0.5)",
            padding: "0 4px",
            borderRadius: "8px",
            fontSize: "0.7rem",
          }}
        >
          {effect.duration}
        </span>
      )}
    </div>
  );
}

/**
 * Main StatusEffects component
 */
export default function StatusEffects({ player }) {
  if (!player) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          fontSize: "0.7rem",
          color: "var(--holo-cyan)",
        }}
      >
        <div>No active effects</div>
      </div>
    );
  }

  const effects = player.effects || [];
  const classBuffs = getClassBuffs(player);
  const allEffects = [...classBuffs, ...effects];

  if (allEffects.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "0.75rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
      }}
    >
      {allEffects.map((effect, index) => (
        <EffectBadge key={effect.id || index} effect={effect} />
      ))}
    </div>
  );
}
