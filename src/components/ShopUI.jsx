// ShopUI.jsx
import React, { useState } from 'react';
import { getShopItemsByCategory } from '../lib/shopData';

export default function ShopUI({ isOpen, onClose, gameState, onPurchase }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  if (!isOpen) return null;
  
  const items = getShopItemsByCategory(selectedCategory);
  const currency = gameState.player.currency || { goldCoins: 0, soulpoints: 0 };
  
  const handlePurchase = (item) => {
    onPurchase(item);
  };
  
  const canAfford = (item) => {
    if (item.price.goldCoins && currency.goldCoins < item.price.goldCoins) return false;
    if (item.price.soulpoints && currency.soulpoints < item.price.soulpoints) return false;
    return true;
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="holo-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--holo-cyan)', margin: 0 }}>[SHOP]</h2>
            <button className="holo-button" onClick={onClose} style={{ borderColor: 'var(--holo-alert)', color: 'var(--holo-alert)' }}>
              Close
            </button>
          </div>
          
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-main)', marginRight: '1rem' }}>
              Gold: <span style={{ color: 'var(--holo-gold)' }}>{currency.goldCoins}</span> | 
              Soulpoints: <span style={{ color: 'var(--holo-cyan)' }}>{currency.soulpoints}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'items', 'skills', 'upgrades', 'materials', 'services'].map(cat => (
              <button
                key={cat}
                className="holo-button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: selectedCategory === cat ? 'rgba(0, 243, 255, 0.2)' : 'transparent',
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {items.map(item => {
              const affordable = canAfford(item);
              const priceText = item.price.goldCoins 
                ? `${item.price.goldCoins} Gold`
                : `${item.price.soulpoints} Soulpoints`;
              
              return (
                <div key={item.id} className="holo-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--holo-cyan)', marginBottom: '0.5rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem', minHeight: '40px' }}>
                    {item.description}
                  </div>
                  <div style={{ color: 'var(--holo-gold)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {priceText}
                  </div>
                  <button
                    className="holo-button"
                    onClick={() => handlePurchase(item)}
                    disabled={!affordable}
                    style={{
                      width: '100%',
                      opacity: affordable ? 1 : 0.5,
                      cursor: affordable ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {affordable ? 'Purchase' : 'Cannot Afford'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
