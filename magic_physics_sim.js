// Magic Physics Simulator - Implements essence weaving formulas from docs/magic_essence_weaving_spec.md
// CLI: node magic_physics_sim.js [--scenarios=magic_physics_scenarios.json] [--runs=1000] [--output=results.json]

const fs = require('fs');
const path = require('path');

const ESSENCES = ['fire', 'water', 'earth', 'air', 'lightning', 'shadow', 'light', 'life'];

const OPPOSITION_PENALTIES = {
  'fire+water': 0.25,
  'light+shadow': 0.35,
  'air+earth': 0.10,
  // Add more as needed
};

const CONFIG = {
  baseDrawRate: 4,
  drawStabilityBodyCostPerQuantum: 0.15,
  refineMindCostPerQuantum: 0.10,
  refinePurityBase: 0.55,
  refinePuritySkillScale: 0.35,
  compressionDensityTiers: [1.0, 1.5, 2.2, 3.3],
  compressionBodyCostBase: 2,
  compressionMindCostBase: 1,
  compressionMisfireBase: 0.03,
  shapeMindCostBase: 1,
  weaveCognitiveCostBase: 2,
  weaveBacklashBase: 0.02,
  baseChargeLifetimeTurns: 50,
  minStabilityForSafeWeaving: 40
};

class MagicSimulator {
  constructor(scenario) {
    this.scenario = scenario;
    this.player = { mana: { max: scenario.player?.mana?.max || 100, current: scenario.player?.mana?.current || 100 }, 
                    reserves: scenario.player?.reserves || {}, charges: scenario.player?.charges || [], 
                    attunement: scenario.player?.attunement || {}, affinity: scenario.player?.affinity || {},
                    stability: scenario.player?.stability || {body:100, mind:100, cognitive:100},
                    paradigm: scenario.player?.paradigm || null };
    this.world = scenario.world || { ambient: {} };
    this.stance = scenario.stance || 'open';
    this.currentTurn = scenario.currentTurn || 0;
    this.results = { actions: [], finalState: {}, metrics: {} };
  }

  stanceMultiplier() {
    const stances = { open: 1.0, focused: 1.25, guarded: 0.75 };
    return stances[this.stance] || 1.0;
  }

  attunementFactor(essence) {
    return Math.max(0, 0.25 + 0.075 * (this.player.attunement[essence] || 0));
  }

  affinityFactor(essence) {
    return 1 + (this.player.affinity[essence] || 0);
  }

  mindStabilityPct() {
    return this.player.stability.mind / 100;
  }

  clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  updateManaUsed() {
    let used = 0;
    for (let e in this.player.reserves) used += this.player.reserves[e];
    for (let ch of this.player.charges) used += ch.amount / ch.density;
    this.player.mana.current = Math.max(0, this.player.mana.max - used);
  }

  executeDraw(essence, amount) {
    const env = Math.max(this.world.ambient[essence] || 0, 0); // Simplified, no sources
    const att = this.attunementFactor(essence);
    const aff = this.affinityFactor(essence);
    const stanceMult = this.stanceMultiplier();
    const drawRate = CONFIG.baseDrawRate * env * att * aff * stanceMult;
    const actualAmount = Math.min(drawRate, amount || Infinity, this.player.mana.current);
    if (actualAmount > 0) {
      this.player.reserves[essence] = (this.player.reserves[essence] || 0) + actualAmount;
      this.player.stability.body -= actualAmount * CONFIG.drawStabilityBodyCostPerQuantum;
      this.updateManaUsed();
    }
    return actualAmount;
  }

