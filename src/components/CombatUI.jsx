import React, { useState } from "react";
import ClassResourceBar from "./ClassResourceBar";
import ClassAbilities from "./ClassAbilities";
import RaceAbilities from "./RaceAbilities";
import StatusEffects from "./StatusEffects";
import MinionPanel from "./MinionPanel";
import CombatLog from "./CombatLog.jsx";

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

function normalizeTextValue(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (Number.isFinite(Number(value))) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => normalizeTextValue(entry))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : fallback;
  }

  if (value && typeof value === "object") {
    const objectText =
      value.label ??
      value.name ??
      value.reason ??
      value.source ??
      value.text ??
      value.message;

    if (objectText !== undefined) {
      return normalizeTextValue(objectText, fallback);
    }

    const current = readNumericValue(value, ["current", "value"], Number.NaN);
    const max = readNumericValue(value, ["max", "maximum", "cap"], Number.NaN);
    if (Number.isFinite(current) && Number.isFinite(max)) {
      return `${current}/${max}`;
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

  if (poolName === "mp") {
    const manaPool = entity?.stats?.mana;
    if (manaPool && typeof manaPool === "object") {
      return {
        current: manaPool.current ?? 0,
        max: manaPool.max ?? 0,
      };
    }
  }

  const currentCandidate =
    entity?.[poolName] ??
    (poolName === "mp" ? entity?.mana : poolName === "hp" ? entity?.health : undefined);
  const maxCandidate = [
    entity?.[`max${poolName.toUpperCase()}`],
    entity?.[`max${poolName.charAt(0).toUpperCase()}${poolName.slice(1)}`],
    poolName === "hp" ? entity?.maxHealth : undefined,
    poolName === "mp" ? entity?.maxMana : undefined,
  ].find((value) => value !== undefined && value !== null);

  return {
    current: readNumericValue(currentCandidate, ["current", "value"], 0),
    max: readNumericValue(maxCandidate, ["max", "maximum", "current", "value"], 0),
  };
}

function normalizeLogText(entry) {
  if (typeof entry === "string") {
    return entry;
  }

  return entry?.text || entry?.message || "";
}

export default function CombatUI({
  combatState,
  playerState,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onUseRaceAbility,
  onEscape,
  onSetCombatLane,
  onSetCombatStance,
}) {
  const combat = combatState;
  const player = playerState;
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);

  const livingEnemies = (combat?.enemies || [])
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => (enemy?.stats?.hp?.current || 0) > 0);
  const resolvedEnemyIndex = livingEnemies.some(
    ({ index }) => index === selectedEnemyIndex,
  )
    ? selectedEnemyIndex
    : (livingEnemies[0]?.index ?? 0);

  if (!combat || combat.status !== "active") {
    return null;
  }

  const selectedEnemy = livingEnemies.find(({ index }) => index === resolvedEnemyIndex);
  const availableSkills =
    player?.activeSkills?.length
      ? player.activeSkills
      : player?.skills?.active ||
        (player?.abilities || []).filter((ability) => ability.type === "active") ||
        [];
  const skillCooldowns = combat?.skillCooldowns || {};
  const playerLane = combat?.lanes?.player;
  const laneNumbers = Array.from(
    {
      length: Math.max(
        3,
        Number.isFinite(playerLane) ? playerLane : 1,
        ...((combat?.lanes?.enemies || []).filter((lane) => Number.isFinite(lane))),
      ),
    },
    (_, index) => index + 1,
  );
  const laneControlsDisabled = combat?.turn !== "player";
  const activeStance = combat?.stance || "focused";
  const telegraphs = Array.isArray(combat?.telegraphs) ? combat.telegraphs : [];
  const arenaTags = Array.isArray(combat?.arenaTags) ? combat.arenaTags : [];
  const tacticalVerbs = Array.isArray(combat?.tacticalVerbs) ? combat.tacticalVerbs : [];
  const selectedEnemyData = selectedEnemy?.enemy ?? null;
  const selectedEnemyLane = Number.isFinite(combat?.lanes?.enemies?.[resolvedEnemyIndex])
    ? combat.lanes.enemies[resolvedEnemyIndex]
    : (selectedEnemyData?.lane ?? 1);
  const playerHp = readPool(player, "hp");
  const playerMp = readPool(player, "mp");
  const latestEvent =
    normalizeTextValue(normalizeLogText((combat?.log || []).slice(-1)[0]), "No actions resolved yet.");
  const isPlayerTurn = combat?.turn === "player";
  const currentTurnLabel = isPlayerTurn
    ? "Player turn"
    : `${String(combat?.turn || "enemy").replace(/_/g, " ")} turn`;
  const encounterCopy = isPlayerTurn
    ? "Your window is open. Confirm a target, commit your stance, and spend resources with intent."
    : "Enemy pressure is advancing. Read the telegraphs and prepare your next counterline.";
  const selectedTelegraphs = telegraphs.filter((telegraph) => {
    const telegraphName = String(telegraph?.enemyName || "").toLowerCase();
    const enemyName = String(selectedEnemyData?.name || "").toLowerCase();
    return telegraphName && enemyName ? telegraphName === enemyName : false;
  });
  const leadPressure = normalizeTextValue(
    selectedTelegraphs[0]?.counterText ||
      selectedTelegraphs[0]?.pressure ||
      tacticalVerbs[0]?.reason ||
      tacticalVerbs[0]?.label,
    "Hold formation",
  );
  const threatCount = livingEnemies.length;
  const maxEnemyLevel = livingEnemies.reduce(
    (highest, { enemy }) => Math.max(highest, Number(enemy?.level) || 0),
    0,
  );
  const playerHpPercent = toPercent(playerHp.current, playerHp.max);
  const playerMpPercent = toPercent(playerMp.current, playerMp.max);

  return (
    <div className="combat-stage combat-stage--live">
      <header className="combat-stage__hero">
        <div className="combat-stage__hero-copy">
          <div className="combat-stage__eyebrow">Battle Theater</div>
          <h3 className="combat-stage__title">Active Combat</h3>
          <p className="combat-stage__lede">{encounterCopy}</p>
        </div>

        <div className="combat-stage__status-grid">
          <div className="combat-stage__status-card">
            <span>Turn</span>
            <strong>{currentTurnLabel}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Lane</span>
            <strong>{Number.isFinite(playerLane) ? playerLane : 1}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Threats</span>
            <strong>{threatCount}</strong>
          </div>
          <div className="combat-stage__status-card">
            <span>Enemy peak</span>
            <strong>{maxEnemyLevel > 0 ? `Lvl ${maxEnemyLevel}` : "Unknown"}</strong>
          </div>
        </div>
      </header>

      <section className="combat-stage__spotlight">
        <div className="combat-stage__focus-card">
          <div className="combat-stage__focus-header">
            <div>
              <div className="combat-stage__section-label">Selected Threat</div>
              <h4 className="combat-stage__focus-name">
                {selectedEnemyData?.name || "No target locked"}
              </h4>
            </div>
            <div className="combat-stage__focus-level">
              {selectedEnemyData ? `Lvl ${selectedEnemyData.level || 1}` : "Stand by"}
            </div>
          </div>

          <div className="combat-stage__focus-meter">
            <div className="combat-stage__meterbar">
              <div
                className="combat-stage__meterfill"
                style={{
                  width: `${toPercent(
                    selectedEnemyData?.stats?.hp?.current ?? 0,
                    selectedEnemyData?.stats?.hp?.max ?? 0,
                  )}%`,
                }}
              />
            </div>
            <div className="combat-stage__meter-label">
              HP {selectedEnemyData?.stats?.hp?.current ?? 0}/
              {selectedEnemyData?.stats?.hp?.max ?? 0}
            </div>
          </div>

          <div className="combat-stage__focus-grid">
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Lane</span>
              <strong>{selectedEnemyLane}</strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Pressure</span>
              <strong>{leadPressure}</strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Telegraphs</span>
              <strong>{selectedTelegraphs.length || telegraphs.length}</strong>
            </div>
            <div className="combat-stage__status-card combat-stage__status-card--inline">
              <span>Last event</span>
              <strong>{latestEvent}</strong>
            </div>
          </div>
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
                  style={{ width: `${playerHpPercent}%` }}
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
                  style={{ width: `${playerMpPercent}%` }}
                />
              </div>
            </div>
            <div className="combat-stage__player-stat">
              <span>Stance</span>
              <strong>{activeStance}</strong>
            </div>
            <div className="combat-stage__player-stat">
              <span>Action cue</span>
              <strong>{isPlayerTurn ? "Commit an action" : "Read incoming pressure"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="combat-stage__panel">
        <div className="combat-stage__panel-header">
          <div className="combat-stage__section-label">Threat Roster</div>
          <p className="combat-stage__section-copy">
            Select a target to update your strike focus and pressure readout.
          </p>
        </div>
        <div className="combat-stage__enemy-grid">
          {livingEnemies.map(({ enemy, index }) => {
            const hpPercentage = toPercent(
              enemy?.stats?.hp?.current ?? 0,
              enemy?.stats?.hp?.max ?? 0,
            );
            const isSelected = index === selectedEnemyIndex;

            return (
              <button
                key={`${enemy.id || "enemy"}-${index}`}
                type="button"
                className={`combat-stage__enemy-card ${
                  isSelected ? "combat-stage__enemy-card--selected" : ""
                }`}
                onClick={() => setSelectedEnemyIndex(index)}
              >
                <div className="combat-stage__enemy-head">
                  <span>{enemy.name}</span>
                  <strong>Lvl {enemy.level}</strong>
                </div>
                <div className="combat-stage__enemy-meta">
                  HP {enemy?.stats?.hp?.current ?? 0}/{enemy?.stats?.hp?.max ?? 0}
                </div>
                <div className="combat-stage__enemy-meta">
                  Lane{" "}
                  {Number.isFinite(combat?.lanes?.enemies?.[index])
                    ? combat.lanes.enemies[index]
                    : enemy.lane ?? 1}
                </div>
                <div className="combat-stage__meterbar">
                  <div
                    className="combat-stage__meterfill"
                    style={{ width: `${hpPercentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="combat-stage__battle-grid">
        <section className="combat-stage__panel">
          <div className="combat-stage__panel-header">
            <div className="combat-stage__section-label">Action Dock</div>
            <p className="combat-stage__section-copy">
              Your fastest route from target lock to committed move.
            </p>
          </div>

          <div className="combat-stage__core-actions">
            <button
              type="button"
              className="holo-button holo-button--solid"
              onClick={() => onAttack(resolvedEnemyIndex)}
            >
              Strike {selectedEnemyData?.name || "Target"}
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
                {availableSkills.slice(0, 4).map((skill) => {
                  const remainingCooldown = skillCooldowns?.[skill.id] || 0;
                  const disabled = remainingCooldown > 0;

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      className="combat-stage__skill-chip"
                      onClick={() => onUseSkill(skill.id, resolvedEnemyIndex)}
                      disabled={disabled}
                      title={
                        disabled
                          ? `${skill.name} is on cooldown (${remainingCooldown} turn(s) remaining)`
                          : skill.description || skill.name
                      }
                    >
                      <span>{skill.name}</span>
                      <strong>
                        {skill.manaCost ?? skill.cost?.mana ?? 0} MP
                        {disabled ? ` | CD ${remainingCooldown}` : ""}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {typeof onSetCombatStance === "function" ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Stance Control</div>
              <div className="combat-stage__lane-row">
                {["open", "focused", "guarded"].map((stance) => {
                  const isActive = stance === activeStance;
                  return (
                    <button
                      key={stance}
                      type="button"
                      className={`combat-stage__lane-chip ${
                        isActive ? "combat-stage__lane-chip--active" : ""
                      }`}
                      onClick={() => onSetCombatStance(stance)}
                      disabled={isActive}
                      title={
                        isActive
                          ? `${stance} stance is already active.`
                          : `Shift into ${stance} stance.`
                      }
                    >
                      {stance.charAt(0).toUpperCase() + stance.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {typeof onSetCombatLane === "function" ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Lane Control</div>
              <div className="combat-stage__lane-row">
                {laneNumbers.map((laneNumber) => {
                  const isActiveLane = laneNumber === playerLane;
                  return (
                    <button
                      key={`lane-${laneNumber}`}
                      type="button"
                      className={`combat-stage__lane-chip ${
                        isActiveLane ? "combat-stage__lane-chip--active" : ""
                      }`}
                      onClick={() => onSetCombatLane(laneNumber)}
                      disabled={laneControlsDisabled || isActiveLane}
                      title={
                        isActiveLane
                          ? `Already in lane ${laneNumber}`
                          : laneControlsDisabled
                            ? "You can only reposition on your turn."
                            : `Shift to lane ${laneNumber}.`
                      }
                    >
                      Lane {laneNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="combat-stage__ability-tray">
            {player && onUseClassAbility ? (
              <ClassAbilities
                player={player}
                onUseAbility={onUseClassAbility}
                cooldowns={combat?.classAbilityCooldowns || {}}
              />
            ) : null}

            {player && onUseRaceAbility ? (
              <RaceAbilities
                player={player}
                onUseAbility={onUseRaceAbility}
                cooldowns={combat?.raceAbilityCooldowns || {}}
              />
            ) : null}
          </div>
        </section>

        <section className="combat-stage__panel">
          <div className="combat-stage__panel-header">
            <div className="combat-stage__section-label">Battlefield Read</div>
            <p className="combat-stage__section-copy">
              Terrain, warnings, and sustain tools that shape the next decision.
            </p>
          </div>

          {arenaTags.length ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Arena State</div>
              <div className="combat-stage__skill-row">
                {arenaTags.map((tag) => (
                  <div key={tag} className="combat-stage__skill-chip" aria-hidden="true">
                    <span>{String(tag).replace(/[-_]/g, " ")}</span>
                    <strong>terrain</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {telegraphs.length ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Incoming Telegraphs</div>
              <div className="combat-stage__skill-row">
                {telegraphs.map((telegraph) => (
                  <div
                    key={telegraph?.id || `${telegraph?.enemyName}-${telegraph?.label}`}
                    className="combat-stage__skill-chip"
                  >
                    <span>
                      {normalizeTextValue(telegraph?.enemyName, "Enemy")}:{" "}
                      {normalizeTextValue(telegraph?.label, "Incoming pattern")}
                    </span>
                    <strong>
                      {normalizeTextValue(
                        telegraph?.counterText || telegraph?.pressure,
                        "react",
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tacticalVerbs.length ? (
            <div className="combat-stage__control-block">
              <div className="combat-stage__section-label">Tactical Verbs</div>
              <div className="combat-stage__skill-row">
                {tacticalVerbs.map((verb) => (
                  <div key={verb?.id || verb?.label} className="combat-stage__skill-chip">
                    <span>{normalizeTextValue(verb?.label, "Tactical verb")}</span>
                    <strong>{normalizeTextValue(verb?.reason || verb?.source, "build")}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
