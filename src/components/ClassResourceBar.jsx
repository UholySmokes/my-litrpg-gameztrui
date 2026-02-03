// ClassResourceBar.jsx
// Displays class-specific resource bars (Rage, Chi, Focus, Energy, Soul Shards, etc.)
import React from 'react';

/**
 * Get class resource info based on player class
 */
function getClassResource(player) {
  const classId = player.class?.id || player.class;
  const resources = player.resources || {};
  const rage = resources.rage ?? player.rage ?? 0;
  const chi = resources.chi ?? player.chi ?? 0;
  const focus = resources.focus ?? player.focus?.current ?? player.focus ?? 0;
  const energy = resources.energy ?? player.energy ?? 0;

  switch(classId) {
    case 'berserker':
    case 'bloodline_vanguard':
      return {
        type: 'rage',
        label: 'Rage',
        current: rage,
        max: 100,
        color: '#ff4444',
        gradient: 'linear-gradient(90deg, #ff4444, #ff8800)',
        icon: '🔥',
        extra: player.isEnraged ? 'ENRAGED!' : null
      };
    
    case 'monk':
    case 'grandmaster':
      return {
        type: 'chi',
        label: 'Chi',
        current: chi,
        max: 100,
        color: '#44ff88',
        gradient: 'linear-gradient(90deg, #44ff88, #88ffcc)',
        icon: '☯️',
        extra: player.comboCount > 0 ? `Combo: ${player.comboCount}x` : null
      };
    
    case 'archer':
    case 'ranger':
    case 'sniper':
    case 'gunslinger':
    case 'spellbreaker':
    case 'tinkerer':
    case 'system_hacker':
    case 'chrono_duelist':
    case 'beast_lord':
    case 'starbound_archer':
    case 'ironclad_engineer':
      return {
        type: 'focus',
        label: 'Focus',
        current: focus,
        max: player.focus?.max || 100,
        color: '#4488ff',
        gradient: 'linear-gradient(90deg, #4488ff, #88ccff)',
        icon: '🎯',
        extra: null
      };
    
    case 'rogue':
    case 'assassin':
    case 'master_thief':
    case 'shadowblade':
    case 'blade_dancer':
    case 'shadow_tactician':
    case 'void_marauder':
      return {
        type: 'energy',
        label: 'Energy',
        current: energy,
        max: player.maxEnergy || 100,
        color: '#ffff44',
        gradient: 'linear-gradient(90deg, #ffff44, #ffcc00)',
        icon: '⚡',
        extra: player.isStealthed ? 'STEALTHED' : null
      };
    
    case 'warlock':
    case 'demon_lord':
      return {
        type: 'shards',
        label: 'Soul Shards',
        current: player.soulShards || 0,
        max: 5,
        color: '#aa44ff',
        gradient: 'linear-gradient(90deg, #aa44ff, #ff44aa)',
        icon: '💎',
        extra: player.activeDemon ? `Demon: ${player.activeDemon.name}` : null
      };
    
    case 'battlemage':
    case 'spellblade':
      return {
        type: 'charges',
        label: 'Arcane Charges',
        current: player.arcaneCharges || 0,
        max: 5,
        color: '#44aaff',
        gradient: 'linear-gradient(90deg, #44aaff, #aa44ff)',
        icon: '✨',
        extra: player.weaponEnchantment ? player.weaponEnchantment.name : null
      };
    
    case 'warrior':
    case 'knight':
      return {
        type: 'stance',
        label: 'Stance',
        current: null,
        max: null,
        color: '#ff8844',
        gradient: null,
        icon: '⚔️',
        extra: player.currentStance ? player.currentStance.charAt(0).toUpperCase() + player.currentStance.slice(1) : 'Balanced'
      };
    
    case 'paladin':
    case 'divine_knight':
      return {
        type: 'aura',
        label: 'Aura',
        current: null,
        max: null,
        color: '#ffdd44',
        gradient: null,
        icon: '✝️',
        extra: player.activeAura ? player.activeAura.name : 'None'
      };
    
    case 'shaman':
    case 'spirit_walker':
      return {
        type: 'totems',
        label: 'Totems',
        current: (player.totems || []).length,
        max: 4,
        color: '#44ddaa',
        gradient: 'linear-gradient(90deg, #44ddaa, #88ffcc)',
        icon: '🪶',
        extra: null
      };
    
    case 'necromancer':
    case 'lich':
      return {
        type: 'undead',
        label: 'Undead',
        current: (player.undead || []).length,
        max: 4,
        color: '#88aa88',
        gradient: 'linear-gradient(90deg, #445544, #88aa88)',
        icon: '💀',
        extra: (player.corpses || []).length > 0 ? `Corpses: ${player.corpses.length}` : null
      };
    
    default:
      return null;
  }
}

/**
 * Render discrete resource (like soul shards)
 */
function DiscreteBar({ current, max, color, icon }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: i < current ? color : 'rgba(255,255,255,0.1)',
            border: `1px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            opacity: i < current ? 1 : 0.3
          }}
        >
          {i < current ? icon : ''}
        </div>
      ))}
    </div>
  );
}

/**
 * Render continuous resource bar
 */
function ContinuousBar({ current, max, gradient, color }) {
  const ratio = max > 0 ? current / max : 0;
  const percentage = Number.isFinite(ratio)
    ? Math.max(0, Math.min(100, ratio * 100))
    : 0;
  
  return (
    <div style={{
      width: '100%',
      height: '12px',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '6px',
      overflow: 'hidden',
      border: `1px solid ${color}`
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        background: gradient,
        transition: 'width 0.3s ease-out'
      }} />
    </div>
  );
}

/**
 * Main ClassResourceBar component
 */
export default function ClassResourceBar({ player }) {
  if (!player) return null;
  
  const resource = getClassResource(player);
  if (!resource) return null;
  
  const isDiscrete = resource.type === 'shards' || resource.type === 'charges' || resource.type === 'totems' || resource.type === 'undead';
  const hasBar = resource.current !== null && resource.max !== null;
  
  return (
    <div style={{
      marginBottom: '0.75rem',
      padding: '0.5rem',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '4px',
      border: `1px solid ${resource.color}40`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hasBar ? '0.25rem' : 0
      }}>
        <span style={{ color: resource.color, fontWeight: 'bold', fontSize: '0.9rem' }}>
          {resource.icon} {resource.label}
        </span>
        {hasBar && (
          <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
            {resource.current}/{resource.max}
          </span>
        )}
        {resource.extra && (
          <span style={{
            color: resource.color,
            fontSize: '0.8rem',
            fontWeight: 'bold',
            animation: resource.extra.includes('!') ? 'pulse 0.5s infinite' : 'none'
          }}>
            {resource.extra}
          </span>
        )}
      </div>
      
      {hasBar && (
        isDiscrete ? (
          <DiscreteBar
            current={resource.current}
            max={resource.max}
            color={resource.color}
            icon={resource.icon}
          />
        ) : (
          <ContinuousBar
            current={resource.current}
            max={resource.max}
            gradient={resource.gradient}
            color={resource.color}
          />
        )
      )}
    </div>
  );
}
