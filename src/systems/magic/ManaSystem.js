/* eslint-disable no-unused-vars */
/* ManaSystem.js - Unified Mana/Strain/Resonance/ Taint Manager
 * Merges ecology capacity model + unified casting spendable mana/strain.
 * Tracks player.magic.state, applies resolution costs, reconciliation.
 * Resonance states, interference, decay stubs.
 */

import computeResolution from './ManaBalance.js';
import { canonicalize, CANONICAL_ESSENCES } from './constants.js';

const RESONANCE_THRESHOLDS = {
  quiet: 0,
  humming: 10,
  ringing: 25,
  shrieking: 50
};

const RESONANCE_STATES = ['quiet', 'humming', 'ringing', 'shrieking'];

export class ManaSystem {
  constructor(initialState = {}) {
    this.state = {
      manaMax: initialState.manaMax || 100,
      manaCurrent: initialState.manaCurrent || 100, // spendable, reconciled to free capacity
      manaUsed: 0, // reserves + charges/density
      strainMax: initialState.strainMax || 100,
      strainCurrent: initialState.strainCurrent || 0,
      resonanceCurrent: initialState.resonanceCurrent || 0,
      resonanceState: 'quiet',
      reserves: initialState.reserves || {}, // ecology raw storage {essence: amount}
      charges: initialState.charges || [], // {essence, amount, density, purity, taint, ...}
      taint: initialState.taint || {}, // {essence: level}
      interference: 0, // derived from opposition/taint/fullness
      stability: initialState.stability || { body: 100, mind: 100, cognitive: 100 }, // ecology
      ...initialState
    };
    this.reconcileMana();
  }

  // Reconciliation: ecology manaFree = unified manaCurrent
  reconcileMana() {
    let used = 0;
    for (let e in this.state.reserves) used += this.state.reserves[e];
    for (let ch of this.state.charges) used += ch.amount / (ch.density || 1);
    this.state.manaUsed = used;
    this.state.manaCurrent = Math.max(0, this.state.manaMax - used);
  }

  // Apply resolution costs (post-computeResolution)
  applyResolution(resolutionResult, ambientPotency = 1, attunePotency = 1) {
    if (resolutionResult.failed) return resolutionResult;

    // Spend mana
    this.state.manaCurrent -= resolutionResult.manaCost;

    // Add strain
    this.state.strainCurrent += resolutionResult.strainGain;

    // Resonance
    this.state.resonanceCurrent += resolutionResult.resonanceGain;
    this.updateResonanceState();

    // Overload backfire (if applicable)
    if (resolutionResult.overload > 0) {
      // Apply backfireDamage to HP or stability (stub)
      console.log(`Backfire damage: ${resolutionResult.backfireDamage}`);
    }

    // Decay/interference tick stub
    this.tickDecay();

    this.reconcileMana();
    return { success: true, newState: this.state };
  }

  updateResonanceState() {
    for (let state of RESONANCE_STATES) {
      if (this.state.resonanceCurrent <= RESONANCE_THRESHOLDS[state]) {
        this.state.resonanceState = state;
        return;
      }
    }
    this.state.resonanceState = 'shrieking';
  }

  // Cast wrapper: compute + apply
  cast(params) {
    const resolution = computeResolution({ ...params, manaCurrent: this.state.manaCurrent, strainCurrent: this.state.strainCurrent, strainMax: this.state.strainMax });
    if (resolution.error || resolution.failed) return resolution;
    return this.applyResolution(resolution);
  }

  // Ecology stubs: draw/refine etc. would update reserves/charges/taint
  drawEssence(essence, amount, ambient) {
    const canEss = canonicalize(essence);
    this.state.reserves[canEss] = (this.state.reserves[canEss] || 0) + amount;
    // Add taint from ambient etc.
    this.state.taint[canEss] = (this.state.taint[canEss] || 0) + (ambient?.taint || 0) * amount;
    this.reconcileMana();
  }

  tickDecay() {
    // Stub: decay charges/reserves, update interference
    this.state.interference = this.computeInterference();
    // Decay resonance slightly
    this.state.resonanceCurrent *= 0.95;
    this.updateResonanceState();
  }

  computeInterference() {
    // Stub: opposition pairs, taint, fullness
    return 0.1; // placeholder
  }

  // Get snapshot for UI/SENSE
  getSnapshot() {
    return {
      mana: this.state.manaCurrent,
      strain: { current: this.state.strainCurrent, max: this.state.strainMax },
      resonance: { current: this.state.resonanceCurrent, state: this.state.resonanceState },
      manaFree: this.state.manaCurrent, // post-reconcile
      interference: this.state.interference
    };
  }
}

// Export class + legacy compat
export default ManaSystem;

// Example
// const system = new ManaSystem();
// system.cast({ form: 'bolt', scale: 2, essences: ['arcane'], manaCurrent: 20 });
