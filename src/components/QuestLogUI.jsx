// QuestLogUI.jsx
import React, { useState } from 'react';

export default function QuestLogUI({ isOpen, onClose, gameState }) {
  const [activeTab, setActiveTab] = useState('active');
  
  if (!isOpen) return null;
  
  const activeQuests = gameState.quests?.active || [];
  const completedQuests = gameState.quests?.completed || [];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="holo-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--holo-cyan)', margin: 0 }}>[QUEST LOG]</h2>
            <button className="holo-button" onClick={onClose} style={{ borderColor: 'var(--holo-alert)', color: 'var(--holo-alert)' }}>
              Close
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className="holo-button"
              onClick={() => setActiveTab('active')}
              style={{
                backgroundColor: activeTab === 'active' ? 'rgba(0, 243, 255, 0.2)' : 'transparent'
              }}
            >
              Active ({activeQuests.length})
            </button>
            <button
              className="holo-button"
              onClick={() => setActiveTab('completed')}
              style={{
                backgroundColor: activeTab === 'completed' ? 'rgba(0, 243, 255, 0.2)' : 'transparent'
              }}
            >
              Completed ({completedQuests.length})
            </button>
          </div>
          
          <div>
            {activeTab === 'active' ? (
              activeQuests.length > 0 ? (
                activeQuests.map(quest => (
                  <div key={quest.id} className="holo-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                      {quest.name}
                    </div>
                    <div style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                      {quest.description}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ color: 'var(--holo-gold)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        Objectives:
                      </div>
                      {quest.objectives?.map(obj => (
                        <div 
                          key={obj.id} 
                          style={{ 
                            color: obj.completed ? 'var(--holo-cyan)' : 'var(--text-main)',
                            textDecoration: obj.completed ? 'line-through' : 'none',
                            marginLeft: '1rem',
                            marginBottom: '0.25rem'
                          }}
                        >
                          {obj.completed ? '✓' : '○'} {obj.description}
                        </div>
                      ))}
                    </div>
                    {quest.rewards && (
                      <div style={{ color: 'var(--holo-gold)', fontSize: '0.9rem' }}>
                        Rewards: {quest.rewards.xp} XP
                        {quest.rewards.items?.length > 0 && `, ${quest.rewards.items.length} item(s)`}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '2rem' }}>
                  No active quests
                </div>
              )
            ) : (
              completedQuests.length > 0 ? (
                completedQuests.map(quest => (
                  <div key={quest.id} className="holo-panel" style={{ padding: '1rem', marginBottom: '1rem', opacity: 0.7 }}>
                    <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {quest.name} ✓
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {quest.description}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '2rem' }}>
                  No completed quests
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
