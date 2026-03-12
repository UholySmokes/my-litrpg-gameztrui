// statusRenderer.js
import { formatNumberCompact } from "../util/numberFormat.js";
import {
  ensureAttributeShape,
  getAttributeValue,
  calculateMaxHp,
  calculateMaxMana,
} from "../utils/AttributeMath.js";
import { getEffectiveAttributes, getTitleById } from "../core/titleLogic.js";
import { getTalentById } from "../systems/skills/TalentContentPack.js";

export function renderStatusBlock(player, config) {
  const name = player.name || "Unknown";
  const level = player.level || 1;
  const xpCurrent = player.xp?.current || 0;
  const xpMax = player.xp?.max || 100;
  const race =
    typeof player.race === "string"
      ? player.race
      : player.race?.name || player.race?.id || "Unknown";
  const playerClass =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || player.class?.id || "None";
  const talentIds = Array.isArray(player.talents) ? player.talents : [];
  const talentNames = talentIds
    .map((id) => getTalentById(id)?.name || id)
    .filter(Boolean);
  const talent = talentNames.length ? talentNames.join(", ") : player.talent || "None";
  const archetypeSystemName =
    typeof player.archetypeSystem === "string"
      ? player.archetypeSystem
      : player.archetypeSystem?.name || player.archetypeSystem?.id || "None";
  const archetypeSystemCategory =
    typeof player.archetypeSystem === "object"
      ? player.archetypeSystem?.category
      : null;
  const archetypeSystem =
    archetypeSystemName !== "None" && archetypeSystemCategory
      ? `${archetypeSystemName} (${archetypeSystemCategory})`
      : archetypeSystemName;
  const resolvedConfig =
    config && typeof config === "object" && !Array.isArray(config)
      ? config
      : {};
  const baseAttributeValue = Number.isFinite(resolvedConfig.baseAttributeValue)
    ? resolvedConfig.baseAttributeValue
    : 5;

  const equippedTitleId =
    typeof player.equippedTitle === "string" ? player.equippedTitle : null;
  const equippedTitle = equippedTitleId ? getTitleById(equippedTitleId) : null;
  const title = equippedTitle?.name || player.title || "None";

  const normalizedAttributes = ensureAttributeShape(
    player.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...player, attributes: normalizedAttributes },
    { ...resolvedConfig, baseAttributeValue },
    normalizedAttributes,
  );
  const canonicalHpMax = calculateMaxHp(effectiveAttributes);
  const canonicalManaMax = calculateMaxMana(effectiveAttributes);
  const hpMax = player.hp?.max ?? canonicalHpMax;
  const hpCurrent = player.hp?.current ?? canonicalHpMax;
  const manaMax = player.mana?.max ?? canonicalManaMax;
  const manaCurrent = player.mana?.current ?? canonicalManaMax;
  const magicManaMax = player.magic?.mana?.max;
  const magicManaFree = player.magic?.mana?.current;
  const freePoints = player.attributes?.freePoints || 0;

  const essencePrimes = [
    "fire",
    "water",
    "earth",
    "air",
    "lightning",
    "shadow",
    "light",
    "life",
  ];

  const reserves = player.magic?.reserves || {};
  const charges = Array.isArray(player.magic?.charges) ? player.magic.charges : [];
  const essenceTotals = essencePrimes
    .map((e) => {
      const reserve = Number.isFinite(reserves[e]) ? reserves[e] : 0;
      const charge = charges
        .filter((c) => c?.essence === e)
        .reduce((sum, c) => sum + (Number.isFinite(c?.amount) ? c.amount : 0), 0);
      return { essence: e, total: reserve + charge };
    })
    .filter((e) => e.total > 0.001);

  const essencesLine = essenceTotals.length
    ? essenceTotals
        .slice(0, 8)
        .map((e) => `${e.essence[0].toUpperCase()}${e.essence.slice(1)} ${e.total.toFixed(0)}`)
        .join(" | ")
    : null;

  const stability = player.magic?.stability;
  const stabilityLine = stability
    ? `Body ${stability.body?.current ?? 0}/${stability.body?.max ?? 100} | Mind ${stability.mind?.current ?? 0}/${stability.mind?.max ?? 100} | Cognitive ${stability.cognitive?.current ?? 0}/${stability.cognitive?.max ?? 100}`
    : null;

  const str =
    getAttributeValue(effectiveAttributes, "strength") || baseAttributeValue;
  const agi =
    getAttributeValue(effectiveAttributes, "agility") || baseAttributeValue;
  const dex =
    getAttributeValue(effectiveAttributes, "dexterity") || baseAttributeValue;
  const vit =
    getAttributeValue(effectiveAttributes, "vitality") || baseAttributeValue;
  const int =
    getAttributeValue(effectiveAttributes, "intelligence") ||
    baseAttributeValue;
  const cha =
    getAttributeValue(effectiveAttributes, "charisma") || baseAttributeValue;
  const will =
    getAttributeValue(effectiveAttributes, "willpower") || baseAttributeValue;
  const luck =
    getAttributeValue(effectiveAttributes, "luck") || baseAttributeValue;
  const soul =
    getAttributeValue(effectiveAttributes, "soul") || baseAttributeValue;

  // Format abilities - show active and passive skills with levels
  const abilities = player.abilities || [];
  const abilitiesList =
    abilities.length > 0
      ? abilities
          .map((ability) => `- ${ability.name} (Lvl ${ability.level || 1})`)
          .join("\n")
      : "- None";

  // Format inventory (show equipped items and key items)
  const inventory = player.inventory || [];
  const equipped = player.equipment || {};
  const inventoryList = [];

  if (equipped.weapon)
    inventoryList.push(
      `- ${equipped.weapon.name || equipped.weapon.id || equipped.weapon} [Equipped: Weapon]`,
    );
  if (equipped.armor)
    inventoryList.push(
      `- ${equipped.armor.name || equipped.armor.id || equipped.armor} [Equipped: Armor]`,
    );

  const otherItems = inventory
    .filter(
      (item) =>
        item.id !== equipped.weapon?.id && item.id !== equipped.armor?.id,
    )
    .slice(0, 5);

  otherItems.forEach((item) => {
    inventoryList.push(
      `- ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`,
    );
  });

  if (inventoryList.length === 0) inventoryList.push("- Empty");

  const inventoryText = inventoryList.join("\n");

  return `[SYSTEM INTERFACE]
[STATUS: ${name}]
--------------------------------------------------
Level:  ${level} (XP: ${formatNumberCompact(xpCurrent)}/${formatNumberCompact(xpMax)})   Title: ${title}
Race:   ${race}        (Current Evolution Stage)
Class:  ${playerClass}
System: ${archetypeSystem}
Talents: ${talent}
--------------------------------------------------
[VITALITY]
Health: ${hpCurrent}/${hpMax}      Mana: ${manaCurrent}/${manaMax}${
    Number.isFinite(magicManaFree) && Number.isFinite(magicManaMax)
      ? `      Mana Pool: ${magicManaFree}/${magicManaMax}`
      : ""
  }
${essencesLine ? `\nEssences: ${essencesLine}` : ""}${
    stabilityLine ? `\nStability: ${stabilityLine}` : ""
  }

[ATTRIBUTES] (Free Points: ${freePoints})
> Strength:      ${str}  (Physical power)
> Agility:       ${agi}  (Speed/Dodge)
> Dexterity:     ${dex}  (Precision/Crafting)
> Vitality:      ${vit}  (Endurance/HP)
> Intelligence:  ${int}  (Magic/Learning)
> Charisma:      ${cha}  (Influence)
> Will:          ${will}  (Mental Defense/Pressure)
> Luck:          ${luck}  (Drop Rate/Crit)
> Soul Strength: ${soul}  (Psychic/Focus)

[ABILITIES]
${abilitiesList}

[INVENTORY]
${inventoryText}`;
}
