import React from "react";
import ClassAbilities from "./ClassAbilities";
import ClassResourceBar from "./ClassResourceBar";
import CombatLog from "./CombatLog.jsx";
import MinionPanel from "./MinionPanel";
import RaceAbilities from "./RaceAbilities";
import StatusEffects from "./StatusEffects";

const BOARD_LANES = [
  { lane: 1, label: "Top" },
  { lane: 2, label: "Middle" },
  { lane: 3, label: "Bottom" },
];

const BOARD_SLOTS = [
  { slot: 0, label: "Front" },
  { slot: 1, label: "Mid" },
  { slot: 2, label: "Back" },
];

function toPercent(current, max) {
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function readNumericValue(value, preferredKeys = [], fallback = 0) {
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }

  if (value && typeof value === "object") {
    for (const key of preferredKeys) {
      if (Number.isFinite(Number(value?.[key]))) {
        return Number(value[key]);
      }
    }
  }

  return fallback;
}

function readPool(entity, poolName) {
  const statsPool = entity?.stats?.[poolName];
  const statsAliasPool =
    poolName === "mp" ? entity?.stats?.mana : poolName === "hp" ? entity?.stats?.health : null;
  const directPool =
    entity?.[poolName] ||
    (poolName === "mp" ? entity?.mana : poolName === "hp" ? entity?.health : null);
  const resolvedPool =
    [statsPool, statsAliasPool, directPool].find(
      (value) => value && typeof value === "object",
    ) || null;

  if (resolvedPool) {
    return {
      current: readNumericValue(resolvedPool, ["current", "value"], 0),
      max: readNumericValue(resolvedPool, ["max", "maximum", "cap", "value"], 0),
    };
  }

  return {
    current: readNumericValue(entity?.[poolName], ["current", "value"], 0),
    max: readNumericValue(
      entity?.[`max${poolName.toUpperCase()}`],
      ["max", "maximum", "cap", "value"],
      0,
    ),
  };
}

function normalizeLogText(entry) {
  if (typeof entry === "string") {
    return entry;
  }
  return entry?.text || entry?.message || "";
}

function normalizeSkillList(skills) {
  const seen = new Set();
  return (Array.isArray(skills) ? skills : [])
    .map((skill) => {
      if (!skill) return null;
      if (typeof skill === "string") {
        return { id: skill, name: skill };
      }
      const id = skill.id || skill.skillId || skill.abilityId;
      if (!id) return null;
      return {
        ...skill,
        id,
        name: skill.name || skill.label || id,
      };
    })
    .filter((skill) => {
      if (!skill || seen.has(skill.id)) return false;
      seen.add(skill.id);
      return true;
    });
}

