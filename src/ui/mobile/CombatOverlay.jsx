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
  onMoveSkirmishUnit,
  onSelectSkirmishTarget,
  onSelectSkirmishUnit,
  onUseSkill,
  onUseClassAbility,
  onUseItem,
  onUseRaceAbility,
  onWait,
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
          onMoveSkirmishUnit={onMoveSkirmishUnit}
          onSelectSkirmishTarget={onSelectSkirmishTarget}
          onSelectSkirmishUnit={onSelectSkirmishUnit}
          onUseSkill={onUseSkill}
          onUseClassAbility={onUseClassAbility}
          onUseItem={onUseItem}
          onUseRaceAbility={onUseRaceAbility}
          onWait={onWait}
          onEscape={onEscape}
          onSetCombatLane={onSetCombatLane}
        />
      </div>
    </div>
  );
}
