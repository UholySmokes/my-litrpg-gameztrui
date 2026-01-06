// statusRenderer.js
import { formatNumberCompact } from '../util/numberFormat.js';
export function renderstatusblock(player) {
  const name = player.name || "Unknown";
  const level = player.level || 1;
  const xpCurrent = player.xp?.current || 0;
  const xpMax = player.xp?.max || 100;
  const title = player.title || "None";
  const race = player.race || "Unknown";
  const evolutionStage = player.evolutionStage || "Mortal";
  const playerClass = player.class || "None";
  const talent = player.talent || "None";
  const hpCurrent = player.hp?.current || 0;
  const hpMax = player.hp?.max || 100;
  const manaCurrent = player.mana?.current || 0;
  const manaMax = player.mana?.max || 50;
  const freePoints = player.attributes?.freePoints || 0;
  
  const attrs = player.attributes || {};
  const str = attrs.str || 5;
  const agi = attrs.agi || 5;
  const dex = attrs.dex || 5;
  const int = attrs.int || 5;
  const cha = attrs.cha || 5;
  const will = attrs.will || 5;
  const luck = attrs.luck || 5;
  const soul = attrs.soul || 5;
  
  // Format abilities - show active and passive skills with levels
  const abilities = player.abilities || [];
  const abilitiesList = abilities.length > 0
    ? abilities.map(ability => `- ${ability.name} (Lvl ${ability.level || 1})`).join('\n')
    : '- None';
  
  // Format inventory (show equipped items and key items)
  const inventory = player.inventory || [];
  const equipped = player.equipment || {};
  const inventoryList = [];
  
  if (equipped.weapon) inventoryList.push(`- ${equipped.weapon.name} [Equipped: Weapon]`);
  if (equipped.armor) inventoryList.push(`- ${equipped.armor.name} [Equipped: Armor]`);
  
  const otherItems = inventory.filter(item => 
    item.id !== equipped.weapon?.id && item.id !== equipped.armor?.id
  ).slice(0, 5);
  
  otherItems.forEach(item => {
    inventoryList.push(`- ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`);
  });
  
  if (inventoryList.length === 0) inventoryList.push('- Empty');
  
  const inventoryText = inventoryList.join('\n');
  
  return `[SYSTEM INTERFACE]
[STATUS: ${name}]
--------------------------------------------------
Level:  ${level} (XP: ${formatNumberCompact(xpCurrent)}/${formatNumberCompact(xpMax)})   Title: ${title}
Race:   ${race}        (Current Evolution Stage)
Class:  ${playerClass}
Talent: ${talent}
--------------------------------------------------
[VITALITY]
Health: ${hpCurrent}/${hpMax}      Mana: ${manaCurrent}/${manaMax}

[ATTRIBUTES] (Free Points: ${freePoints})
> Strength:      ${str}  (Physical power)
> Agility:       ${agi}  (Speed/Dodge)
> Dexterity:     ${dex}  (Precision/Crafting)
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
