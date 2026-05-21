const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toNumberSafe = (value, fallback = 0) => (Number.isFinite(value) ? Number(value) : fallback);

function getPhysicsMagicConfig(state) {
  return state?.config?.magicBalance?.physicsMagic || {};
}

export const MAGIC_SCHOOLS = Object.freeze({
  thermomancy: {
    domain: "thermodynamics",
    powerSource: "temperature_gradient",
    keyConstraint: "energy_conservation",
  },
  topomancy: {
    domain: "topology",
    powerSource: "geometric_configuration",
    keyConstraint: "topological_invariants",
  },
  graviturgy: {
    domain: "gravity",
    powerSource: "gravitational_potential",
    keyConstraint: "energy_momentum_conservation",
  },
  plasmaturgy: {
    domain: "electrodynamics",
    powerSource: "electromagnetic_field",
    keyConstraint: "maxwell_consistency",
  },
  fluidmancy: {
    domain: "fluid_dynamics",
    powerSource: "kinetic_flow",
    keyConstraint: "flow_stability",
  },
  quantum_arts: {
    domain: "quantum_geometry",
    powerSource: "phase_information",
    keyConstraint: "uncertainty_and_decoherence",
  },
});

export function normalizePhysicsMagicState(rawState = {}) {
  return {
    reservoirs: {
      metabolic: clamp(toNumberSafe(rawState?.reservoirs?.metabolic, 60), 0, 1_000),
      thermal: clamp(toNumberSafe(rawState?.reservoirs?.thermal, 20), 0, 1_000),
      kinetic: clamp(toNumberSafe(rawState?.reservoirs?.kinetic, 10), 0, 1_000),
      potential: clamp(toNumberSafe(rawState?.reservoirs?.potential, 10), 0, 1_000),
    },
    entropyDebt: clamp(toNumberSafe(rawState?.entropyDebt, 0), 0, 10_000),
    strain: clamp(toNumberSafe(rawState?.strain, 0), 0, 100),
    turbulence: clamp(toNumberSafe(rawState?.turbulence, 0), 0, 1),
    topologyIntegrity: clamp(toNumberSafe(rawState?.topologyIntegrity, 1), 0, 1),
    resonanceAngle: clamp(toNumberSafe(rawState?.resonanceAngle, 0), 0, 360),
  };
}

function computeSchoolEfficiency(school, state, geometry = {}) {
  const config = getPhysicsMagicConfig(state);
  const angle = toNumberSafe(geometry?.angle, state.resonanceAngle);
  const resonanceAngleOptimal = toNumberSafe(config.resonanceAngleOptimal, 60);
  const resonanceAngleAlt = toNumberSafe(config.resonanceAngleAlt, 300);
  const deviation = Math.min(Math.abs(angle - resonanceAngleOptimal), Math.abs(angle - resonanceAngleAlt));
  const resonanceBoostBase = toNumberSafe(config.resonanceBoostBase, 1.15);
  const resonanceBoostDeviationDivisor = toNumberSafe(config.resonanceBoostDeviationDivisor, 180);
  const resonanceBoostMin = toNumberSafe(config.resonanceBoostMin, 0.65);
  const resonanceBoost = clamp(resonanceBoostBase - deviation / resonanceBoostDeviationDivisor, resonanceBoostMin, resonanceBoostBase);

  const turbulencePenaltyMin = toNumberSafe(config.turbulencePenaltyMin, 0.35);
  const turbulencePenalty = school === "fluidmancy" ? clamp(1 - state.turbulence, turbulencePenaltyMin, 1) : 1;
  const topologyPenaltyMin = toNumberSafe(config.topologyPenaltyMin, 0.25);
  const topologyPenalty = school === "topomancy" ? clamp(state.topologyIntegrity, topologyPenaltyMin, 1) : 1;

  return resonanceBoost * turbulencePenalty * topologyPenalty;
}

