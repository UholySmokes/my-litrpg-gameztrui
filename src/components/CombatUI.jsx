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

  return (
    <div className="combat-stage">
      <div className="combat-stage__header">
        <div>
          <div className="combat-stage__eyebrow">Encounter</div>
          <h3 className="combat-stage__title">Active Combat</h3>
        </div>
        <div className="combat-stage__lane">
          <span>Lane</span>
          <strong>{Number.isFinite(playerLane) ? playerLane : 1}</strong>
        </div>
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

      <div className="combat-stage__core-actions">
        <button
          type="button"
          className="holo-button holo-button--solid"
          onClick={() => onAttack(resolvedEnemyIndex)}
        >
          Strike {selectedEnemy?.enemy?.name || "Target"}
        </button>

        <button
          type="button"
          className="holo-button holo-button--danger"
          onClick={onEscape}
        >
          Attempt Escape
        </button>
      </div>

      {typeof onSetCombatStance === "function" ? (
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
      ) : null}

      {arenaTags.length ? (
        <div className="combat-stage__skill-row">
          {arenaTags.map((tag) => (
            <div key={tag} className="combat-stage__skill-chip" aria-hidden="true">
              <span>{String(tag).replace(/[-_]/g, " ")}</span>
              <strong>terrain</strong>
            </div>
          ))}
        </div>
      ) : null}

      {telegraphs.length ? (
        <div className="combat-stage__skill-row">
          {telegraphs.map((telegraph) => (
            <div
              key={telegraph?.id || `${telegraph?.enemyName}-${telegraph?.label}`}
              className="combat-stage__skill-chip"
            >
              <span>
                {telegraph?.enemyName || "Enemy"}: {telegraph?.label || "Incoming pattern"}
              </span>
              <strong>{telegraph?.counterText || telegraph?.pressure || "react"}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {tacticalVerbs.length ? (
        <div className="combat-stage__skill-row">
          {tacticalVerbs.map((verb) => (
            <div key={verb?.id || verb?.label} className="combat-stage__skill-chip">
              <span>{verb?.label || "Tactical verb"}</span>
              <strong>{verb?.reason || verb?.source || "build"}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {availableSkills.length > 0 ? (
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
      ) : null}

      {typeof onSetCombatLane === "function" ? (
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
      ) : null}

      {player ? <ClassResourceBar player={player} /> : null}

      <div className="combat-stage__support-grid">
        {player ? <StatusEffects player={player} /> : null}
        {player ? <MinionPanel player={player} /> : null}
      </div>

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

      <CombatLog entries={combat?.log || []} />
    </div>
  );
}
