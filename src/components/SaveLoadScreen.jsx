// SaveLoadScreen.jsx
// Full-screen save/load interface shown after login
import React, { useState, useEffect } from 'react';
import SaveLoadUI from './SaveLoadUI';

export default function SaveLoadScreen({ 
  saveGame, 
  loadGame, 
  getSavesList, 
  deleteSave, 
  isSaving, 
  lastSaveTime,
  currentUserId,
  onLoadComplete,
  onNewGame
}) {
  const [saves, setSaves] = useState([]);
  const [loadingSaves, setLoadingSaves] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUserId) {
      loadSavesList();
    }
  }, [currentUserId]);

  const loadSavesList = async () => {
    setLoadingSaves(true);
    setError(null);
    try {
      const result = await getSavesList();
      if (result.success) {
        setSaves(result.saves || []);
      } else {
        setError(result.error || 'Failed to load saves');
      }
    } catch (err) {
      setError(err.message || 'Failed to load saves');
    } finally {
      setLoadingSaves(false);
    }
  };

  const handleLoad = async (saveId) => {
    setError(null);
    const result = await loadGame(saveId);
    
    if (result.success) {
      // Notify parent that a save was loaded
      // The game state is already updated by loadGame in useGameEngine
      if (onLoadComplete) {
        onLoadComplete();
      }
    } else {
      setError(result.error || 'Failed to load game');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-deep)',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        width: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid var(--holo-cyan)',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)'
      }}>
        <h2 style={{ 
          fontFamily: 'var(--font-hud)', 
          fontSize: '2rem', 
          marginBottom: '1rem',
          color: 'var(--holo-cyan)',
          textAlign: 'center'
        }}>
          Save/Load Game
        </h2>

        {error && (
          <div style={{ 
            color: 'var(--holo-alert)', 
            fontSize: '0.9rem', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loadingSaves ? (
          <p style={{ textAlign: 'center', color: 'var(--holo-cyan)' }}>Loading saves...</p>
        ) : (
          <>
            {saves.length === 0 ? (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>No saves found</p>
                <button
                  className="holo-button"
                  onClick={onNewGame}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem'
                  }}
                >
                  Start New Game
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontFamily: 'var(--font-hud)', 
                  fontSize: '1.3rem', 
                  marginBottom: '1rem',
                  color: 'var(--holo-cyan)'
                }}>
                  Your Saves:
                </h3>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  marginBottom: '1rem' 
                }}>
                  {saves.map((save) => (
                    <div
                      key={save.id}
                      onClick={() => handleLoad(save.id)}
                      style={{
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        background: 'rgba(0, 243, 255, 0.1)',
                        border: '1px solid var(--holo-cyan)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 243, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold',
                            color: 'var(--text-main)',
                            marginBottom: '0.25rem'
                          }}>
                            {save.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--holo-cyan)' 
                          }}>
                            {new Date(save.updated_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="holo-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this save?')) {
                              deleteSave(save.id).then(() => {
                                loadSavesList();
                              });
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            borderColor: 'var(--holo-alert)',
                            color: 'var(--holo-alert)'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center' 
            }}>
              {saves.length > 0 && (
                <button
                  className="holo-button"
                  onClick={onNewGame}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem'
                  }}
                >
                  Start New Game
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