export function resolvePhysicsMagicCast(rawState, castRequest = {}) {
  const state = normalizePhysicsMagicState(rawState);
  const config = getPhysicsMagicConfig(state);
  const school = castRequest.school in MAGIC_SCHOOLS ? castRequest.school : "thermomancy";
  const scale = clamp(toNumberSafe(castRequest.scale, 1), 0.2, 5);
  const reversesEntropy = castRequest.reversesEntropy === true;
  const topologicalShift = clamp(toNumberSafe(castRequest.topologicalShift, 0.1), 0, 10);

  const baseEnergyScale = toNumberSafe(config.baseEnergyScale, 12);
  const baseEnergy = baseEnergyScale * scale;
  const irreversibilityTax = reversesEntropy ? toNumberSafe(config.irreversibilityTax, 3.2) : toNumberSafe(config.reversibilityTax, 1);
  const topologyTaxMultiplier = toNumberSafe(config.topologyTaxMultiplier, 0.22);
  const topologyTax = 1 + topologicalShift * topologyTaxMultiplier;
  const efficiency = computeSchoolEfficiency(school, state, castRequest.geometry);

  const requiredEnergy = baseEnergy * irreversibilityTax * topologyTax / efficiency;
  const totalReserve = state.reservoirs.metabolic + state.reservoirs.thermal + state.reservoirs.kinetic + state.reservoirs.potential;

  if (requiredEnergy > totalReserve) {
    return {
      ok: false,
      reason: "Insufficient conserved energy across available reservoirs.",
      requiredEnergy,
      availableEnergy: totalReserve,
      state,
    };
  }

  const reservoirDistribution = config.reservoirDistribution || {};
  const takeMetabolic = Math.min(state.reservoirs.metabolic, requiredEnergy * toNumberSafe(reservoirDistribution.metabolic, 0.5));
  const takeThermal = Math.min(state.reservoirs.thermal, requiredEnergy * toNumberSafe(reservoirDistribution.thermal, 0.25));
  const remaining = requiredEnergy - takeMetabolic - takeThermal;
  const takeKinetic = Math.min(state.reservoirs.kinetic, remaining * toNumberSafe(reservoirDistribution.kinetic, 0.6));
  const takePotential = Math.max(0, requiredEnergy - takeMetabolic - takeThermal - takeKinetic);

  const entropyDebtMultiplier = config.entropyDebtMultiplier || {};
  const entropyMultiplier = reversesEntropy ? toNumberSafe(entropyDebtMultiplier.reversible, 0.45) : toNumberSafe(entropyDebtMultiplier.normal, 0.15);
  const strainMultiplier = toNumberSafe(config.strainMultiplier, 0.08);
  const turbulenceMultiplier = config.turbulenceMultiplier || {};
  const turbulenceMult = school === "fluidmancy" ? toNumberSafe(turbulenceMultiplier.fluidmancy, 0.08) : toNumberSafe(turbulenceMultiplier.default, 0.03);
  const topologyIntegrityDecay = toNumberSafe(config.topologyIntegrityDecay, 0.03);

  const nextState = normalizePhysicsMagicState({
    ...state,
    reservoirs: {
      metabolic: state.reservoirs.metabolic - takeMetabolic,
      thermal: state.reservoirs.thermal - takeThermal,
      kinetic: state.reservoirs.kinetic - takeKinetic,
      potential: state.reservoirs.potential - takePotential,
    },
    entropyDebt: state.entropyDebt + requiredEnergy * entropyMultiplier,
    strain: state.strain + requiredEnergy * strainMultiplier,
    turbulence: state.turbulence + turbulenceMult * scale,
    topologyIntegrity: state.topologyIntegrity - topologicalShift * topologyIntegrityDecay,
  });

  const stabilityRiskWeights = config.stabilityRiskWeights || {};
  const strainWeight = toNumberSafe(stabilityRiskWeights.strain, 0.01);
  const turbulenceWeight = toNumberSafe(stabilityRiskWeights.turbulence, 0.4);
  const topologyWeight = toNumberSafe(stabilityRiskWeights.topology, 0.5);

  return {
    ok: true,
    school,
    requiredEnergy,
    efficiency,
    stabilityRisk: clamp(nextState.strain * strainWeight + nextState.turbulence * turbulenceWeight + (1 - nextState.topologyIntegrity) * topologyWeight, 0, 2),
    nextState,
  };
}
