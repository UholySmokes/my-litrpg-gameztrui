import { on } from '../../core/EventBus.js';

const hudState = {
  effects: [],
  passives: [],
  cooldowns: [],
  logs: []
};

function formatSystem(message) {
  return `[System] ${message}`;
}

export function bindCombatEvents() {
  on('combat:log', payload => {
    if (payload.type === 'damage') {
      const { attacker, defender, result } = payload;
      hudState.logs.push(formatSystem(`${attacker} hit ${defender} for ${result.damage}. ${result.messages.join(' | ')}`));
    }
    if (payload.type === 'pipeline') {
      const lines = payload.log.map(s => `${s.stage}: ${s.value} (${s.reason})`).join(' → ');
      hudState.logs.push(formatSystem(`Damage Pipeline: ${lines}`));
    }
  });
  on('effect:applied', ({ effectName }) => {
    hudState.effects.push(effectName);
    hudState.logs.push(formatSystem(`You have gained the effect '${effectName}'`));
  });
  on('cooldown:updated', ({ skillName, remaining }) => {
    const idx = hudState.cooldowns.findIndex(c => c.skillName === skillName);
    if (idx === -1) hudState.cooldowns.push({ skillName, remaining });
    else hudState.cooldowns[idx].remaining = remaining;
    hudState.logs.push(formatSystem(`Cooldown '${skillName}': ${remaining}s`));
  });
  on('race:passive', ({ passiveName }) => {
    if (!hudState.passives.includes(passiveName)) hudState.passives.push(passiveName);
    hudState.logs.push(formatSystem(`Passive Active: '${passiveName}'`));
  });
}

export function getHUDState() {
  return { ...hudState, logs: [...hudState.logs].slice(-10) };
}

export function clearHUD() {
  hudState.effects = [];
  hudState.passives = [];
  hudState.cooldowns = [];
  hudState.logs = [];
}

