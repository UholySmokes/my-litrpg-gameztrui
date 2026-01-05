// CombatUI.jsx
import React from 'react';

export default function CombatUI({ combat, onAttack, onUseSkill, onEscape, playerAbilities }) {
  if (!combat || combat.status !== 'active') {
    return null;
  }

  const aliveEnemies = combat.enemies.filter(e => e.stats.hp.current > 0);
  const availableSkills = playerAbilities?.filter(a => a.type === 'active') || [];

  return (
    <div className="holo-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
      <div style={{ color: 'var(--holo-alert)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
        [COMBAT]
      </div>
      
      {/* Enemies */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Enemies:
        </div>
        {aliveEnemies.map((enemy, index) => {
          const originalIndex = combat.enemies.findIndex(e => e.id === enemy.id && e.stats.hp.current > 0);
          const hpPercentage = (enemy.stats.hp.current / enemy.stats.hp.max) * 100;
          
          return (
            <div key={enemy.id || index} style={{ marginBottom: '0.75rem', padding: '0.5rem', border: '1px solid var(--holo-cyan)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>
                  {enemy.name} (Lvl {enemy.level})
                </span>
                <span style={{ color: 'var(--text-main)' }}>
                  HP: {enemy.stats.hp.current}/{enemy.stats.hp.max}
                </span>
              </div>
              <div className="health-bar-container" style={{ marginBottom: '0.5rem' }}>
                <div className="health-bar">
                  <div 
                    className="health-bar-fill" 
                    style={{ 
                      width: `${hpPercentage}%`,
                      background: hpPercentage < 30 
                        ? 'linear-gradient(90deg, var(--holo-alert), #ff6b9d)' 
                        : 'linear-gradient(90deg, var(--holo-alert), var(--holo-cyan))'
                    }}
                  ></div>
                </div>
              </div>
              <button
                className="holo-button"
                onClick={() => onAttack(originalIndex)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                Attack {enemy.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Combat Log */}
      <div style={{ marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
        <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Combat Log:
        </div>
        {combat.log.slice(-10).map((logEntry, index) => (
          <div key={index} style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            {logEntry}
          </div>
        ))}
      </div>

      {/* Skills */}
      {availableSkills.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Skills:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {availableSkills.slice(0, 4).map((skill) => (
              <button
                key={skill.id}
                className="holo-button"
                onClick={() => onUseSkill(skill.id, 0)} // Use on first enemy for now
                style={{ fontSize: '0.85rem', flex: '1 1 auto', minWidth: '120px' }}
              >
                {skill.name} (Cost: {skill.manaCost || 0} MP)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Escape Button */}
      <button
        className="holo-button"
        onClick={onEscape}
        style={{ 
          width: '100%', 
          borderColor: 'var(--holo-alert)', 
          color: 'var(--holo-alert)',
          fontSize: '0.9rem'
        }}
      >
        Attempt Escape
      </button>
    </div>
  );
}
