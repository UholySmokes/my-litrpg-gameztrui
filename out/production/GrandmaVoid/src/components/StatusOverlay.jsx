import React, { useEffect, useRef, useState } from "react";
import { ATTRIBUTE_METADATA, toCanonicalAttributeKey } from "../constants/attributes.js";
import {
  ensureAttributeShape,
  getAttributeValue,
  calculateMaxHp,
  calculateMaxMana,
} from "../utils/AttributeMath.js";
import { getEffectiveAttributes, getTitleById } from "../core/titleLogic.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { canEvolveSkill } from "../systems/skills/SkillEvolutionSystem.js";
import { canFuseSkills } from "../systems/skills/SkillFusionSystem.js";
import { isSpellSkill } from "../systems/skills/SpellStudySystem.js";
import { getTalentById } from "../entities/Player.js";
import {
  getProgressionModifiers,
  resolveClassEvolutionRequirement,
} from "../utils/shared.js";

const getNumeric = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const getTotalKills = (player) =>
  Math.max(0, Math.floor(getNumeric(player?.progress?.totalKills, 0)));

const getAttributeValueByAlias = (player, alias) => {
  const canonical = toCanonicalAttributeKey(alias);
  if (!canonical) return 0;
  return getNumeric(player?.attributes?.[canonical], 0);
};

const meetsEvolutionRequirements = (player, requirements = {}, extraMinLevel = 0) => {
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
};

const formatRequirements = (requirements = {}, extraMinLevel = 0) => {
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
};

