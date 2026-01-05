// SaveLoadUI.jsx
import React, { useState, useEffect } from 'react';

export default function SaveLoadUI({ 
  saveGame, 
  loadGame, 
  getSavesList, 
  deleteSave, 
  isSaving, 
  lastSaveTime,
  currentUserId 
}) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saves, setSaves] = useState([]);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [error, setError] = useState(null);

  // Load saves list when dialog opens
  useEffect(() => {
    if (showLoadDialog && currentUserId) {
      loadSavesList();
    }
  }, [showLoadDialog, currentUserId]);

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

  const handleSave = async () => {
    if (!saveName.trim()) {
      setError('Please enter a save name');
      return;
    }

    setError(null);
    const result = await saveGame(saveName.trim());
    
    if (result.success) {
      setShowSaveDialog(false);
      setSaveName('');
    } else {
      setError(result.error || 'Failed to save game');
    }
  };

  const handleLoad = async (saveId) => {
    setError(null);
    const result = await loadGame(saveId);
    
    if (result.success) {
      setShowLoadDialog(false);
    } else {
      setError(result.error || 'Failed to load game');
    }
  };

  const handleDelete = async (saveId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this save?')) {
      return;
    }

    setError(null);
    try {
      const result = await deleteSave(saveId);
      
      if (result.success) {
        loadSavesList(); // Refresh the list
      } else {
        setError(result.error || 'Failed to delete save');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete save');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!currentUserId) {
    return (
      <div className="holo-panel" style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--holo-cyan)', textAlign: 'center' }}>
          Sign in to enable save/load functionality
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Save/Load Buttons */}
      <div className="holo-panel" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            className="holo-button"
            onClick={() => setShowSaveDialog(true)}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            {isSaving ? 'Saving...' : 'Save Game'}
          </button>
          <button
            className="holo-button"
            onClick={() => setShowLoadDialog(true)}
            style={{ flex: 1 }}
          >
            Load Game
          </button>
        </div>
        {lastSaveTime && (
          <div style={{ fontSize: '0.75rem', color: 'var(--holo-cyan)', textAlign: 'center' }}>
            Last saved: {formatDate(lastSaveTime)}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="game-over" style={{ zIndex: 2000 }}>
          <h2 style={{ marginBottom: '1rem' }}>Save Game</h2>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Save name (e.g., Before Boss Fight)"
            className="holo-input"
            style={{
              width: '100%',
              marginBottom: '1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--holo-cyan)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-text)',
              fontSize: '1rem',
              padding: '0.75rem',
              outline: 'none'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            autoFocus
          />
          {error && (
            <div style={{ color: 'var(--holo-alert)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="holo-button"
              onClick={handleSave}
              style={{ flex: 1 }}
            >
              Save
            </button>
            <button
              className="holo-button"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
                setError(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="game-over" style={{ zIndex: 2000, maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Load Game</h2>
          
          {loadingSaves ? (
            <p style={{ textAlign: 'center', color: 'var(--holo-cyan)' }}>Loading saves...</p>
          ) : saves.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-main)' }}>No saves found</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {save.save_name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--holo-cyan)' }}>
                        Updated: {formatDate(save.updated_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(save.id, e)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--holo-alert)',
                        color: 'var(--holo-alert)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--holo-alert)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <button
            className="holo-button"
            onClick={() => {
              setShowLoadDialog(false);
              setError(null);
            }}
            style={{ width: '100%' }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