  executeRefine(essence, method, amount) {
    const reserves = this.player.reserves[essence] || 0;
    const actualAmount = Math.min(amount, reserves);
    if (actualAmount > 0) {
      const refineSkillFactor = this.clamp01(0.15 * (this.player.attunement[essence] || 0) + 0.5 * this.mindStabilityPct());
      const purity = this.clamp01(CONFIG.refinePurityBase + CONFIG.refinePuritySkillScale * refineSkillFactor);
      const lifetimeTurns = CONFIG.baseChargeLifetimeTurns * (0.6 + 0.4 * purity);
      this.player.charges.push({
        id: `chg_${Date.now()}`,
        essence,
        amount: actualAmount,
        density: 1.0,
        purity,
        binding: { type: 'rhythm', pattern: method || 'spiral' },
        createdTurn: this.currentTurn,
        expiresTurn: this.currentTurn + lifetimeTurns
      });
      this.player.reserves[essence] -= actualAmount;
      this.player.stability.mind -= actualAmount * CONFIG.refineMindCostPerQuantum;
      this.updateManaUsed();
    }
    return actualAmount;
  }

  executeCompress(chargeId, tier) {
    const charge = this.player.charges.find(c => c.id === chargeId);
    if (!charge) return false;
    const density = CONFIG.compressionDensityTiers[tier];
    const amount = charge.amount;
    const risk = (density - 1) * 0.06 + (amount / 50) * 0.04;
    const stabilityPenalty = 0.15 * (1 - this.player.stability.body/100) + 0.10 * (1 - this.player.stability.mind/100);
    const misfireChance = this.clamp01(CONFIG.compressionMisfireBase + risk + stabilityPenalty);
    if (Math.random() < misfireChance) {
      // Misfire outcomes (random)
      const outcomes = ['partial', 'heat_spike', 'leak', 'release'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      this.results.actions.push({ type: 'compress_misfire', outcome, tier });
      return false;
    }
    charge.density = density;
    this.player.stability.body -= CONFIG.compressionBodyCostBase * amount * Math.pow(density, 1.2) / 10;
    this.player.stability.mind -= CONFIG.compressionMindCostBase * amount * Math.pow(density, 1.1) / 10;
    this.updateManaUsed();
    return true;
  }

  oppositionPenalty(essences) {
    const sorted = essences.slice().sort().join('+');
    return OPPOSITION_PENALTIES[sorted] || 0;
  }

  executeWeave(essences, pattern) {
    if (essences.length === 0) return null;
    let totalAmount = 0, avgPurity = 0, densityAvg = 1.0;
    for (let e of essences) {
      const ch = this.player.charges.find(c => c.essence === e && c.amount > 0);
      if (ch) {
        totalAmount += ch.amount;
        avgPurity += ch.purity / essences.length;
        densityAvg += ch.density / essences.length;
      }
    }
    const oppPenalty = this.oppositionPenalty(essences);
    const baseCoherence = avgPurity * (1 - oppPenalty);
    const stabilityFactor = 0.4 + 0.3 * this.mindStabilityPct() + 0.3 * (this.player.stability.cognitive / 100);
    const theoryFactor = this.player.paradigm && this.player.paradigm.tenets.includes('transform_allowed') ? 1.0 : 0.6;
    const coherence = baseCoherence * stabilityFactor * theoryFactor;
    const successChance = this.clamp01(coherence - (totalAmount / 200));
    const backlashChance = this.clamp01(CONFIG.weaveBacklashBase + (1 - coherence) * 0.20 + (densityAvg - 1) * 0.05);
    
    const success = Math.random() < successChance;
    const backlash = !success && Math.random() < backlashChance;
    // Consume charges proportionally
    for (let e of essences) {
      const ch = this.player.charges.find(c => c.essence === e);
      if (ch) ch.amount = Math.max(0, ch.amount - totalAmount / essences.length);
    }
    this.player.stability.cognitive -= CONFIG.weaveCognitiveCostBase + 0.08 * totalAmount;
    this.player.stability.mind -= 1 + 0.05 * totalAmount;
    this.updateManaUsed();
    
    const magnitude = totalAmount * (1 + 0.35 * (densityAvg - 1)) * 1.0 * 1.0 * this.clamp01(0.4 + 0.06 * (this.player.attunement[essences[0]] || 0) + 0.3 * this.mindStabilityPct()); // Simplified geometry/intent/control
    return { success, backlash, coherence, magnitude, totalAmount };
  }

  // Simplified executeAction wrapper for seq
  executeActions(actions) {
    for (let act of actions) {
      if (act.type === 'draw') {
        this.results.actions.push({type: 'draw', essence: act.essence, amount: this.executeDraw(act.essence, act.amount)});
      } else if (act.type === 'refine') {
        const chId = this.player.charges.length ? this.player.charges[this.player.charges.length - 1]?.id : null;
        this.results.actions.push({type: 'refine', essence: act.essence, amount: this.executeRefine(act.essence, act.method, act.amount)});
      } else if (act.type === 'compress') {
        const chId = this.player.charges[this.player.charges.length - 1]?.id;
        this.results.actions.push({type: 'compress', tier: act.tier, success: this.executeCompress(chId, act.tier)});
      } else if (act.type === 'weave') {
        this.results.actions.push(this.executeWeave(act.essences, act.pattern));
      } // Add shape/release/sense etc. as needed
    }
    // Clean expired charges
    this.player.charges = this.player.charges.filter(ch => this.currentTurn < ch.expiresTurn);
  }

  run() {
    this.executeActions(this.scenario.actions || []);
    this.results.finalState = {
      manaFree: this.player.mana.current,
      stability: this.player.stability,
      charges: this.player.charges,
      reserves: this.player.reserves
    };
    return this.results;
  }
}

function oppositionKey(essences) {
  return essences.slice().sort().join('+');
}

function simScenario(scenarioStr, runs = 1000) {
  let totalMag = 0, successes = 0, backlashes = 0, stabilityDeltas = {body: [], mind: [], cognitive: []};
  const scenario = JSON.parse(scenarioStr);
  const sim = new MagicSimulator(scenario);
  const initStability = {...sim.player.stability};

  for (let i = 0; i < runs; i++) {
    const runSim = new MagicSimulator(scenario);
    const res = runSim.run();
    const weaveRes = res.actions.find(a => a.coherence !== undefined);
    if (weaveRes) {
      totalMag += weaveRes.magnitude || 0;
      if (weaveRes.success) successes++;
      if (weaveRes.backlash) backlashes++;
    }
    ['body', 'mind', 'cognitive'].forEach(s => {
      stabilityDeltas[s].push(runSim.player.stability[s] - initStability[s]);
    });
  }

  const metrics = {
    avgMagnitude: totalMag / runs,
    successPct: (successes / runs) * 100,
    backlashPct: (backlashes / runs) * 100,
    stabilityDeltaMean: {
      body: stabilityDeltas.body.reduce((a,b)=>a+b,0)/runs,
      mind: stabilityDeltas.mind.reduce((a,b)=>a+b,0)/runs,
      cognitive: stabilityDeltas.cognitive.reduce((a,b)=>a+b,0)/runs
    }
  };

  return { scenarioId: scenario.id, runs, ...metrics };
}

const args = process.argv.slice(2);
const scenariosFile = args.find(a => a.includes('--scenarios='))?.split('=')[1] || 'magic_physics_scenarios.json';
const runs = parseInt(args.find(a => a.includes('--runs='))?.split('=')[1]) || 1000;
const output = args.find(a => a.includes('--output='))?.split('=')[1] || 'magic_physics_results.json';

const scenariosData = JSON.parse(fs.readFileSync(scenariosFile, 'utf8'));
const results = scenariosData.map(scen => simScenario(JSON.stringify(scen), runs));

fs.writeFileSync(output, JSON.stringify(results, null, 2));
console.log(`Sim complete: ${results.length} scenarios x ${runs} runs -> ${output}`);
console.log('Sample:', JSON.stringify(results[0], null, 2));