export default function StatusOverlay({
  player,
  world,
  config,
  isOpen,
  onClose,
  onAllocateAttribute,
  onDeallocateAttribute,
  onEvolveSkill,
  onFuseSkills,
  onEvolveClass,
  onEvolveRace,
  onStudySpell,
  variant = "modal",
}) {
  const [fusionSkillA, setFusionSkillA] = useState("");
  const [fusionSkillB, setFusionSkillB] = useState("");
  const [studySkillId, setStudySkillId] = useState("");
  const dialogRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  const isModal = variant !== "window";
  useEffect(() => {
    if (!isModal || !isOpen) return;
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      lastFocusedElementRef.current?.focus?.();
    };
  }, [isModal, isOpen]);

  useEffect(() => {
    if (!isModal || !isOpen || typeof onClose !== "function") return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModal, isOpen, onClose]);

  if ((isModal && !isOpen) || !player) return null;

  const resolvedConfig =
    config && typeof config === "object" && !Array.isArray(config)
      ? config
      : {};
  const baseAttributeValue = Number.isFinite(resolvedConfig.baseAttributeValue)
    ? resolvedConfig.baseAttributeValue
    : 5;

  const handleAllocateAttribute = (attributeKey) => {
    if (typeof onAllocateAttribute === "function") {
      onAllocateAttribute(attributeKey);
    }
  };

  const handleDeallocateAttribute = (attributeKey) => {
    if (typeof onDeallocateAttribute === "function") {
      onDeallocateAttribute(attributeKey);
    }
  };

  const normalizedAttributes = ensureAttributeShape(
    player.attributes,
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

  const abilityList = player.abilities || [];
  const inventoryList = player.inventory || [];
  const equipment = player.equipment || {};
  const freeAttributePoints = player.attributes?.freePoints ?? 0;
  const attributeInvestments = player.attributeInvestments || {};
  const evolvableSkills = abilityList.filter((skill) => canEvolveSkill(skill));
  const fusionCandidates = abilityList.filter((skill) => skill?.id);
  const spellCandidates = abilityList.filter((skill) => isSpellSkill(skill));
  const selectedSpell = spellCandidates.find(
    (skill) => skill.id === studySkillId,
  );
  const selectedSkillA = fusionCandidates.find(
    (skill) => skill.id === fusionSkillA,
  );
  const selectedSkillB = fusionCandidates.find(
    (skill) => skill.id === fusionSkillB,
  );
  const canFuseSelection = canFuseSkills(selectedSkillA, selectedSkillB);
  const professionEntries = Object.entries(player.professions || {});

  const worldState =
    world && typeof world === "object" && !Array.isArray(world) ? world : {};
  const magicState =
    player.magic && typeof player.magic === "object" && !Array.isArray(player.magic)
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
    .sort((a, b) => b.amount - a.amount);
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
    .sort((a, b) => b.totalXp - a.totalXp);
  const drawNotables = isAmbientSnapshot
    ? Object.entries(ambient.global?.drawMultByEssence || {})
        .map(([essence, mult]) => ({
          essence,
          mult: Number.isFinite(mult) ? Number(mult) : 1,
          delta: Math.abs((Number.isFinite(mult) ? Number(mult) : 1) - 1),
        }))
        .filter((entry) => entry.delta >= 0.04)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 4)
    : [];

  const hpMaxCanonical = calculateMaxHp(effectiveAttributes);
  const manaMaxCanonical = calculateMaxMana(effectiveAttributes);
  const hpMax = player.hp?.max ?? hpMaxCanonical;
  const hpCurrent = player.hp?.current ?? hpMaxCanonical;
  const manaMax = player.mana?.max ?? manaMaxCanonical;
  const manaCurrent = player.mana?.current ?? manaMaxCanonical;

  const strength = getAttributeValue(effectiveAttributes, "strength");
  const dexterity = getAttributeValue(effectiveAttributes, "dexterity");
  const agility = getAttributeValue(effectiveAttributes, "agility");
  const vitality = getAttributeValue(effectiveAttributes, "vitality");
  const intelligence = getAttributeValue(effectiveAttributes, "intelligence");
  const wisdom = getAttributeValue(effectiveAttributes, "wisdom");
  const willpower = getAttributeValue(effectiveAttributes, "willpower");
  const luck = getAttributeValue(effectiveAttributes, "luck");

  const equippedTitleId =
    typeof player.equippedTitle === "string" ? player.equippedTitle : null;
  const equippedTitle = equippedTitleId ? getTitleById(equippedTitleId) : null;
  const legacyTitleName =
    typeof player.title === "string" ? player.title : null;
  const titleLabel = equippedTitle?.name || legacyTitleName || "None";

  const raceLabel =
    typeof player.race === "string"
      ? player.race
      : player.race?.name || player.race?.id || "Unknown";
  const classLabel =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || player.class?.id || "";
  const talentIds = Array.isArray(player.talents) ? player.talents : [];
  const resolvedTalentNames = talentIds
    .map((id) => getTalentById(id)?.name || id)
    .filter(Boolean);
  const talentLabel =
    resolvedTalentNames.length > 0
      ? resolvedTalentNames.join(", ")
      : player.talent || "None";
  const archetypeSystemName =
    typeof player.archetypeSystem === "string"
      ? player.archetypeSystem
      : player.archetypeSystem?.name || player.archetypeSystem?.id || "None";
  const archetypeSystemCategory =
    typeof player.archetypeSystem === "object"
      ? player.archetypeSystem?.category
      : null;
  const archetypeSystemLabel =
    archetypeSystemName !== "None" && archetypeSystemCategory
      ? `${archetypeSystemName} (${archetypeSystemCategory})`
      : archetypeSystemName;
  const secondaryClassLabel =
    typeof player.secondaryClass === "string"
      ? player.secondaryClass
      : player.secondaryClass?.name || player.secondaryClass?.id || "None";
  const alignmentLabel =
    typeof player.alignment === "string"
      ? player.alignment
      : player.alignment?.name || player.alignment?.id || "None";
  const starterTreeLabel = Array.isArray(player.starterTrees)
    ? player.starterTrees
        .map((entry) => (typeof entry === "string" ? entry : entry?.name || entry?.id))
        .filter(Boolean)
        .join(", ") || "None"
    : "None";
  const creationPerkCount = Array.isArray(player.perks) ? player.perks.length : 0;
  const skillLoadoutLabel =
    typeof player.skillLoadoutId === "string" && player.skillLoadoutId.trim().length > 0
      ? player.skillLoadoutId
      : "None";
  const classId = player.class?.id || player.class;
  const classEvolutionCount = Math.max(
    0,
    Math.floor(
      Number(
        player.progress &&
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
        player.progress &&
          typeof player.progress === "object" &&
          !Array.isArray(player.progress)
          ? player.progress.raceEvolutionStage
          : player.race?.evolutionStageIndex,
        0,
      ),
    ),
  );
  const raceEvolutionOptions = DataRegistry.getRaceEvolutionOptions(
    player.race,
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
                player.titleDescription || "Equipped honorific title",
            }
          : null,
    },
  ];

  const panel = (
    <div
      className="holo-panel"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "rgba(0, 0, 0, 0.92)",
        border: "1px solid rgba(0, 243, 255, 0.4)",
      }}
    >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 id="status-dialog-title" style={{ color: "var(--holo-cyan)", margin: 0 }}>
                Character Status
              </h2>
              <div style={{ color: "var(--text-main)" }}>
                {player.name} · Level {player.level || 1} {classLabel}
              </div>
            </div>
            <button
              className="holo-button"
              onClick={onClose}
              style={{
                borderColor: "var(--holo-alert)",
                color: "var(--holo-alert)",
              }}
            >
              Close
            </button>
          </div>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Vital Statistics
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <StatCard
                label="Health"
                value={`${hpCurrent} / ${hpMax}`}
                tooltip={`Derived cap: ${hpMaxCanonical}`}
              />
              <StatCard
                label="Mana"
                value={`${manaCurrent} / ${manaMax}`}
                tooltip={`Derived cap: ${manaMaxCanonical}`}
              />
              <StatCard
                label="Experience"
                value={`${player.xp?.current || 0} / ${player.xp?.max || 100}`}
              />
              <StatCard label="Title" value={titleLabel} />
              <StatCard label="System" value={archetypeSystemLabel} />
              <StatCard label="Race" value={raceLabel} />
              <StatCard label="Talents" value={talentLabel} />
              <StatCard label="Secondary Class" value={secondaryClassLabel} />
              <StatCard label="Alignment" value={alignmentLabel} />
              <StatCard label="Starter Trees" value={starterTreeLabel} />
              <StatCard label="Creation Perks" value={String(creationPerkCount)} />
              <StatCard label="Skill Loadout" value={skillLoadoutLabel} />
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Magic Ecology
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <StatCard
                label="Resonance"
                value={`${resonanceCurrent.toFixed(1)} / ${resonanceMax.toFixed(1)}`}
                tooltip="Rising resonance increases instability and overload risk"
              />
              <StatCard
                label="Resonance State"
                value={resonanceState}
              />
              <StatCard
                label="Reserve Total"
                value={reserveTotal.toFixed(1)}
              />
              <StatCard
                label="Stored Charges"
                value={String(charges.length)}
              />
              <StatCard
                label="Prepared"
                value={
                  prepared
                    ? `${prepared.kind || "pattern"}${prepared.pattern ? `:${prepared.pattern}` : ""}`
                    : "None"
                }
              />
              <StatCard
                label="Unlocked Patterns"
                value={String(unlockedPatternCount)}
              />
              <StatCard
                label="Magic Perks"
                value={String(perks.length)}
              />
              <StatCard
                label="Ambient Weather"
                value={
                  ambientProvenance.weatherType
                    ? `${ambientProvenance.weatherType} (${Number.isFinite(ambientProvenance.weatherIntensity) ? Number(ambientProvenance.weatherIntensity).toFixed(2) : "0.00"})`
                    : "Unknown"
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
                  Ambient Drivers
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Time: {ambientProvenance.timeOfDay || "unknown"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Weather: {ambientProvenance.weatherType || "unknown"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Anomalies: {anomalyNames.length ? anomalyNames.join(", ") : "none"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Sources: {sourceNames.length ? sourceNames.join(", ") : "none"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
                  Draw notables:{" "}
                  {drawNotables.length
                    ? drawNotables
                        .map((entry) => `${entry.essence} x${entry.mult.toFixed(2)}`)
                        .join(" | ")
                    : "none"}
                </div>
              </div>

              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
                  Reserve Composition
                </div>
                {reserveRows.length === 0 ? (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                    No stored reserves.
                  </div>
                ) : (
                  reserveRows.slice(0, 8).map((row) => (
                    <div
                      key={row.essence}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        color: "var(--text-main)",
                        padding: "0.15rem 0",
                      }}
                    >
                      <span>{row.essence}</span>
                      <span>
                        {row.amount.toFixed(2)} | taint {(row.taint * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
                  Pattern & Anchor State
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Anchored Self: {anchors.self ? "yes" : "no"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Anchored Area: {anchors.area ? "yes" : "no"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                  Anchored Item: {anchors.itemId || "none"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
                  {unlockedPatternRows.length === 0
                    ? "No unlocked patterns yet."
                    : unlockedPatternRows
                        .map((row) => `${row.kind}: ${row.patterns.join(", ")}`)
                        .join(" | ")}
                </div>
              </div>

              <div className="holo-panel" style={{ padding: "0.75rem" }}>
                <div style={{ color: "var(--holo-cyan)", marginBottom: "0.35rem" }}>
                  Perk Progress
                </div>
                {perks.length === 0 ? (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                    No perks owned.
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                    Owned:{" "}
                    {perks
                      .map((perk) => (typeof perk === "string" ? perk : perk?.id))
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
                {perkProgressRows.length > 0 && (
                  <div style={{ marginTop: "0.35rem" }}>
                    {perkProgressRows.slice(0, 6).map((row) => (
                      <div
                        key={row.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          color: "var(--text-main)",
                        }}
                      >
                        <span>{row.id}</span>
                        <span>
                          rank {row.rank} | xp {row.totalXp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Derived Combat Stats
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {derivedCombatStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  tooltip={stat.hint}
                />
              ))}
            </div>
          </section>

          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.5rem",
              }}
            >
              <h3 style={{ color: "var(--holo-cyan)", margin: 0 }}>
                Attributes
              </h3>
              <div style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
                Free Points: {freeAttributePoints}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {attributeEntries.map((entry) => (
                <div
                  key={entry.key}
                  className="holo-panel"
                  style={{
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                  title={
                    entry.value !== entry.baseValue
                      ? `${entry.description} (Titles: ${
                          entry.value - entry.baseValue > 0 ? "+" : ""
                        }${entry.value - entry.baseValue})`
                      : entry.description
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {entry.label}
                    </span>
                    <span style={{ fontSize: "1.1rem" }}>{entry.value}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {entry.description}
                    {entry.value !== entry.baseValue && (
                      <span>
                        {" "}
                        (Titles: {entry.value - entry.baseValue > 0 ? "+" : ""}
                        {entry.value - entry.baseValue})
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <button
                      className="holo-button"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                      aria-label={`Remove point from ${entry.label}`}
                      disabled={
                        (attributeInvestments[entry.key] || 0) <= 0 ||
                        typeof onDeallocateAttribute !== "function"
                      }
                      onClick={() => handleDeallocateAttribute(entry.key)}
                    >
                      -
                    </button>
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--text-dim)",
                      }}
                    >
                      Invested: {attributeInvestments[entry.key] || 0}
                    </div>
                    <button
                      className="holo-button"
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                      aria-label={`Add point to ${entry.label}`}
                      disabled={
                        freeAttributePoints <= 0 ||
                        typeof onAllocateAttribute !== "function"
                      }
                      onClick={() => handleAllocateAttribute(entry.key)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Abilities
            </h3>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              {abilityList.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No abilities known.
                </div>
              ) : (
                abilityList.map((ability, idx) => (
                  <div
                    key={`${ability.name}-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      borderBottom: "1px solid rgba(0, 243, 255, 0.1)",
                      padding: "0.35rem 0",
                      fontSize: "0.9rem",
                    }}
                    title={ability.description || "No details available."}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{ability.name}</span>
                      <span>Lvl {ability.level || 1}</span>
                    </div>
                    {ability.description && (
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}
                      >
                        {ability.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Class Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.4rem" }}>
                Current Class: {classLabel || "Unknown"}
              </div>
              <div style={{ color: "var(--text-dim)", marginBottom: "0.5rem" }}>
                Baseline requirement this stage: Level {requiredClassEvolutionLevel}
              </div>
              {classEvolutionOptions.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No further class evolutions are available.
                </div>
              ) : (
                classEvolutionOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      borderTop: "1px solid rgba(0, 243, 255, 0.1)",
                      paddingTop: "0.55rem",
                      marginTop: "0.55rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                        {option.targetClass?.name || option.name}
                      </span>
                      <button
                        className="holo-button"
                        style={{ fontSize: "0.72rem", minWidth: "108px" }}
                        disabled={!option.unlocked || typeof onEvolveClass !== "function"}
                        onClick={() => onEvolveClass?.(option.id)}
                      >
                        Evolve
                      </button>
                    </div>
                    <div style={{ color: "var(--text-main)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                      {option.description}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      Requirements: {option.requirementText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Race Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.4rem" }}>
                Current Race Form: {raceLabel}
              </div>
              {raceEvolutionOptions.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  Race evolution limit reached for this lineage.
                </div>
              ) : (
                raceEvolutionOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      borderTop: "1px solid rgba(0, 243, 255, 0.1)",
                      paddingTop: "0.55rem",
                      marginTop: "0.55rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
                        {option.name}
                      </span>
                      <button
                        className="holo-button"
                        style={{ fontSize: "0.72rem", minWidth: "108px" }}
                        disabled={!option.unlocked || typeof onEvolveRace !== "function"}
                        onClick={() => onEvolveRace?.(option.id)}
                      >
                        Evolve
                      </button>
                    </div>
                    <div style={{ color: "var(--text-main)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                      {option.description}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      Requirements: {option.requirementText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Skill Evolution
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {evolvableSkills.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No skills eligible. Skills must be level 10 or higher to evolve.
                </div>
              ) : (
                evolvableSkills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.35rem 0",
                      borderBottom: "1px solid rgba(0, 243, 255, 0.1)",
                    }}
                  >
                    <span>
                      {skill.name} (Lvl {skill.level || 1})
                    </span>
                    <button
                      className="holo-button"
                      style={{ fontSize: "0.75rem" }}
                      disabled={typeof onEvolveSkill !== "function"}
                      onClick={() => onEvolveSkill?.(skill.id)}
                    >
                      Evolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Skill Fusion
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={fusionSkillA}
                  onChange={(event) => setFusionSkillA(event.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Skill A</option>
                  {fusionCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.type})
                    </option>
                  ))}
                </select>
                <select
                  value={fusionSkillB}
                  onChange={(event) => setFusionSkillB(event.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Skill B</option>
                  {fusionCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.type})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="holo-button"
                style={{ marginTop: "0.5rem" }}
                disabled={!canFuseSelection || typeof onFuseSkills !== "function"}
                onClick={() => onFuseSkills?.(fusionSkillA, fusionSkillB)}
              >
                Fuse Skills
              </button>
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Spell Study
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  className="holo-button"
                  disabled={typeof onStudySpell !== "function"}
                  onClick={() => onStudySpell?.({ mode: "create" })}
                >
                  Study New Spell
                </button>
                <select
                  value={studySkillId}
                  onChange={(event) => setStudySkillId(event.target.value)}
                  style={{ flex: 1, minWidth: "200px" }}
                >
                  <option value="">Select spell to improve</option>
                  {spellCandidates.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} (Lvl {skill.level || 1})
                    </option>
                  ))}
                </select>
                <button
                  className="holo-button"
                  disabled={
                    !selectedSpell || typeof onStudySpell !== "function"
                  }
                  onClick={() =>
                    onStudySpell?.({
                      mode: "improve",
                      skillId: selectedSpell?.id,
                    })
                  }
                >
                  Improve Spell
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Professions
            </h3>
            <div
              style={{
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
              }}
            >
              {professionEntries.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>
                  No professions learned.
                </div>
              ) : (
                professionEntries.map(([id, data]) => (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.25rem 0",
                    }}
                  >
                    <span>{id}</span>
                    <span>XP {data?.xp ?? 0}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Equipped Gear
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {equipmentEntries.map((slot) => {
                const item = slot.item ?? equipment[slot.key];
                if (!item) {
                  return (
                    <div
                      key={slot.key}
                      className="holo-panel"
                      style={{ padding: "0.75rem" }}
                    >
                      <div style={{ color: "var(--text-dim)" }}>
                        {slot.label}
                      </div>
                      <div
                        style={{
                          color: "var(--text-main)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No item equipped
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={slot.key}
                    className="holo-panel"
                    style={{ padding: "0.75rem" }}
                    title={item.description || "Equipped item"}
                  >
                    <div
                      style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}
                    >
                      {slot.label}
                    </div>
                    <div
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {item.name || item.id || item}
                    </div>
                    {item.stats && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-main)",
                          marginTop: "0.25rem",
                        }}
                      >
                        {Object.entries(item.stats)
                          .map(([stat, value]) => `${stat}+${value}`)
                          .join(" · ")}
                      </div>
                    )}
                    {!item.stats && item.description && (
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", marginBottom: "0.5rem" }}>
              Inventory Snapshot
            </h3>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid rgba(0, 243, 255, 0.2)",
                padding: "0.75rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.5rem",
              }}
            >
              {inventoryList.length === 0 ? (
                <div style={{ color: "var(--text-dim)" }}>Inventory empty.</div>
              ) : (
                inventoryList.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="holo-panel"
                    style={{ padding: "0.5rem" }}
                    title={item.description || "No details available."}
                  >
                    <div
                      style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}
                    >
                      {item.name || item.id}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--text-main)" }}
                    >
                      Qty: {item.quantity ?? 1}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-dim)",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
    </div>
  );

  if (!isModal) {
    return <div style={{ maxHeight: "100%", overflow: "auto" }}>{panel}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "rgba(0, 0, 0, 0.92)",
          border: "1px solid rgba(0, 243, 255, 0.4)",
        }}
      >
        {panel}
      </div>
    </div>
  );
}

function StatCard({ label, value, tooltip }) {
  return (
    <div className="holo-panel" style={{ padding: "0.75rem" }} title={tooltip}>
      <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
        {label}
      </div>
      <div style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  );
}