function getUsableItems(player) {
  return (Array.isArray(player?.inventory) ? player.inventory : [])
    .map((item) => {
      if (!item?.id) return null;
      const effect = item?.effect && typeof item.effect === "object" ? item.effect : {};
      const usable =
        item.type === "consumable" ||
        Number.isFinite(Number(effect.heal)) ||
        Number.isFinite(Number(effect.mana));
      if (!usable) return null;
      return {
        ...item,
        quantity: Math.max(1, Number(item.quantity || 1)),
        label: item.name || item.id,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function getBoardUnits(board, faction) {
  return (Array.isArray(board?.units) ? board.units : [])
    .filter((unit) => unit?.faction === faction)
    .sort((left, right) => {
      if ((left?.lane || 0) !== (right?.lane || 0)) {
        return (left?.lane || 0) - (right?.lane || 0);
      }
      return (left?.slot || 0) - (right?.slot || 0);
    });
}

function getBoardUnit(board, unitId) {
  return (Array.isArray(board?.units) ? board.units : []).find(
    (unit) => unit?.id === unitId,
  );
}

function getUnitHealth(unit) {
  return {
    current: readNumericValue(unit?.stats?.health, ["current", "value"], 0),
    max: readNumericValue(unit?.stats?.health, ["maximum", "max", "cap"], 1),
  };
}

function getUnitMana(unit) {
  return {
    current: readNumericValue(unit?.stats?.mana, ["current", "value"], 0),
    max: readNumericValue(unit?.stats?.mana, ["maximum", "max", "cap"], 0),
  };
}

function getSelectedEnemyIndex(combatState, selectedTarget) {
  const enemies = Array.isArray(combatState?.enemies) ? combatState.enemies : [];
  if (selectedTarget?.id) {
    const selectedIndex = enemies.findIndex(
      (enemy) => enemy?.combatantId === selectedTarget.id,
    );
    if (selectedIndex >= 0) {
      return selectedIndex;
    }
  }

  const firstLivingIndex = enemies.findIndex(
    (enemy) => Number(enemy?.stats?.hp?.current ?? 0) > 0,
  );
  return firstLivingIndex >= 0 ? firstLivingIndex : 0;
}

function BoardCell({
  cellFaction,
  unit,
  isActive,
  isSelected,
  canMove,
  onMoveSkirmishUnit,
  onSelectSkirmishTarget,
  onSelectSkirmishUnit,
  lane,
  slot,
}) {
  const isEnemy = unit?.faction === "enemy";
  const isEmpty = !unit;
  const health = getUnitHealth(unit);
  const isInteractive =
    (isEnemy && typeof onSelectSkirmishTarget === "function") ||
    (!isEnemy && !isEmpty && typeof onSelectSkirmishUnit === "function") ||
    (isEmpty && cellFaction === "ally" && canMove && typeof onMoveSkirmishUnit === "function");

  const handleClick = () => {
    if (isEmpty) {
      if (cellFaction === "ally" && canMove && typeof onMoveSkirmishUnit === "function") {
        onMoveSkirmishUnit(lane, slot);
      }
      return;
    }

    if (isEnemy) {
      onSelectSkirmishTarget?.(unit.id);
      return;
    }

    onSelectSkirmishUnit?.(unit.id);
  };

  const className = [
    "combat-stage__cell",
    `combat-stage__cell--${cellFaction}`,
    isInteractive ? "combat-stage__cell--interactive" : "",
    isActive ? "combat-stage__cell--active" : "",
    isSelected ? "combat-stage__cell--selected" : "",
    isEmpty ? "combat-stage__cell--empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = isEmpty ? (
    <div className="combat-stage__cell-empty">
      <span>{BOARD_SLOTS.find((entry) => entry.slot === slot)?.label || "Open"}</span>
      <strong>{canMove && cellFaction === "ally" ? "Move here" : "Open"}</strong>
    </div>
  ) : (
    <>
      <div className="combat-stage__unit-name">{unit.name}</div>
      <div className="combat-stage__unit-meta">
        {unit.sourceType === "hero" ? "Hero" : unit.sourceType || "unit"} | Lvl {unit.level || 1}
      </div>
      <div className="combat-stage__meterbar combat-stage__meterbar--compact">
        <div
          className={`combat-stage__meterfill ${
            isEnemy ? "" : "combat-stage__meterfill--health"
          }`}
          style={{ width: `${toPercent(health.current, health.max)}%` }}
        />
      </div>
      <div className="combat-stage__unit-meta">
        HP {health.current}/{health.max}
      </div>
    </>
  );

  if (!isInteractive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {content}
    </button>
  );
}

function SkirmishBoardPanel({
  board,
  faction,
  title,
  activeUnitId,
  selectedTargetId,
  canMove,
  onMoveSkirmishUnit,
  onSelectSkirmishTarget,
  onSelectSkirmishUnit,
}) {
  return (
    <section className="combat-stage__panel combat-stage__board-shell">
      <div className="combat-stage__panel-header">
        <div className="combat-stage__section-label">{title}</div>
        <p className="combat-stage__section-copy">
          {faction === "ally"
            ? "Click an ally to make them the acting focus, or an open cell to reposition."
            : "Click a hostile to update strike focus and item targeting context."}
        </p>
      </div>

      <div className="combat-stage__board-grid" role="grid" aria-label={`${title} board`}>
        <div className="combat-stage__board-header" aria-hidden="true">
          <span>Lane</span>
          {BOARD_SLOTS.map((entry) => (
            <span key={`${faction}-header-${entry.slot}`}>{entry.label}</span>
          ))}
        </div>

        {BOARD_LANES.map(({ lane, label }) => (
          <div key={`${faction}-lane-${lane}`} className="combat-stage__board-row" role="row">
            <div className="combat-stage__board-label">{label}</div>
            {BOARD_SLOTS.map(({ slot }) => {
              const unit = getBoardUnits(board, faction).find(
                (candidate) => candidate?.lane === lane && candidate?.slot === slot,
              );

              return (
                <BoardCell
                  key={`${faction}-${lane}-${slot}`}
                  cellFaction={faction}
                  unit={unit}
                  isActive={unit?.id === activeUnitId}
                  isSelected={unit?.id === selectedTargetId}
                  canMove={canMove}
                  onMoveSkirmishUnit={onMoveSkirmishUnit}
                  onSelectSkirmishTarget={onSelectSkirmishTarget}
                  onSelectSkirmishUnit={onSelectSkirmishUnit}
                  lane={lane}
                  slot={slot}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function LegacyCombatUI({
  combat,
  player,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onUseRaceAbility,
  onEscape,
}) {
  const livingEnemies = (Array.isArray(combat?.enemies) ? combat.enemies : []).filter(
    (enemy) => Number(enemy?.stats?.hp?.current ?? 0) > 0,
  );
  const targetEnemy = livingEnemies[0] || null;
  const availableSkills = normalizeSkillList([
    ...(Array.isArray(player?.activeSkills) ? player.activeSkills : []),
    ...(Array.isArray(player?.skills?.active) ? player.skills.active : []),
    ...(Array.isArray(player?.abilities)
      ? player.abilities.filter((ability) => ability?.type === "active")
      : []),
  ]);

  return (
    <div className="combat-stage combat-stage--live">
      <header className="combat-stage__hero">
        <div className="combat-stage__hero-copy">
          <div className="combat-stage__eyebrow">Battle Theater</div>
          <h3 className="combat-stage__title">Active Combat</h3>
          <p className="combat-stage__lede">
            Legacy encounter snapshot loaded. The skirmish theater is prioritizing recovery-safe
            controls while this state resolves.
          </p>
        </div>
      </header>

      <section className="combat-stage__panel">
        <div className="combat-stage__panel-header">
          <div className="combat-stage__section-label">Threat Roster</div>
          <p className="combat-stage__section-copy">
            A legacy combat state is active, so direct targeting is limited to the lead hostile.
          </p>
        </div>
        <div className="combat-stage__enemy-grid">
          {livingEnemies.map((enemy, index) => (
            <div key={`${enemy?.id || "enemy"}-${index}`} className="combat-stage__enemy-card">
              <div className="combat-stage__enemy-head">
                <span>{enemy?.name || "Unknown foe"}</span>
                <strong>Lvl {enemy?.level || 1}</strong>
              </div>
              <div className="combat-stage__enemy-meta">
                HP {enemy?.stats?.hp?.current ?? 0}/{enemy?.stats?.hp?.max ?? 0}
              </div>
              <div className="combat-stage__meterbar">
                <div
                  className="combat-stage__meterfill"
                  style={{
                    width: `${toPercent(
                      enemy?.stats?.hp?.current ?? 0,
                      enemy?.stats?.hp?.max ?? 0,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="combat-stage__battle-grid">
        <section className="combat-stage__panel">
          <div className="combat-stage__panel-header">
            <div className="combat-stage__section-label">Action Dock</div>
          </div>
          <div className="combat-stage__core-actions">
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onAttack?.(0)}
              disabled={!targetEnemy}
            >
              Strike
            </button>
            <button
              type="button"
              className="holo-button holo-button--danger"
              onClick={onEscape}
            >
              Attempt Escape
            </button>
          </div>

          {availableSkills.length > 0 ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Skill Cadence</div>
              <div className="combat-stage__skill-row">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="combat-stage__skill-chip"
                    onClick={() => onUseSkill?.(skill.id, 0)}
                  >
                    <span>{skill.name}</span>
                    <strong>{skill.manaCost ?? skill.cost?.mana ?? 0} MP</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="combat-stage__ability-tray">
            {player && onUseClassAbility ? (
              <ClassAbilities
                player={player}
                onUseAbility={(abilityId) => onUseClassAbility(abilityId, 0)}
                cooldowns={combat?.classAbilityCooldowns || {}}
              />
            ) : null}
            {player && onUseRaceAbility ? (
              <RaceAbilities
                player={player}
                onUseAbility={(abilityId) => onUseRaceAbility(abilityId, 0)}
                cooldowns={combat?.raceAbilityCooldowns || {}}
              />
            ) : null}
          </div>
        </section>

        <section className="combat-stage__panel">
          {player ? <ClassResourceBar player={player} /> : null}
          <div className="combat-stage__support-grid">
            {player ? <StatusEffects player={player} /> : null}
            {player ? <MinionPanel player={player} /> : null}
          </div>
          <CombatLog entries={combat?.log || []} />
        </section>
      </div>
    </div>
  );
}

export default function CombatUI({
  combatState,
  playerState,
  onAttack,
  onMoveSkirmishUnit,
  onSelectSkirmishTarget,
  onSelectSkirmishUnit,
  onUseSkill,
  onUseClassAbility,
  onUseItem,
  onUseRaceAbility,
  onWait,
  onEscape,
}) {
  const combat = combatState;
  const player = playerState;

  if (!combat || combat.status !== "active") {
    return null;
  }

  const board = combat?.board;
  const isSkirmishCombat =
    combat?.mode === "skirmish" &&
    board &&
    Array.isArray(board?.units) &&
    board.units.length > 0;

  if (!isSkirmishCombat) {
    return (
      <LegacyCombatUI
        combat={combat}
        player={player}
        onAttack={onAttack}
        onUseSkill={onUseSkill}
        onUseClassAbility={onUseClassAbility}
        onUseRaceAbility={onUseRaceAbility}
        onEscape={onEscape}
      />
    );
  }

  const activeUnit = getBoardUnit(board, board.activeUnitId);
  const selectedTarget = getBoardUnit(board, board.selectedTargetId);
  const allyUnits = getBoardUnits(board, "ally").filter((unit) => unit?.alive !== false);
  const enemyUnits = getBoardUnits(board, "enemy").filter((unit) => unit?.alive !== false);
  const initiativeUnits = (Array.isArray(board?.turnQueue) ? board.turnQueue : [])
    .map((unitId) => getBoardUnit(board, unitId))
    .filter(Boolean);
  const activeSkills = normalizeSkillList(activeUnit?.skills);
  const items = getUsableItems(player);
  const selectedEnemyIndex = getSelectedEnemyIndex(combat, selectedTarget);
  const playerHp = readPool(player, "hp");
  const playerMp = readPool(player, "mp");
  const activeHealth = getUnitHealth(activeUnit);
  const activeMana = getUnitMana(activeUnit);
  const targetHealth = getUnitHealth(selectedTarget);
  const latestEvent = normalizeLogText((combat?.log || []).slice(-1)[0]) || "Awaiting action.";
  const isHeroActive = activeUnit?.sourceType === "hero" || activeUnit?.id === "player";
  const canMove = activeUnit?.faction === "ally";
  const currentTurnLabel = activeUnit
    ? `${activeUnit.name} is acting`
    : combat?.turn === "enemy"
      ? "Enemy pressure is resolving"
      : "Squad turn";
  const encounterLabel =
    board?.spawnMeta?.encounterType ||
    combat?.spawnMeta?.encounterType ||
    combat?.spawnMeta?.encounterId ||
    "Skirmish";

  return (
    <div className="combat-stage combat-stage--live">
      <header className="combat-stage__hero">
        <div className="combat-stage__hero-copy">
          <div className="combat-stage__eyebrow">Battle Theater</div>
          <h3 className="combat-stage__title">Skirmish Battlemode</h3>
          <p className="combat-stage__lede">
            Initiative decides the acting unit. Click allies to rotate your squad focus, click
            enemies to lock a target, and use the mirrored 3x3 boards to control formation.
          </p>
        </div>

        <div className="combat-stage__status-grid">
          <div className="combat-stage__status-card">
            <span>Turn</span>
            <strong>{currentTurnLabel}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Encounter</span>
            <strong>{String(encounterLabel).replace(/[_-]/g, " ")}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Allies</span>
            <strong>{allyUnits.length}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Enemies</span>
            <strong>{enemyUnits.length}</strong>
          </div>
        </div>
      </header>

      <section className="combat-stage__spotlight">
        <div className="combat-stage__focus-card">
          <div className="combat-stage__focus-header">
            <div>
              <div className="combat-stage__section-label">Active Unit</div>
              <h4 className="combat-stage__focus-name">
                {activeUnit?.name || "Queue resolving"}
              </h4>
            </div>
            <div className="combat-stage__focus-level">
              {activeUnit
                ? `${activeUnit.faction === "ally" ? "Ally" : "Enemy"} | Lvl ${activeUnit.level || 1}`
                : "Stand by"}
            </div>
          </div>

          <div className="combat-stage__focus-grid">
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Health</span>
              <strong>
                {activeHealth.current}/{activeHealth.max}
              </strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Mana</span>
              <strong>
                {activeMana.current}/{activeMana.max}
              </strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Cell</span>
              <strong>
                {activeUnit ? `${activeUnit.lane}:${activeUnit.slot}` : "?"}
              </strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Last event</span>
              <strong>{latestEvent}</strong>
            </div>
          </div>

          {initiativeUnits.length > 0 ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Initiative Rail</div>
              <div className="combat-stage__initiative-rail">
                {initiativeUnits.map((unit, index) => (
                  <button
                    key={`initiative-${unit.id}-${index}`}
                    type="button"
                    className={`combat-stage__initiative-chip ${
                      unit.id === board.activeUnitId ? "combat-stage__initiative-chip--active" : ""
                    }`}
                    onClick={() =>
                      unit.faction === "enemy"
                        ? onSelectSkirmishTarget?.(unit.id)
                        : onSelectSkirmishUnit?.(unit.id)
                    }
                  >
                    <span>{unit.name}</span>
                    <strong>
                      {unit.faction === "enemy" ? "Hostile" : "Ally"} | {unit.lane}:{unit.slot}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="combat-stage__player-card">
          <div className="combat-stage__section-label">Player Read</div>
          <div className="combat-stage__player-grid">
            <div className="combat-stage__player-stat">
              <span>Health</span>
              <strong>
                {playerHp.current}/{playerHp.max || "?"}
              </strong>
              <div className="combat-stage__meterbar combat-stage__meterbar--compact">
                <div
                  className="combat-stage__meterfill combat-stage__meterfill--health"
                  style={{ width: `${toPercent(playerHp.current, playerHp.max)}%` }}
                />
              </div>
            </div>
            <div className="combat-stage__player-stat">
              <span>Mana</span>
              <strong>
                {playerMp.current}/{playerMp.max || "?"}
              </strong>
              <div className="combat-stage__meterbar combat-stage__meterbar--compact">
                <div
                  className="combat-stage__meterfill combat-stage__meterfill--mana"
                  style={{ width: `${toPercent(playerMp.current, playerMp.max)}%` }}
                />
              </div>
            </div>
            <div className="combat-stage__player-stat">
              <span>Selected Target</span>
              <strong>{selectedTarget?.name || "No target"}</strong>
            </div>
            <div className="combat-stage__player-stat">
              <span>Target Health</span>
              <strong>
                {selectedTarget ? `${targetHealth.current}/${targetHealth.max}` : "Awaiting focus"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="combat-stage__battle-grid">
        <SkirmishBoardPanel
          board={board}
          faction="ally"
          title="Allied Formation"
          activeUnitId={board.activeUnitId}
          selectedTargetId={board.selectedTargetId}
          canMove={canMove}
          onMoveSkirmishUnit={onMoveSkirmishUnit}
          onSelectSkirmishTarget={onSelectSkirmishTarget}
          onSelectSkirmishUnit={onSelectSkirmishUnit}
        />

        <SkirmishBoardPanel
          board={board}
          faction="enemy"
          title="Enemy Formation"
          activeUnitId={board.activeUnitId}
          selectedTargetId={board.selectedTargetId}
          canMove={false}
          onMoveSkirmishUnit={onMoveSkirmishUnit}
          onSelectSkirmishTarget={onSelectSkirmishTarget}
          onSelectSkirmishUnit={onSelectSkirmishUnit}
        />
      </div>

      <div className="combat-stage__battle-grid">
        <section className="combat-stage__panel">
          <div className="combat-stage__panel-header">
            <div className="combat-stage__section-label">Action Dock</div>
            <p className="combat-stage__section-copy">
              Actions resolve from the current acting unit. Reposition by clicking an open ally
              cell, then commit a skill, item, wait, or escape.
            </p>
          </div>

          <div className="combat-stage__core-actions">
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onAttack?.(selectedEnemyIndex)}
              disabled={!selectedTarget || selectedTarget?.faction !== "enemy"}
            >
              Strike Target
            </button>

            <button
              type="button"
              className="holo-button"
              onClick={onWait}
              disabled={!activeUnit || activeUnit?.faction !== "ally"}
            >
              Wait
            </button>

            <button
              type="button"
              className="holo-button holo-button--danger"
              onClick={onEscape}
              disabled={!activeUnit || activeUnit?.faction !== "ally"}
            >
              Attempt Escape
            </button>
          </div>

          {activeSkills.length > 0 ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Active Unit Skills</div>
              <div className="combat-stage__skill-row">
                {activeSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="combat-stage__skill-chip"
                    onClick={() => onUseSkill?.(skill.id, selectedEnemyIndex)}
                    disabled={!activeUnit || activeUnit?.faction !== "ally"}
                    title={skill.description || skill.name}
                  >
                    <span>{skill.name}</span>
                    <strong>{skill.manaCost ?? skill.cost?.mana ?? 0} MP</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Battle Items</div>
              <div className="combat-stage__skill-row">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="combat-stage__skill-chip"
                    onClick={() => onUseItem?.(item.id, item.label)}
                    disabled={!activeUnit || activeUnit?.faction !== "ally"}
                    title={item.description || item.label}
                  >
                    <span>{item.label}</span>
                    <strong>x{item.quantity}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isHeroActive && player && onUseClassAbility ? (
            <div className="combat-stage__ability-tray">
              <ClassAbilities
                player={player}
                onUseAbility={(abilityId) => onUseClassAbility(abilityId, selectedEnemyIndex)}
                cooldowns={combat?.classAbilityCooldowns || {}}
              />
            </div>
          ) : null}

          {isHeroActive && player && onUseRaceAbility ? (
            <div className="combat-stage__ability-tray">
              <RaceAbilities
                player={player}
                onUseAbility={(abilityId) => onUseRaceAbility(abilityId, selectedEnemyIndex)}
                cooldowns={combat?.raceAbilityCooldowns || {}}
              />
            </div>
          ) : null}
        </section>

        <section className="combat-stage__panel">
          <div className="combat-stage__panel-header">
            <div className="combat-stage__section-label">Battlefield Read</div>
            <p className="combat-stage__section-copy">
              Use the target card, combat log, and sustain panels to keep the whole squad alive
              while the initiative rail cycles.
            </p>
          </div>

          <div className="combat-stage__control-block">
            <div className="combat-stage__section-label">Selected Target</div>
            <div className="combat-stage__focus-grid">
              <div className="combat-stage__status-card combat-stage__status-card--inline">
                <span>Name</span>
                <strong>{selectedTarget?.name || "No target locked"}</strong>
              </div>
              <div className="combat-stage__status-card combat-stage__status-card--inline">
                <span>Faction</span>
                <strong>{selectedTarget?.faction || "None"}</strong>
              </div>
              <div className="combat-stage__status-card combat-stage__status-card--inline">
                <span>Health</span>
                <strong>
                  {selectedTarget ? `${targetHealth.current}/${targetHealth.max}` : "--"}
                </strong>
              </div>
              <div className="combat-stage__status-card combat-stage__status-card--inline">
                <span>Cell</span>
                <strong>
                  {selectedTarget ? `${selectedTarget.lane}:${selectedTarget.slot}` : "--"}
                </strong>
              </div>
            </div>
          </div>

          {player ? <ClassResourceBar player={player} /> : null}

          <div className="combat-stage__support-grid">
            {player ? <StatusEffects player={player} /> : null}
            {player ? <MinionPanel player={player} /> : null}
          </div>

          <CombatLog entries={combat?.log?.length ? combat.log : board?.eventLog || []} />
        </section>
      </div>
    </div>
  );
}
