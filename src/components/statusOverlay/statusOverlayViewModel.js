import { ATTRIBUTE_METADATA, toCanonicalAttributeKey } from "../../constants/attributes.js";
import {
  ensureAttributeShape,
  getAttributeValue,
  calculateMaxHp,
  calculateMaxMana,
} from "../../utils/AttributeMath.js";
import { getEffectiveAttributes, getTitleById } from "../../core/titleLogic.js";
import { DataRegistry } from "../../data/DataRegistry.js";
import { canEvolveSkill } from "../../systems/skills/SkillEvolutionSystem.js";
import { canFuseSkills } from "../../systems/skills/SkillFusionSystem.js";
import { isSpellSkill } from "../../systems/skills/SpellStudySystem.js";
import { getTalentById } from "../../systems/skills/TalentContentPack.js";
import {
  getProgressionModifiers,
  resolveClassEvolutionRequirement,
} from "../../utils/shared.js";

const getNumeric = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const getTotalKills = (player) =>
  Math.max(0, Math.floor(getNumeric(player?.progress?.totalKills, 0)));

const getAttributeValueByAlias = (player, alias) => {
  const canonical = toCanonicalAttributeKey(alias);
  if (!canonical) return 0;
  return getNumeric(player?.attributes?.[canonical], 0);
};

function meetsEvolutionRequirements(player, requirements = {}, extraMinLevel = 0) {
  const minLevel = Math.max(getNumeric(requirements.minLevel, 0), extraMinLevel);
  if ((player?.level || 1) < minLevel) return false;

  const minTotalKills = getNumeric(requirements.minTotalKills, 0);
  if (getTotalKills(player) < minTotalKills) return false;

  const minAttributes =
    requirements.minAttributes &&
    typeof requirements.minAttributes === "object" &&
    !Array.isArray(requirements.minAttributes)
      ? requirements.minAttributes
      : {};

  for (const [attribute, minValue] of Object.entries(minAttributes)) {
    if (getAttributeValueByAlias(player, attribute) < getNumeric(minValue, 0)) {
      return false;
    }
  }

  return true;
}

function formatRequirements(requirements = {}, extraMinLevel = 0) {
  const mergedLevel = Math.max(getNumeric(requirements.minLevel, 0), extraMinLevel);
  const parts = [];
  if (mergedLevel > 0) {
    parts.push(`Level ${mergedLevel}`);
  }
  const minTotalKills = getNumeric(requirements.minTotalKills, 0);
  if (minTotalKills > 0) {
    parts.push(`${minTotalKills} total kills`);
  }

  const minAttributes =
    requirements.minAttributes &&
    typeof requirements.minAttributes === "object" &&
    !Array.isArray(requirements.minAttributes)
      ? requirements.minAttributes
      : {};
  Object.entries(minAttributes).forEach(([attribute, minValue]) => {
    const canonical = toCanonicalAttributeKey(attribute) || attribute;
    const label = canonical.charAt(0).toUpperCase() + canonical.slice(1);
    parts.push(`${label} ${getNumeric(minValue, 0)}`);
  });

  return parts.length ? parts.join(" | ") : "No additional requirements";
}

