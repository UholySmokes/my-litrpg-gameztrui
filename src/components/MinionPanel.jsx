// MinionPanel.jsx
// Displays active pets, demons, undead minions, and totems
import React from 'react';

/**
 * Pet card component (Ranger)
 */
function PetCard({ pet }) {
  if (!pet) return null;
  
  const hpPercent = (pet.stats.hp.current / pet.stats.hp.max) * 100;
  
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(0,100,0,0.2)',
      border: '1px solid #44aa44',
      borderRadius: '4px',
      marginBottom: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ color: '#44aa44', fontWeight: 'bold' }}>
          🐾 {pet.name}
        </span>
        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
          {pet.stats.hp.current}/{pet.stats.hp.max} HP
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${hpPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #44aa44, #88ff88)',
          transition: 'width 0.3s'
        }} />
      </div>
      {pet.abilities && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Abilities: {pet.abilities.join(', ')}
        </div>
      )}
    </div>
  );
}

/**
 * Demon card component (Warlock)
 */
function DemonCard({ demon }) {
  if (!demon) return null;
  
  const hpPercent = (demon.stats.hp.current / demon.stats.hp.max) * 100;
  
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(100,0,100,0.2)',
      border: '1px solid #aa44aa',
      borderRadius: '4px',
      marginBottom: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ color: '#aa44aa', fontWeight: 'bold' }}>
          👹 {demon.name}
        </span>
        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
          {demon.stats.hp.current}/{demon.stats.hp.max} HP
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${hpPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #aa44aa, #ff44ff)',
          transition: 'width 0.3s'
        }} />
      </div>
      {demon.duration && (
        <div style={{ fontSize: '0.75rem', color: '#ff88ff', marginTop: '0.25rem' }}>
          Duration: {demon.duration} turns
        </div>
      )}
    </div>
  );
}

/**
 * Undead card component (Necromancer)
 */
function UndeadCard({ undead }) {
  if (!undead) return null;
  
  const hpPercent = (undead.stats.hp.current / undead.stats.hp.max) * 100;
  
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(50,50,50,0.3)',
      border: '1px solid #88aa88',
      borderRadius: '4px',
      marginBottom: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ color: '#88aa88', fontWeight: 'bold' }}>
          💀 {undead.name}
        </span>
        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
          {undead.stats.hp.current}/{undead.stats.hp.max} HP
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${hpPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #445544, #88aa88)',
          transition: 'width 0.3s'
        }} />
      </div>
    </div>
  );
}

/**
 * Totem card component (Shaman)
 */
function TotemCard({ totem }) {
  if (!totem) return null;
  
  const elementColors = {
    fire: '#ff4400',
    water: '#0088ff',
    earth: '#886600',
    air: '#aaccff'
  };
  
  const color = elementColors[totem.element] || '#44ddaa';
  
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(0,50,50,0.2)',
      border: `1px solid ${color}`,
      borderRadius: '4px',
      marginBottom: '0.5rem',
      minWidth: '100px'
    }}>
      <div style={{ color, fontWeight: 'bold', fontSize: '0.85rem' }}>
        🪶 {totem.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {totem.element} • {totem.duration} turns
      </div>
    </div>
  );
}

/**
 * Trap card component (Ranger)
 */
function TrapCard({ trap }) {
  if (!trap) return null;
  
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(100,50,0,0.2)',
      border: '1px solid #ff8844',
      borderRadius: '4px',
      marginBottom: '0.5rem',
      minWidth: '100px'
    }}>
      <div style={{ color: '#ff8844', fontWeight: 'bold', fontSize: '0.85rem' }}>
        🪤 {trap.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {trap.armed ? 'Armed' : 'Triggered'}
      </div>
    </div>
  );
}

/**
 * Main MinionPanel component
 */
export default function MinionPanel({ player }) {
  if (!player) return null;
  
  const pet = player.activePet;
  const demon = player.activeDemon;
  const undead = player.undead || [];
  const totems = player.totems || [];
  const traps = player.traps || [];
  const corpses = player.corpses || [];
  
  const hasMinions = pet || demon || undead.length > 0 || totems.length > 0 || traps.length > 0;
  
  if (!hasMinions) return null;
  
  return (
    <div style={{
      marginBottom: '1rem',
      padding: '0.5rem',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '4px',
      border: '1px solid var(--holo-cyan)'
    }}>
      <div style={{ 
        color: 'var(--holo-cyan)', 
        fontWeight: 'bold', 
        marginBottom: '0.5rem',
        fontSize: '0.9rem'
      }}>
        Companions & Summons:
      </div>
      
      {/* Pet */}
      {pet && <PetCard pet={pet} />}
      
      {/* Demon */}
      {demon && <DemonCard demon={demon} />}
      
      {/* Undead */}
      {undead.length > 0 && (
        <div>
          {undead.map((u, i) => <UndeadCard key={u.id || i} undead={u} />)}
        </div>
      )}
      
      {/* Totems */}
      {totems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {totems.map((t, i) => <TotemCard key={t.id || i} totem={t} />)}
        </div>
      )}
      
      {/* Traps */}
      {traps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {traps.map((t, i) => <TrapCard key={t.id || i} trap={t} />)}
        </div>
      )}
      
      {/* Corpses (for Necromancer) */}
      {corpses.length > 0 && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#88aa88', 
          marginTop: '0.5rem',
          padding: '0.25rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px'
        }}>
          💀 Corpses available: {corpses.length}
        </div>
      )}
    </div>
  );
}
