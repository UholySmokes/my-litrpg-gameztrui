import React, { useEffect, useMemo, useState } from "react";
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
}) {
  const combat = combatState;
  const player = playerState;
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);

  const livingEnemies = useMemo(
    () =>
      (combat?.enemies || [])
        .map((enemy, index) => ({ enemy, index }))
        .filter(({ enemy }) => (enemy?.stats?.hp?.current || 0) > 0),
    [combat?.enemies],
  );

  useEffect(() => {
    if (!livingEnemies.some(({ index }) => index === selectedEnemyIndex)) {
      setSelectedEnemyIndex(livingEnemies[0]?.index ?? 0);
    }
  }, [livingEnemies, selectedEnemyIndex]);

  const selectedEnemy = livingEnemies.find(({ index }) => index === selectedEnemyIndex);
  const availableSkills =
    player?.activeSkills?.length
      ? player.activeSkills
      : player?.skills?.active ||
        (player?.abilities || []).filter((ability) => ability.type === "active") ||
        [];
  const skillCooldowns = combat.skillCooldowns || {};
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

  if (!combat || combat.status !== "active") {
    return null;
  }

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
          onClick={() => onAttack(selectedEnemy?.index ?? 0)}
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
                onClick={() => onUseSkill(skill.id, selectedEnemy?.index ?? 0)}
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