export function buildStatusOverlayViewModel({
  player,
  world,
  config,
  interactionState = {},
} = {}) {
  const resolvedConfig =
    config && typeof config === "object" && !Array.isArray(config)
      ? config
      : {};
  const baseAttributeValue = Number.isFinite(resolvedConfig.baseAttributeValue)
    ? resolvedConfig.baseAttributeValue
    : 5;

  const normalizedAttributes = ensureAttributeShape(
    player?.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...player, attributes: normalizedAttributes },
    { ...resolvedConfig, baseAttributeValue },
    normalizedAttributes,
  );
  const attributeEntries = ATTRIBUTE_METADATA.map((attribute) => ({
    ...attribute,
    value: getAttributeValue(effectiveAttributes, attribute.key) || 0,
    baseValue: getAttributeValue(normalizedAttributes, attribute.key) || 0,
  }));

  const abilityList = Array.isArray(player?.abilities) ? player.abilities : [];
  const inventoryList = Array.isArray(player?.inventory) ? player.inventory : [];
  const freeAttributePoints = player?.attributes?.freePoints ?? 0;
  const attributeInvestments =
    player?.attributeInvestments &&
    typeof player.attributeInvestments === "object" &&
    !Array.isArray(player.attributeInvestments)
      ? player.attributeInvestments
      : {};
  const evolvableSkills = abilityList.filter((skill) => canEvolveSkill(skill));
  const fusionCandidates = abilityList.filter((skill) => skill?.id);
  const spellCandidates = abilityList.filter((skill) => isSpellSkill(skill));
  const fusionSkillA = typeof interactionState.fusionSkillA === "string" ? interactionState.fusionSkillA : "";
  const fusionSkillB = typeof interactionState.fusionSkillB === "string" ? interactionState.fusionSkillB : "";
  const studySkillId = typeof interactionState.studySkillId === "string" ? interactionState.studySkillId : "";
  const selectedSpell = spellCandidates.find((skill) => skill.id === studySkillId) || null;
  const selectedSkillA = fusionCandidates.find((skill) => skill.id === fusionSkillA) || null;
  const selectedSkillB = fusionCandidates.find((skill) => skill.id === fusionSkillB) || null;
  const canFuseSelection = canFuseSkills(selectedSkillA, selectedSkillB);
  const professionEntries = Object.entries(player?.professions || {});

  const worldState =
    world && typeof world === "object" && !Array.isArray(world) ? world : {};
  const magicState =
    player?.magic && typeof player.magic === "object" && !Array.isArray(player.magic)
      ? player.magic
      : {};
  const ambient = worldState.essence?.ambient;
  const isAmbientSnapshot = Boolean(
    ambient &&
      typeof ambient === "object" &&
      !Array.isArray(ambient) &&
      ambient.global &&
      typeof ambient.global === "object" &&
      ambient.compositionByEssence &&
      typeof ambient.compositionByEssence === "object",
  );
  const ambientProvenance = isAmbientSnapshot ? ambient.provenance || {} : {};
  const anomalyNames = Array.isArray(ambientProvenance.anomalyIds)
    ? ambientProvenance.anomalyIds.filter(Boolean)
    : [];
  const sourceNames = Array.isArray(ambientProvenance.sourceIds)
    ? ambientProvenance.sourceIds.filter(Boolean)
    : [];

  const resonance = magicState.resonance || {};
  const resonanceCurrent = Number.isFinite(resonance.current) ? resonance.current : 0;
  const resonanceMax = Number.isFinite(resonance.max) && resonance.max > 0 ? resonance.max : 100;
  const resonanceState =
    typeof resonance.state === "string" && resonance.state.trim()
      ? resonance.state
      : "quiet";

  const reserves =
    magicState.reserves && typeof magicState.reserves === "object" && !Array.isArray(magicState.reserves)
      ? magicState.reserves
      : {};
  const reservesTaint =
    magicState.reservesTaint &&
    typeof magicState.reservesTaint === "object" &&
    !Array.isArray(magicState.reservesTaint)
      ? magicState.reservesTaint
      : {};
  const reserveRows = Object.entries(reserves)
    .map(([essence, amount]) => ({
      essence,
      amount: Number.isFinite(amount) ? Number(amount) : 0,
      taint: Number.isFinite(reservesTaint?.[essence]) ? Number(reservesTaint[essence]) : 0,
    }))
    .filter((entry) => entry.amount > 0.001)
    .sort((left, right) => right.amount - left.amount);
  const reserveTotal = reserveRows.reduce((sum, row) => sum + row.amount, 0);

  const charges = Array.isArray(magicState.charges) ? magicState.charges : [];
  const prepared =
    magicState.prepared && typeof magicState.prepared === "object" && !Array.isArray(magicState.prepared)
      ? magicState.prepared
      : null;
  const anchors =
    magicState.anchors && typeof magicState.anchors === "object" && !Array.isArray(magicState.anchors)
      ? magicState.anchors
      : {};

  const unlockedPatterns =
    magicState.unlockedPatterns &&
    typeof magicState.unlockedPatterns === "object" &&
    !Array.isArray(magicState.unlockedPatterns)
      ? magicState.unlockedPatterns
      : {};
  const unlockedPatternRows = Object.entries(unlockedPatterns)
    .map(([kind, patterns]) => ({
      kind,
      patterns: Array.isArray(patterns) ? patterns.filter(Boolean) : [],
    }))
    .filter((entry) => entry.patterns.length > 0);
  const unlockedPatternCount = unlockedPatternRows.reduce(
    (sum, row) => sum + row.patterns.length,
    0,
  );

  const perks = Array.isArray(magicState.perks) ? magicState.perks : [];
  const perkProgress =
    magicState.perkProgress &&
    typeof magicState.perkProgress === "object" &&
    !Array.isArray(magicState.perkProgress)
      ? magicState.perkProgress
      : {};
  const perkProgressRows = Object.entries(perkProgress)
    .map(([id, value]) => ({
      id,
      totalXp: Number.isFinite(value?.totalXp) ? Number(value.totalXp) : 0,
      rank: Number.isFinite(value?.rank) ? Number(value.rank) : 0,
    }))
    .sort((left, right) => right.totalXp - left.totalXp);
  const drawNotables = isAmbientSnapshot
    ? Object.entries(ambient.global?.drawMultByEssence || {})
        .map(([essence, mult]) => ({
          essence,
          mult: Number.isFinite(mult) ? Number(mult) : 1,
          delta: Math.abs((Number.isFinite(mult) ? Number(mult) : 1) - 1),
        }))
        .filter((entry) => entry.delta >= 0.04)
        .sort((left, right) => right.delta - left.delta)
        .slice(0, 4)
    : [];

  const hpMaxCanonical = calculateMaxHp(effectiveAttributes);
  const manaMaxCanonical = calculateMaxMana(effectiveAttributes);
  const hpMax = player?.hp?.max ?? hpMaxCanonical;
  const hpCurrent = player?.hp?.current ?? hpMaxCanonical;
  const manaMax = player?.mana?.max ?? manaMaxCanonical;
  const manaCurrent = player?.mana?.current ?? manaMaxCanonical;

  const strength = getAttributeValue(effectiveAttributes, "strength");
  const dexterity = getAttributeValue(effectiveAttributes, "dexterity");
  const agility = getAttributeValue(effectiveAttributes, "agility");
  const vitality = getAttributeValue(effectiveAttributes, "vitality");
  const intelligence = getAttributeValue(effectiveAttributes, "intelligence");
  const wisdom = getAttributeValue(effectiveAttributes, "wisdom");
  const willpower = getAttributeValue(effectiveAttributes, "willpower");
  const luck = getAttributeValue(effectiveAttributes, "luck");

  const equippedTitleId =
    typeof player?.equippedTitle === "string" ? player.equippedTitle : null;
  const equippedTitle = equippedTitleId ? getTitleById(equippedTitleId) : null;
  const legacyTitleName =
    typeof player?.title === "string" ? player.title : null;
  const titleLabel = equippedTitle?.name || legacyTitleName || "None";

  const raceLabel =
    typeof player?.race === "string"
      ? player.race
      : player?.race?.name || player?.race?.id || "Unknown";
  const classLabel =
    typeof player?.class === "string"
      ? player.class
      : player?.class?.name || player?.class?.id || "";
  const talentIds = Array.isArray(player?.talents) ? player.talents : [];
  const resolvedTalentNames = talentIds
    .map((id) => getTalentById(id)?.name || id)
    .filter(Boolean);
  const talentLabel =
    resolvedTalentNames.length > 0
      ? resolvedTalentNames.join(", ")
      : player?.talent || "None";
  const archetypeSystemName =
    typeof player?.archetypeSystem === "string"
      ? player.archetypeSystem
      : player?.archetypeSystem?.name || player?.archetypeSystem?.id || "None";
  const archetypeSystemCategory =
    typeof player?.archetypeSystem === "object"
      ? player.archetypeSystem?.category
      : null;
  const archetypeSystemLabel =
    archetypeSystemName !== "None" && archetypeSystemCategory
      ? `${archetypeSystemName} (${archetypeSystemCategory})`
      : archetypeSystemName;
  const secondaryClassLabel =
    typeof player?.secondaryClass === "string"
      ? player.secondaryClass
      : player?.secondaryClass?.name || player?.secondaryClass?.id || "None";
  const alignmentLabel =
    typeof player?.alignment === "string"
      ? player.alignment
      : player?.alignment?.name || player?.alignment?.id || "None";
  const starterTreeLabel = Array.isArray(player?.starterTrees)
    ? player.starterTrees
        .map((entry) => (typeof entry === "string" ? entry : entry?.name || entry?.id))
        .filter(Boolean)
        .join(", ") || "None"
    : "None";
  const creationPerkCount = Array.isArray(player?.perks) ? player.perks.length : 0;
  const skillLoadoutLabel =
    typeof player?.skillLoadoutId === "string" && player.skillLoadoutId.trim().length > 0
      ? player.skillLoadoutId
      : "None";
  const classId = player?.class?.id || player?.class;
  const classEvolutionCount = Math.max(
    0,
    Math.floor(
      Number(
        player?.progress &&
        typeof player.progress === "object" &&
        !Array.isArray(player.progress)
          ? player.progress.classEvolutions
          : 0,
      ) || 0,
    ),
  );
  const progressionModifiers = getProgressionModifiers(player);
  const requiredClassEvolutionLevel = resolveClassEvolutionRequirement(
    resolvedConfig,
    classEvolutionCount,
    progressionModifiers,
  );
  const classEvolutionOptions = classId
    ? DataRegistry.getClassEvolutionOptions(classId).map((option) => {
        const targetClass = DataRegistry.getClassById(option.targetId);
        const requirementText = formatRequirements(
          option.requirements,
          requiredClassEvolutionLevel,
        );
        const unlocked = meetsEvolutionRequirements(
          player,
          option.requirements,
          requiredClassEvolutionLevel,
        );
        return {
          ...option,
          targetClass,
          requirementText,
          unlocked,
        };
      })
    : [];

  const raceEvolutionStage = Math.max(
    0,
    Math.floor(
      getNumeric(
        player?.progress &&
          typeof player.progress === "object" &&
          !Array.isArray(player.progress)
          ? player.progress.raceEvolutionStage
          : player?.race?.evolutionStageIndex,
        0,
      ),
    ),
  );
  const raceEvolutionOptions = DataRegistry.getRaceEvolutionOptions(
    player?.race,
    raceEvolutionStage,
  ).map((option) => ({
    ...option,
    unlocked: meetsEvolutionRequirements(player, option.requirements, 0),
    requirementText: formatRequirements(option.requirements, 0),
  }));

  const derivedCombatStats = [
    {
      label: "Attack Power",
      value: Math.round(strength * 2 + dexterity * 0.5),
      hint: "Physical scaling from Strength & Dexterity",
    },
    {
      label: "Spell Power",
      value: Math.round(intelligence * 2 + wisdom * 0.5),
      hint: "Magical scaling from Intelligence & Wisdom",
    },
    {
      label: "Defense",
      value: Math.round(vitality * 1.5 + strength * 0.25),
      hint: "Damage reduction from Vitality & Strength",
    },
    {
      label: "Crit Chance",
      value: `${Math.min(60, (luck + dexterity) * 0.5).toFixed(1)}%`,
      hint: "Chance to crit from Luck & Dexterity",
    },
    {
      label: "Evasion",
      value: `${Math.min(50, agility * 0.8 + dexterity * 0.2).toFixed(1)}%`,
      hint: "Avoidance from Agility & Dexterity",
    },
    {
      label: "Focus",
      value: Math.round(wisdom + willpower * 0.5),
      hint: "Resistance to debuffs from Wisdom & Willpower",
    },
  ];

  const equipmentEntries = [
    { key: "weapon", label: "Weapon" },
    { key: "armor", label: "Armor" },
    { key: "accessory", label: "Accessory" },
    {
      key: "title",
      label: "Title",
      item: equippedTitle
        ? {
            name: equippedTitle.name,
            description: equippedTitle.description,
          }
        : legacyTitleName
          ? {
              name: legacyTitleName,
              description:
                player?.titleDescription || "Equipped honorific title",
            }
          : null,
    },
  ];

  return {
    summary: {
      playerName: player?.name || "Unknown",
      playerLevel: player?.level || 1,
      classLabel,
      titleLabel,
      raceLabel,
      talentLabel,
      archetypeSystemLabel,
      secondaryClassLabel,
      alignmentLabel,
      starterTreeLabel,
      creationPerkCount,
      skillLoadoutLabel,
      hpCurrent,
      hpMax,
      hpMaxCanonical,
      manaCurrent,
      manaMax,
      manaMaxCanonical,
      xpCurrent: player?.xp?.current || 0,
      xpMax: player?.xp?.max || 100,
      derivedCombatStats,
    },
    magic: {
      resonanceCurrent,
      resonanceMax,
      resonanceState,
      reserveTotal,
      chargeCount: charges.length,
      preparedLabel: prepared
        ? `${prepared.kind || "pattern"}${prepared.pattern ? `:${prepared.pattern}` : ""}`
        : "None",
      unlockedPatternCount,
      perkCount: perks.length,
      ambientWeatherLabel: ambientProvenance.weatherType
        ? `${ambientProvenance.weatherType} (${Number.isFinite(ambientProvenance.weatherIntensity) ? Number(ambientProvenance.weatherIntensity).toFixed(2) : "0.00"})`
        : "Unknown",
      ambientProvenance,
      anomalyNames,
      sourceNames,
      drawNotables,
      reserveRows,
      anchors,
      unlockedPatternRows,
      ownedPerkIds: perks
        .map((perk) => (typeof perk === "string" ? perk : perk?.id))
        .filter(Boolean),
      perkProgressRows,
    },
    attributes: {
      attributeEntries,
      freeAttributePoints,
      attributeInvestments,
    },
    abilities: {
      abilityList,
    },
    progression: {
      classLabel,
      raceLabel,
      requiredClassEvolutionLevel,
      classEvolutionOptions,
      raceEvolutionOptions,
      evolvableSkills,
      fusionCandidates,
      spellCandidates,
      selectedSpell,
      canFuseSelection,
      professionEntries,
    },
    collections: {
      professionEntries,
      equipmentEntries,
      inventoryList,
    },
  };
}
