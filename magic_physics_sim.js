/* global require, process, fs, path, console, Math */
/* eslint-disable no-undef */
// Magic Physics Simulator - Unified version using new ManaBalance/ManaSystem
// CLI: node magic_physics_sim.js [--scenarios=magic_physics_scenarios.json] [--runs=1000] [--output=results.json]
// Now resolves inconsistencies with canonical resolution formulas

const fs = require('fs');
const path = require('path');

// New unified imports
const { canonicalize, CANONICAL_ESSENCES, FORM_DATA, UNIFIED_FORMS } = require('./src/systems/magic/constants.js');
const computeResolution = require('./src/systems/magic/ManaBalance.js');
const ManaSystem = require('./src/systems/magic/ManaSystem.js').default;

class MagicSimulator {
  constructor(scenario) {
    this.scenario = scenario;
    // Init unified ManaSystem
    this.manaSystem = new ManaSystem(scenario.player);
    this.world = scenario.world || { ambient: {} };
    this.stance = scenario.stance || 'open';
    this.currentTurn = scenario.currentTurn || 0;
    this.results = { actions: [], finalState: {}, metrics: {} };
  }

  // Legacy compat + extensions
  executeDraw(essence, amount) {
    const env = Math.max(this.world.ambient[essence] || 0, 0);
    const drawAmount = Math.min(env * 4, amount || Infinity, this.manaSystem.state.manaCurrent); // simplified rate
    if (drawAmount > 0) {
      this.manaSystem.drawEssence(essence, drawAmount, this.world.ambient);
      this.results.actions.push({ type: 'draw', essence, amount: drawAmount });
    }
    return drawAmount;
  }

  executeRefine(essence, method, amount) {
    // Stub: populate reserves first if needed, then refine (simplified)
    const reserves = this.manaSystem.state.reserves[essence] || 0;
    const actual = Math.min(amount, reserves);
    if (actual > 0) {
      // Simulate refine by adding charge (not full impl)
      this.manaSystem.state.charges.push({
        id: `chg_${Date.now()}`,
        essence,
        amount: actual,
        density: 1.0,
        purity: 0.7
      });
      this.manaSystem.state.reserves[essence] -= actual;
      this.manaSystem.reconcileMana();
      this.results.actions.push({ type: 'refine', essence, amount: actual });
    }
    return actual;
  }

  executeCompress(chargeId, tier) {
    // Simplified stub
    this.results.actions.push({ type: 'compress', chargeId, tier, success: true }); // placeholder
    return true;
  }

  executeCast(form, scale = 1, essences = [], delivery = 'instant', classMults = {mana:1, strain:1}, attuneMults = {mana:1, strain:1}, potencies = {bias:0, ambient:1, attune:1}) {
    const params = {
      form,
      scale,
      essences: essences.map(canonicalize),
      delivery,
      classManaMult: classMults.mana,
      classStrainMult: classMults.strain,
      attuneManaMult: attuneMults.mana,
      attuneStrainMult: attuneMults.strain,
      potencyBias: potencies.bias,
      ambientPotency: potencies.ambient,
      attunePotency: potencies.attune,
      manaCurrent: this.manaSystem.state.manaCurrent,
      strainCurrent: this.manaSystem.state.strainCurrent,
      strainMax: this.manaSystem.state.strainMax
    };
    const resolution = this.manaSystem.cast(params);
    this.results.actions.push({ type: 'cast', form, params, resolution });
    this.currentTurn++;
    this.manaSystem.tickDecay();
    return resolution;
  }

  executeActions(actions) {
    for (let act of actions) {
      if (act.type === 'draw') {
        this.executeDraw(act.essence, act.amount);
      } else if (act.type === 'refine') {
        this.executeRefine(act.essence, act.method, act.amount);
      } else if (act.type === 'compress') {
        this.executeCompress(act.chargeId, act.tier);
      } else if (act.type === 'cast' || act.type === 'weave' || act.type === 'shape') {
        this.executeCast(act.form || act.pattern, act.scale, act.essences || [act.essence], act.delivery, act.mults, act.potencies);
      }
    }
  }

  run() {
    this.executeActions(this.scenario.actions || []);
    this.results.finalState = this.manaSystem.getSnapshot();
    return this.results;
  }
}

// simScenario etc. same, but now uses unified metrics (damageMult, resonanceGain, overload etc.)
function simScenario(scenarioStr, runs = 1000) {
  let totalDamage = 0, successes = 0, backfires = 0, resonanceGains = [], manaCosts = [];
  const scenario = JSON.parse(scenarioStr);

  for (let i = 0; i < runs; i++) {
    const sim = new MagicSimulator(scenario);
    const res = sim.run();
    const casts = res.actions.filter(a => a.resolution && a.resolution.success !== undefined);
    for (let c of casts) {
      const r = c.resolution;
      totalDamage += r.damageMultiplier || 0;
      if (r.success) successes++;
      if (r.backfireDamage > 0) backfires++;
      if (r.resonanceGain) resonanceGains.push(r.resonanceGain);
      if (r.manaCost) manaCosts.push(r.manaCost);
    }
  }

  const avgDamage = totalDamage / (runs * scenario.actions.filter(a => a.type.includes('cast')).length || 1);
  const avgResonance = resonanceGains.reduce((a,b)=>a+b,0) / resonanceGains.length || 0;
  const avgManaCost = manaCosts.reduce((a,b)=>a+b,0) / manaCosts.length || 0;

  return { 
    scenarioId: scenario.id, 
    runs, 
    avgDamageMult: avgDamage,
    successPct: (successes / runs) * 100,
    backfirePct: (backfires / runs) * 100,
    avgResonanceGain: avgResonance,
    avgManaCost
  };
}

const args = process.argv.slice(2);
const scenariosFile = args.find(a => a.includes('--scenarios='))?.split('=')[1] || 'magic_physics_scenarios.json';
const runs = parseInt(args.find(a => a.includes('--runs='))?.split('=')[1]) || 1000;
const output = args.find(a => a.includes('--output=') )?.split('=')[1] || 'magic_physics_results_unified.json';

const scenariosData = JSON.parse(fs.readFileSync(scenariosFile, 'utf8'));
const results = scenariosData.map(scen => simScenario(JSON.stringify(scen), runs));

fs.writeFileSync(output, JSON.stringify(results, null, 2));
console.log(`Unified Sim complete: ${results.length} scenarios x ${runs} runs -> ${output}`);
console.log('Sample:', JSON.stringify(results[0], null, 2));

