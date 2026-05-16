const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toNumberSafe = (value, fallback = 0) => (Number.isFinite(value) ? Number(value) : fallback);

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
  const angle = toNumberSafe(geometry?.angle, state.resonanceAngle);
  const deviation = Math.min(Math.abs(angle - 60), Math.abs(angle - 300));
  const resonanceBoost = clamp(1.15 - deviation / 180, 0.65, 1.15);

  const turbulencePenalty = school === "fluidmancy" ? clamp(1 - state.turbulence, 0.35, 1) : 1;
  const topologyPenalty = school === "topomancy" ? clamp(state.topologyIntegrity, 0.25, 1) : 1;

  return resonanceBoost * turbulencePenalty * topologyPenalty;
}

export function resolvePhysicsMagicCast(rawState, castRequest = {}) {
  const state = normalizePhysicsMagicState(rawState);
  const school = castRequest.school in MAGIC_SCHOOLS ? castRequest.school : "thermomancy";
  const scale = clamp(toNumberSafe(castRequest.scale, 1), 0.2, 5);
  const reversesEntropy = castRequest.reversesEntropy === true;
  const topologicalShift = clamp(toNumberSafe(castRequest.topologicalShift, 0.1), 0, 10);

  const baseEnergy = 12 * scale;
  const irreversibilityTax = reversesEntropy ? 3.2 : 1;
  const topologyTax = 1 + topologicalShift * 0.22;
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

  const takeMetabolic = Math.min(state.reservoirs.metabolic, requiredEnergy * 0.5);
  const takeThermal = Math.min(state.reservoirs.thermal, requiredEnergy * 0.25);
  const remaining = requiredEnergy - takeMetabolic - takeThermal;
  const takeKinetic = Math.min(state.reservoirs.kinetic, remaining * 0.6);
  const takePotential = Math.max(0, requiredEnergy - takeMetabolic - takeThermal - takeKinetic);

  const nextState = normalizePhysicsMagicState({
    ...state,
    reservoirs: {
      metabolic: state.reservoirs.metabolic - takeMetabolic,
      thermal: state.reservoirs.thermal - takeThermal,
      kinetic: state.reservoirs.kinetic - takeKinetic,
      potential: state.reservoirs.potential - takePotential,
    },
    entropyDebt: state.entropyDebt + requiredEnergy * (reversesEntropy ? 0.45 : 0.15),
    strain: state.strain + requiredEnergy * 0.08,
    turbulence: state.turbulence + (school === "fluidmancy" ? 0.08 * scale : 0.03 * scale),
    topologyIntegrity: state.topologyIntegrity - topologicalShift * 0.03,
  });

  return {
    ok: true,
    school,
    requiredEnergy,
    efficiency,
    stabilityRisk: clamp(nextState.strain / 100 + nextState.turbulence * 0.4 + (1 - nextState.topologyIntegrity) * 0.5, 0, 2),
    nextState,
  };
}
