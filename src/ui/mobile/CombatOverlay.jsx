import React from "react";
import CombatUI from "../../components/CombatUI.jsx";
import MobileStatBar from "./MobileStatBar.jsx";

/**
 * Full-screen combat overlay for mobile layout.
 * Slides up when combat is active, renders CombatUI inside mobile-friendly container.
 */
export default function CombatOverlay({
  player,
  config,
  combatState,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onUseRaceAbility,
  onEscape,
  onSetCombatLane,
}) {
  if (!combatState?.active) return null;

  return (
    <div className="mobile-combat-overlay">
      <div className="mobile-combat-overlay__header">
        <MobileStatBar player={player} config={config} />
      </div>
      <div className="mobile-combat-overlay__body">
        <CombatUI
          playerState={player}
          combatState={combatState}
          onAttack={onAttack}
          onUseSkill={onUseSkill}
          onUseClassAbility={onUseClassAbility}
          onUseRaceAbility={onUseRaceAbility}
          onEscape={onEscape}
          onSetCombatLane={onSetCombatLane}
        />
      </div>
    </div>
  );
}
