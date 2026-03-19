export default function SkillPicker({
  skills = [],
  onSelectSkill,
  onClose,
  disabled = false,
  combatReady = false,
}) {
  return (
    <section className="command-deck__picker" aria-label="Skill picker">
      <div className="command-deck__picker-header">
        <div>
          <div className="command-deck__picker-title">Skill Picker</div>
          <div className="command-deck__picker-subtitle">
            {combatReady
              ? "Pick a skill to use on the current fight."
              : "Skills are shown here, but combat is not active."}
          </div>
        </div>
        <button type="button" className="holo-button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="command-deck__picker-list">
        {skills.length === 0 ? (
          <div className="command-deck__picker-empty">No active skills available.</div>
        ) : (
          skills.map((skill) => {
            const manaCost = Number.isFinite(skill.manaCost) ? skill.manaCost : 0;
            const entryDisabled = disabled || !combatReady;
            return (
              <button
                key={skill.id}
                type="button"
                className="command-deck__picker-item holo-button"
                onClick={() => onSelectSkill?.(skill)}
                disabled={entryDisabled}
                title={skill.description || skill.name}
              >
                <span className="command-deck__picker-item-name">{skill.name}</span>
                <span className="command-deck__picker-item-meta">
                  {manaCost} MP
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

