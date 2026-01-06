// GachaUI.jsx
import React, { useState } from 'react';
import { gachaPools, calculateGachaResult } from '../data/gachaData.js';

const rarityColors = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000'
};

export default function GachaUI({ isOpen, onClose, gameState, onPull }) {
  const [selectedPool, setSelectedPool] = useState('equipment');
  const [lastResults, setLastResults] = useState([]);
  
  if (!isOpen) return null;
  
  const pool = gachaPools[selectedPool];
  const currency = gameState.player.currency || { goldCoins: 0, soulpoints: 0 };
  
  const canAfford = () => {
    if (pool.cost.goldCoins && currency.goldCoins < pool.cost.goldCoins) return false;
    if (pool.cost.soulpoints && currency.soulpoints < pool.cost.soulpoints) return false;
    return true;
  };
  
  const handlePull = () => {
    if (!canAfford()) return;
    
    const results = calculateGachaResult(selectedPool, pool.pullCount);
    setLastResults(results);
    onPull(selectedPool, results);
  };
  
  const priceText = pool.cost.goldCoins 
    ? `${pool.cost.goldCoins} Gold`
    : `${pool.cost.soulpoints} Soulpoints`;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="holo-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--holo-cyan)', margin: 0 }}>[GACHA]</h2>
            <button className="holo-button" onClick={onClose} style={{ borderColor: 'var(--holo-alert)', color: 'var(--holo-alert)' }}>
              Close
            </button>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Gold: <span style={{ color: 'var(--holo-gold)' }}>{currency.goldCoins}</span> | 
              Soulpoints: <span style={{ color: 'var(--holo-cyan)' }}>{currency.soulpoints}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {Object.keys(gachaPools).map(poolId => (
              <button
                key={poolId}
                className="holo-button"
                onClick={() => {
                  setSelectedPool(poolId);
                  setLastResults([]);
                }}
                style={{
                  backgroundColor: selectedPool === poolId ? 'rgba(0, 243, 255, 0.2)' : 'transparent',
                  textTransform: 'capitalize'
                }}
              >
                {gachaPools[poolId].name}
              </button>
            ))}
          </div>
          
          <div className="holo-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {pool.name}
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {pool.description}
            </div>
            <div style={{ color: 'var(--holo-gold)', marginBottom: '1rem' }}>
              Cost: {priceText}
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div>Rates:</div>
              {Object.entries(pool.rarityRates).map(([rarity, rate]) => (
                <div key={rarity} style={{ color: rarityColors[rarity] }}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}: {(rate * 100).toFixed(1)}%
                </div>
              ))}
            </div>
            <button
              className="holo-button"
              onClick={handlePull}
              disabled={!canAfford()}
              style={{
                width: '100%',
                fontSize: '1.1rem',
                padding: '0.75rem',
                opacity: canAfford() ? 1 : 0.5,
                cursor: canAfford() ? 'pointer' : 'not-allowed'
              }}
            >
              {canAfford() ? 'Pull!' : 'Cannot Afford'}
            </button>
          </div>
          
          {lastResults.length > 0 && (
            <div className="holo-panel" style={{ padding: '1rem' }}>
              <div style={{ color: 'var(--holo-cyan)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Results:
              </div>
              {lastResults.map((result, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '0.5rem', 
                    marginBottom: '0.5rem', 
                    border: `2px solid ${rarityColors[result.rarity]}`,
                    borderRadius: '4px',
                    color: rarityColors[result.rarity],
                    fontWeight: 'bold'
                  }}
                >
                  {result.name} ({result.rarity.toUpperCase()})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
