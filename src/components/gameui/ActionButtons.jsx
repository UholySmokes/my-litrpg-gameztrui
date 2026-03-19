export default function ActionButtons({
  onAttack,
  onRest,
  onEscape,
  attackDisabled = false,
  restDisabled = false,
  escapeDisabled = false,
  isCombatActive = false,
}) {
  return (
    <div className="command-deck__action-buttons" aria-label="Core actions">
      <button
        type="button"
        className="holo-button holo-button--solid command-deck__action-button command-deck__action-button--attack"
        onClick={onAttack}
        disabled={attackDisabled}
        title={isCombatActive ? "Attack the current foe." : "Open combat and attack."}
      >
        Attack
      </button>
      <button
        type="button"
        className="holo-button command-deck__action-button command-deck__action-button--rest"
        onClick={onRest}
        disabled={restDisabled}
        title="Rest and recover health and mana."
      >
        Rest
      </button>
      <button
        type="button"
        className="holo-button holo-button--danger command-deck__action-button command-deck__action-button--escape"
        onClick={onEscape}
        disabled={escapeDisabled}
        title={isCombatActive ? "Attempt to flee combat." : "Escape is only available during combat."}
      >
        Escape
      </button>
    </div>
  );
}

