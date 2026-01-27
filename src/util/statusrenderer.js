// statusRenderer.js
import { formatNumberCompact } from "../util/numberFormat.js";
import {
  ensureAttributeShape,
  getAttributeValue,
  calculateMaxHp,
  calculateMaxMana,
} from "../utils/AttributeMath.js";
import { getEffectiveAttributes, getTitleById } from "../core/titleLogic.js";
import { getTalentById } from "../entities/Player.js";

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
  const freePoints = player.attributes?.freePoints || 0;

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
Talents: ${talent}
--------------------------------------------------
[VITALITY]
Health: ${hpCurrent}/${hpMax}      Mana: ${manaCurrent}/${manaMax}

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
